---
title: Azure Durable Functions in F#
date: 2018-02-19
tags: ["Azure", "Azure Functions", "FSharp", "Durable Functions"]
---

Azure Functions are designed for stateless, fast-to-execute,
simple actions. Typically, they are triggered by an HTTP call or a queue message,
then they read something from the storage or database and return the result
to the caller or send it to another queue. All within several seconds at most.

However, there exists a preview of [Durable Functions](https://docs.microsoft.com/en-us/azure/azure-functions/durable-functions-overview),
an extension that lets you write stateful functions for long-running workflows.
Here is a picture of one possible workflow from the docs:

![Fan-out Fan-in Workflow](fan-out-fan-in.png)

Such workflows might take arbitrary time to complete. Instead of blocking and
waiting for all that period, Durable Functions use the combination of
Storage Queues and Tables to do all the work asynchronously.

The code still *feels* like one continuous thing because it's programmed
as a single orchestrator function. So, it's easier for a human to reason
about the functionality without the complexities of low-level communication.

I won't describe Durable Functions any further, just go read
[documentation](https://docs.microsoft.com/en-us/azure/azure-functions/durable-functions-overview),
it's nice and clean.

Language Support
----------------

As of February 2018, Durable Functions are still in preview. That also means
that language support is limited:

> Currently C# is the only supported language for Durable Functions. This
> includes orchestrator functions and activity functions. In the future,
> we will add support for all languages that Azure Functions supports.

I was a bit disappointed that F# is not an option. But actually, since
Durable Functions support precompiled .NET assembly model, pretty much
anything doable in C# can be done in F# too.

The goal of this post is to show that you can write Durable Functions in F#.
I used precompiled .NET Standard 2.0 F# Function App running on 2.0 preview
runtime.

Orchestration Functions
-----------------------

The stateful workflows are Azure Functions with a special `OrchestrationTrigger`.
Since they are asynchronous, C# code is always based on `Task` and `async`-`await`.
Here is a simple example of orchestrator in C#:

``` csharp
public static async Task<List<string>> Run([OrchestrationTrigger] DurableOrchestrationContext context)
{
    var outputs = new List<string>();

    outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Tokyo"));
    outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Seattle"));
    outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "London"));

    // returns ["Hello Tokyo!", "Hello Seattle!", "Hello London!"]
    return outputs;
}
```

F# has its own preferred way of doing asynchronous code based on `async`
computation expression. The direct refactoring could look something like

``` fsharp
let Run([<OrchestrationTrigger>] context: DurableOrchestrationContext) = async {
  let! hello1 = context.CallActivityAsync<string>("E1_SayHello", "Tokyo")   |> Async.AwaitTask
  let! hello2 = context.CallActivityAsync<string>("E1_SayHello", "Seattle") |> Async.AwaitTask
  let! hello3 = context.CallActivityAsync<string>("E1_SayHello", "London")  |> Async.AwaitTask
  return [hello1; hello2; hello3]
} |> Async.StartAsTask
```

That would work for a normal HTTP trigger, but it blows up for the Orchestrator
trigger because multi-threading operations are not allowed:

> Orchestrator code must never initiate any async operation except by
> using the DurableOrchestrationContext API. The Durable Task Framework
> executes orchestrator code on a single thread and cannot interact with
> any other threads that could be scheduled by other async APIs.

To solve this issue, we need to keep working with `Task` directly. This is
not very handy with standard F# libraries. So, I pulled an extra NuGet
package `TaskBuilder.fs` which provides a `task` computation expression.

The above function now looks very simple:

``` fsharp
let Run([<OrchestrationTrigger>] context: DurableOrchestrationContext) = task {
  let! hello1 = context.CallActivityAsync<string>("E1_SayHello", "Tokyo")
  let! hello2 = context.CallActivityAsync<string>("E1_SayHello", "Seattle")
  let! hello3 = context.CallActivityAsync<string>("E1_SayHello", "London")
  return [hello1; hello2; hello3]
}
```

And the best part is that it works just fine.

`SayHello` function is Activity trigger based, and no special effort is required
to implement it in F#:

``` fsharp
[<FunctionName("E1_SayHello")>]
let SayHello([<ActivityTrigger>] name) =
  sprintf "Hello %s!" name
```

More Examples
-------------

Durable Functions repository comes with
[a set of 4 samples](https://github.com/Azure/azure-functions-durable-extension/tree/master/samples/precompiled)
implemented in C#. I took all of those samples and ported them over to F#.

You've already seen the first [`Hello Sequence` sample](https://github.com/mikhailshilkov/azure-functions-fsharp-examples/blob/master/12-durable/HelloSequence.fs)
above: the orchestrator calls the activity function 3 times and combines the
results. As simple as it looks, the function will actually run 3 times for each
execution, saving state before each subsequent call.

The second [`Backup Site Content` sample](https://github.com/mikhailshilkov/azure-functions-fsharp-examples/blob/master/12-durable/BackupSiteContent.fs)
is using this persistence mechanism to run
a potentially slow workflow of copying all files from a given directory to
a backup location. It shows how multiple activities can be executed in
parallel:

``` fsharp
let tasks = Array.map (fun f -> backupContext.CallActivityAsync<int64>("E2_CopyFileToBlob", f)) files
let! results = Task.WhenAll tasks
```

The third [`Counter` example](https://github.com/mikhailshilkov/azure-functions-fsharp-examples/blob/master/12-durable/Counter.fs)
demos a potentially infinite actor-like workflow, where state can exist and
evolve for indefinite period of time. The key API calls are based on
`OrchestrationContext`:

``` fsharp
let counterState = counterContext.GetInput<int>()
let! command = counterContext.WaitForExternalEvent<string>("operation")
```

The final elaborate [`Phone Verification` workflow](https://github.com/mikhailshilkov/azure-functions-fsharp-examples/blob/master/12-durable/PhoneVerification.fs)
has several twists, like output binding for activity (`ICollector` is required
instead of C#'s `out` parameter), third-party integration (Twilio to send SMSs),
recursive sub-function to loop through several attempts and context-based
timers for reliable timeout implementation.

So, if you happen to be an F# fan, you can still give Durable Functions a try.
Be sure to leave your feedback, so that the library could get even better
before going GA.