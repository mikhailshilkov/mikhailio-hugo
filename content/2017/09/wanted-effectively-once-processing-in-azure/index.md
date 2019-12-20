---
title: "Wanted: Effectively-Once Processing in Azure"
date: 2017-09-25
thumbnail: teaser.png
description: "Are there any known patterns / tools / frameworks to provide scalable, stateful, effectively-once,
end-to-end processing of messages, to be hosted in Azure?"
tags: ["Azure", "Architecture", "Data Processing", "Stream Processing"]
---

*This experimental post is a question. The question is too broad for StackOverflow, so I'm posting it here. Please engage in the comments section, or forward the link to subject experts.*

TL;DR: Are there any known patterns / tools / frameworks to provide scalable, stateful, effectively-once, end-to-end
processing of messages, to be hosted in Azure, preferably on PaaS-level of service?

Motivational Example
--------------------

Let's say we are making a TODO app. There is a constant flow of requests
to create a TODO in the system. Each request contains just two fields:
a title and a project ID which TODO should belong to. Here is the definition:

``` fsharp
type TodoRequest = {
  ProjectId: int
  Title: string
}
```

Now, we want to process the request and assign each TODO an identifier,
which should be an auto-incremented integer. Numeration is unique per project,
so each TODO must have its own combination of `ProjectId` and `Id`:

``` fsharp
type Todo = {
  ProjectId: int
  Id: int
  Title: string
}
```

Now, instead of relying on some database sequences, I want to describe this
transformation as a function. The function has the type `(TodoRequest, int) ->
(Todo, int)`, i.e. it transforms a tuple of a request and current per-project
state (last generated ID) to a tuple of a TODO and post-processing state:

``` fsharp
let create (request: TodoRequest, state: int) =
  let nextId = state + 1
  let todo = {
    ProjectId = request.ProjectId
    Id = nextId
    Title = request.Title
  }
  todo, nextId
```

This is an extremely simple function, and I can use it to great success to
process local, non-durable data.

But if I need to make a reliable distributed application out of it, I need
to take care of lots of things:

1. No request should be lost. I need to persist all the requests into
a durable storage in case of processor crash.

2. Similarly, I need to persist TODO's too. Presumably, some downstream
logic will use the persisted data later on in TODO's lifecycle.

3. The state (the counter) must be durable too. In case of crash of processing
function, I want to be able to restart processing after recovery.

4. Processing of the requests should be sequential per project ID. Otherwise
I might get a clash of ID's in case two requests belonging to the same
project are processed concurrently.

5. I still want requests to different projects to be processed in parallel,
to make sure the system scales up with the growth of project count.

6. There must be no holes or duplicates in TODO numbering per project, even
in face of system failures. In worst case, I agree to tolerate a duplicated
entry in the output log, but it must be exactly the same entry (i.e. two
entries with same project id, id and title).

7. The system should tolerate a permanent failure of any single hardware
dependency and automatically fail-over within reasonable time.

It's not feasible to meet all of those requirements without relying on some
battle-tested distributed services or frameworks.

Which options do I know of?

Transactions
------------

Traditionally, this kind of requirements were solved by using transactions
in something like SQL Server. If I store requests, TODO's and current ID per
project in the same relational database, I can make each processing step a
single atomic transaction.

This addresses all the concerns, as long as we can stay inside the single
database. That's probably a viable option for the TODO app, but less of so
if I convert my toy example to some real applications like IoT data
processing.

Can we do the same for distributed systems at scale?

Azure Event Hubs
----------------

Since I touched IoT space, the logical choice would be to store our entries
in Azure Event Hubs. That works for many criteria, but I don't see any available
approach to make such processing consistent in the face of failures.

When processing is done, we need to store 3 pieces: generated TODO event,
current processing offset and current ID. Event goes to another event hub,
processing offset is stored in Blob Storage and ID can be saved to something
like Table Storage.

But there's no way to store those 3 pieces atomically. Whichever order we
choose, we are bound to get anomalies in some specific failure modes.

Azure Functions
---------------

Azure Functions don't solve those problems. But I want to mention this
Function-as-a-Service offering because they provide an ideal programming
model for my use case.

I need to take just one step from my domain function to Azure Function:
to define bindings for e.g. Event Hubs and Table Storage.

However, reliability guarantees will stay poor. I won't get neither sequential
processing per Event Hub partition key, nor atomic state commit.

Azure Service Fabric
--------------------

Service Fabric sounds like a good candidate service for reliable processing.
Unfortunately, I don't have much experience with it to judge.

Please leave a comment if you do.

JVM World
---------

There are products in JVM world which claim to solve my problem perfectly.

Apache Kafka was the inspiration for Event Hubs log-based messaging. The recent
Kafka release provides effectively-once processing semantics as long as
data stay inside Kafka. Kafka does that with atomic publishing to multiple
topics, and state storage based on compacted topics.

Apache Flink has similar guarantees for its stream processing APIs.

Great, but how do I get such awesomeness in .NET code, and without installing
expensive ZooKeeper-managed clusters?

Call for Feedback
-----------------

Do you know a solution, product or service?

Have you developed effectively-once processing on .NET / Azure stack?

Are you in touch with somebody who works on such framework?

Please leave a comment, or ping me on Twitter.