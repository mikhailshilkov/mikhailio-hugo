---
title: Sending Large Batches to Azure Service Bus
date: 2017-07-04
thumbnail: teaser.png
description: Azure Service Bus client supports sending messages in batches. However, the size of a single batch must stay below 256k bytes, otherwise the whole batch will get rejected.
tags: ["Azure", "Azure Service Bus"]
---

Azure Service Bus client supports sending messages in batches (`SendBatch`
and `SendBatchAsync` methods of `QueueClient` and `TopicClient`). However,
the size of a single batch must stay below 256k bytes, otherwise the whole
batch will get rejected.

How do we make sure that the batch-to-be-sent is going to fit? The rest 
of this article will try to answer this seemingly simple question.

Problem Statement
-----------------

Given a list of messages of arbitrary type `T`, we want to send them to Service
Bus in batches. The amount of batches should be close to minimal, but
obviously each one of them must satisfy the restriction of 256k max size.

So, we want to implement a method with the following signature:

``` csharp
public Task SendBigBatchAsync<T>(IEnumerable<T> messages);
```

which would work for collections of any size.

To limit the scope, I will restrict the article to the following assumptions:

- Each individual message is less than 256k serialized. If that wasn't true,
we'd have to put the body into external blob storage first, and then send
the reference. It's not directly related to the topic of discussion.

- I'll use `public BrokeredMessage(object serializableObject)` constructor.
Custom serialization could be used, but again, it's not related to batching,
so I'll ignore it.

- We won't care about transactions, i.e. if connectivity dies in the middle
of sending the big batch, we might end up with partially sent batch.

Messages of Known Size
----------------------

Let's start with a simple use case: the size of each message is known to us. 
It's defined by hypothetical `Func<T, long> getSize` function. Here is a 
helpful extension method that will split an arbitrary collection based on
a metric function and maximum chunk size:

``` csharp
public static List<List<T>> ChunkBy<T>(this IEnumerable<T> source, Func<T, long> metric, long maxChunkSize)
{
    return source
        .Aggregate(
            new
            {
                Sum = 0L,
                Current = (List<T>)null,
                Result = new List<List<T>>()
            },
            (agg, item) =>
            {
                var value = metric(item);
                if (agg.Current == null || agg.Sum + value > maxChunkSize)
                {
                    var current = new List<T> { item };
                    agg.Result.Add(current);
                    return new { Sum = value, Current = current, agg.Result };
                }

                agg.Current.Add(item);
                return new { Sum = agg.Sum + value, agg.Current, agg.Result };
            })
        .Result;
}
```

Now, the implementation of `SendBigBatchAsync` is simple:

``` csharp
public async Task SendBigBatchAsync(IEnumerable<T> messages, Func<T, long> getSize)
{
    var chunks = messages.ChunkBy(getSize, MaxServiceBusMessage);
    foreach (var chunk in chunks)
    {
        var brokeredMessages = chunk.Select(m => new BrokeredMessage(m));
        await client.SendBatchAsync(brokeredMessages);
    }
}

private const long MaxServiceBusMessage = 256000;
private readonly QueueClient client;
```

Note that I do `await` for each chunk sequentially to preserve message ordering.
Another thing to notice is that we lost all-or-nothing guarantee: we might
be able to send the first chunk, and then get an exception from subsequent
parts. Some sort of retry mechanism is probably needed.

BrokeredMessage.Size
--------------------

OK, how do we determine the size of each message? How do we implement 
`getSize` function? 

`BrokeredMessage` class exposes `Size` property, so it might be tempting to
rewrite our method the following way:

``` csharp
public async Task SendBigBatchAsync<T>(IEnumerable<T> messages)
{
    var brokeredMessages = messages.Select(m => new BrokeredMessage(m));
    var chunks = brokeredMessages.ChunkBy(bm => bm.Size, MaxServiceBusMessage);
    foreach (var chunk in chunks)
    {
        await client.SendBatchAsync(chunk);
    }
}
```

Unfortunately, this won't work properly. A quote from documentation:

> The value of Size is only accurate after the BrokeredMessage 
> instance is sent or received.

My experiments show that `Size` of a draft message returns the size of 
the message body, ignoring headers. If the message bodies are large, and
each chunk has just a handful of them, the code might work ok-ish. 

But it will significantly underestimate the size of large batches of messages
with small payload.

So, for the rest of this article I'll try to adjust the calculation for headers.

Fixed Header Size
-----------------

It could be that the header size of each message is always the same.
Quite often people will set the same headers for all their messages,
or set no custom headers at all. 

In this case, you might just measure this size once, and then put this
fixed value inside a configuration file.

