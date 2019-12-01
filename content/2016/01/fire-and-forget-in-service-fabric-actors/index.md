---
title: Fire-and-forget in Service Fabric actors
date: 2016-01-13
tags: ["Actor Model", "Azure", "Akka.NET", "Service Fabric"]
description: "At the [recent Webscale Architecture meetup](http://www.meetup.com/Webscale-Architecture-NL/events/225979118/) we discussed two implementations of the Actor model in the .NET ecosystem: [Akka.NET](http://akka.net) and [Azure Service Fabric Actors](https://azure.microsoft.com/en-us/documentation/articles/service-fabric-reliable-actors-introduction/). One important discussion was around **Ask** vs **Tell** call model. With **Tell** model, the Sender just sends the message to the Recipient without waiting for a result to come back. **Ask** model means the Sender will at some point get a response back from the Receiver, potencially blocking its own execution."
---

At the [recent Webscale Architecture meetup](http://www.meetup.com/Webscale-Architecture-NL/events/225979118/)
we discussed two implementations of the Actor model in the .NET ecosystem:
[Akka.NET](http://akka.net) and [Azure Service Fabric Actors](https://azure.microsoft.com/en-us/documentation/articles/service-fabric-reliable-actors-introduction/).
One important discussion was
around **Ask** vs **Tell** call model. With **Tell** model, the Sender just sends the
message to the Recepient without waiting for a result to come back. **Ask** model
means the Sender will at some point get a response back from the Receiver, potencially
blocking its own execution.

The default model of Akka.NET is **Tell**:

> **Tell: Fire-forget**

> This is the preferred way of sending messages. No blocking waiting for
> a message. This gives the best concurrency and scalability characteristics.

On the contrary, the default model for Service Fabric Actors is RPC-like
**Ask** model. Let's have a close look at this model, and then see how we can
implement **Tell** (or **Fire-and-Forget**) model.

Actor definition starts with an interface:

    public interface IHardWorkingActor : IActor
    {
        Task DoWork(string payload);
    }

As you can see, the method does not return any useful data, which means
the client code isn't really interested in waiting for the operation to
complete. Here's how we implement this interface in the Actor class:

    public class HardWorkingActor : Actor, IHardWorkingActor
    {
        public async Task DoWork(string payload)
        {
            ActorEventSource.Current.ActorMessage(this, "Doing Work");
            await Task.Delay(500);
        }
    }

This test implementation simulates the hard work by means of an artificial 500 ms delay.

Now, let's look at the client code. Let's say, the client receives the payloads
from a queue or a web front-end and needs to go as fast as possible. It gets a payload,
creates an actor proxy to dispatch the payload to, then it just wants
to continue with the next payload. Here is the "Ask" implementation based on
the Service Fabric samples:

    int i = 0;
    var timer = new Stopwatch();
    timer.Start();
    while (true)
    {
        var proxy = ActorProxy.Create<IHardWorkingActor>(ActorId.NewId(), "fabric:/Application1");
        await proxy.DoWork($"Work ${i++}");
        Console.WriteLine($@"Sent work to Actor {proxy.GetActorId()},
                             rate is {i / timer.Elapsed.TotalSeconds}/sec");
    }

Note an `await` operator related to every call. That means that the client will
block until the actor work is complete. When we run the client, no surprise that
we get the rate of about 2 messages per second:

    Sent work to Actor 1647857287613311317, rate is 1,98643230380293/sec

That's not very exciting. What we want instead is to tell the actor to do the
work and immediately proceed to the next one. Here's how the client call should
look like:

    proxy.DoWork($"Work ${i++}").FireAndForget();

Instead of `await`-ing, we make a `Task`, pass it to some (not yet existing)
extension method and proceed immediately. It appears that the implementation
of such extension method is trivial:

    public static class TaskHelper
    {
        public static void FireAndForget(this Task task)
        {
            Task.Run(async() => await task).ConfigureAwait(false);
        }
    }

The result looks quite different from what we had before:

    Sent work to Actor -8450334792912439527, rate is 408,484162592517/sec

400 messages per second, which is some 200x difference...

The conclusions are simple:

- Service Fabric is a powerful platform and programming paradigm which doesn't
limit your choice of communication patterns

- Design the communication models carefully based on your use case, don't
take the defaults for granted