Here is how you measure the headers of a `BrokeredMessage` message:

``` csharp
var sizeBefore = message.Size;
client.Send(message);
var sizeAfter = message.Size;
var headerSize = sizeAfter - sizeBefore;
```

Now you just need to adjust one line from the previous version of 
`SendBigBatchAsync` method

``` csharp
var chunks = brokeredMessages.ChunkBy(bm => FixedHeaderSize + bm.Size, MaxServiceBusMessage);
```

`FixedHeaderSize` might be simply hard-coded, or taken from configuration
per application.

Measuring of Header Size per Message
------------------------------------

If the size of headers varies per message, you need a way to adjust batching
algorithm accordingly. 

Unfortunately, I haven't found a straightforward way to accomplish that. It looks like
you'd have to serialize the headers yourself, and then measure the size of
resulting binary. This is not a trivial operation to do correctly,
and also implies some performance penalty.

Sean Feldman [came up](https://weblogs.asp.net/sfeldman/asb-batching-brokered-messages) 
with a way to *estimate* the size of headers. That might be a good way to go,
though the estimation tends to err on the safe side for messages with small
payload.

Heuristics & Retry
------------------

The last possibility that I want to consider is actually allow yourself
violating the max size of the batch, but then handle the exception, retry
the send operation and adjust future calculations based on actual measured size
of the failed messages. The size is known after trying to `SendBatch`, even if
operation failed, so we can use this information.

Here is a sketch of how to do that in code:

``` csharp
// Sender is reused across requests
public class BatchSender
{
    private readonly QueueClient queueClient;
    private long batchSizeLimit = 262000;
    private long headerSizeEstimate = 54; // start with the smallest header possible

    public BatchSender(QueueClient queueClient)
    {
        this.queueClient = queueClient;
    }

    public async Task SendBigBatchAsync<T>(IEnumerable<T> messages)
    {
        var packets = (from m in messages
                     let bm = new BrokeredMessage(m)
                     select new { Source = m, Brokered = bm, BodySize = bm.Size }).ToList();
        var chunks = packets.ChunkBy(p => this.headerSizeEstimate + p.Brokered.Size, this.batchSizeLimit);
        foreach (var chunk in chunks)
        {
            try
            {
                await this.queueClient.SendBatchAsync(chunk.Select(p => p.Brokered));
            }
            catch (MessageSizeExceededException)
            {
                var maxHeader = packets.Max(p => p.Brokered.Size - p.BodySize);
                if (maxHeader > this.headerSizeEstimate)
                {
                    // If failed messages had bigger headers, remember this header size 
                    // as max observed and use it in future calculations
                    this.headerSizeEstimate = maxHeader;
                }
                else
                {
                    // Reduce max batch size to 95% of current value
                    this.batchSizeLimit = (long)(this.batchSizeLimit * .95);
                }

                // Re-send the failed chunk
                await this.SendBigBatchAsync(packets.Select(p => p.Source));
            }

        }
    }
}
```

The code example is quite involved, here is what actually happens:

1. Create a brokered message for each message object, but also save the
corresponding source message. This is critical to be able to re-send items:
there's no way to send the same `BrokeredMessage` instance twice.

2. Also save the body size of the brokered message. We'll use it for retry
calculation.

3. Start with some guess of header size estimate. I start with 54 bytes, 
which seems to be the minimal header size possible.

4. Split the batch into chunks the same way we did before.

5. Try sending chunks one by one.

6. If send operation fails with `MessageSizeExceededException`, iterate
through failed items and find out the actual header size of the message.

7. If that actual size is bigger than our known estimate, increase the estimate
to the newly observed value. Retry sending the chunk (not the whole batch) with
this new setting.

8. If the header is small, but message size is still too big - reduce the 
allowed total size of the chunk. Retry again.

The combination of checks of steps 7 and 8 should make the mechanism reliable
and self-adopting to message header payloads.

Since we reuse the sender between send operations, the size parameters will
also converge quite quickly and no more retries will be needed. Thus the 
performance overhead should be minimal.

Conclusion
----------

It seems like there is no "one size fits all" solution for this problem at 
the moment. The best implementation might depend on your messaging 
requirements.

But if you have the silver bullet solution, please leave a comment under
this post and answer [my StackOverflow question](https://stackoverflow.com/questions/44779707/split-batch-of-messages-to-be-sent-to-azure-service-bus)!

Otherwise, let's hope that the new 
[.NET Standard-compatible Service Bus client](https://github.com/azure/azure-service-bus-dotnet)
will solve this issue for us. Track [this github issue](https://github.com/Azure/azure-service-bus-dotnet/issues/109)
for status updates.