---
title: "How to Drain a List of .NET Tasks to Completion"
date: 2020-09-03
thumbnail: teaser.jpg
tags: [".NET", "CSharp"]
description: "Custom await logic for a dynamic list of .NET tasks, fast and on-time"
ghissueid: 43
---

The Pulumi .NET SDK operates with an unusual asynchronicity model. Resource declarations are synchronous calls and complete instantaneously.

Yet, they kick off the actual operations of resource creation as background tasks. An end-user does not see these tasks and does not await them.

Nonetheless, Pulumi must not stop the program execution until all the tasks are completed. The SDK should collect all open tasks and reliably await them.

The following model illustrates the goal:

```cs
static async Task Main()
{
    for (int i = 0; i < N; i++)
        DoWork($"Job {i}"); // creates a Task and returns immediately

    await WaitForAllOpenTasksToComplete();
}

static void DoWork(string message)
{
    RegisterTask(message, RunAsync());
    async Task RunAsync()
    {
        var delay = new Random().Next(1000);
        await Task.Delay(delay).ConfigureAwait(false);
        Log($"{message} finishing");
    }
}
```

The `DoWork` method creates a `Task` that pauses for a random delay below one second. It passes the task to a `RegisterTask` method (to be defined) and returns without awaiting.

In our real use case, tasks may also produce new tasks, which can produce even more tasks, and so on. I emulate this by extending the `DoWork` method with an extra parameter asking to schedule more work:

```cs
static void DoWork(string message, bool moreWork = true)
{
    RegisterTask(message, RunAsync());
    async Task RunAsync()
    {
        var delay = new Random().Next(1000);
        await Task.Delay(delay).ConfigureAwait(false);
        Log($"{message} finishing");
        
        if (moreWork)
        {
            for (int i = 0; i < N; i++)
                DoWork($"{message}.{i}", false);
        }
    }
}
```

The `Main` method creates initial work items and needs to await the completion of all of the tasks, immediate or descendant ones, with `WaitForAllOpenTasksToComplete`.

Let's look at several options on how to implement such processing.

## Registering Tasks

First thing, I need to store the in-flight tasks somewhere, so I'll allocate a static collection for that. I want to keep a description with each task, so my collection is a dictionary:

```cs
static readonly Dictionary<Task, string> _inFlightTasks = new Dictionary<Task, string>();
```

Now I can implement a method to register a new task:

```cs
static void RegisterTask(string description, Task task)
{
    lock (_inFlightTasks)
    {
        // Duplicates may happen if we try registering things like Task.CompletedTask.
        // We'll ignore duplicates for now.
        if (!_inFlightTasks.ContainsKey(task))
        {
            _inFlightTasks.Add(task, description);
        }
    }
}
```

Now, how do we implement the awaiting of these tasks?

## Awaiting the Tasks

We can't wait for the tasks just once, because new tasks may be coming over time. Therefore, the `WaitForAllOpenTasksToComplete` will have a loop to wait until all the in-flight tasks are drained. Here is a draft without the actual awaiting yet:

```cs
private static async Task WaitForAllOpenTasksToComplete_Draft()
{
    // Keep looping as long as there are outstanding tasks that are still running.
    while (true)
    {
        var tasks = new List<Task>();
        lock (_inFlightTasks)
        {
            if (_inFlightTasks.Count == 0)
            {
                // No more tasks in flight: exit the loop.
                return;
            }

            // Grab all the tasks we currently have running.
            tasks.AddRange(_inFlightTasks.Keys);
        }

        // TODO: await tasks, then proceed to the next iteration
    }
}
```

How do we await these tasks?

## Use WhenAll

The obvious option is to use `WhenAll` and then remove all the tasks from the in-flight collections:

```cs
// ... we are inside the loop

await Task.WhenAll(tasks).ConfigureAwait(false);
        
lock (_inFlightTasks)
{
    foreach (var task in tasks)
    {
        Log($"{_inFlightTasks[task]} handled");
        _inFlightTasks.Remove(task);
    }
}

// ... the loop continues
```

Let's run the program for `N` = 2 (two parent tasks, each creating two child tasks) and log the messages and timings:

```
0.048: Job 0 finishing
0.464: Job 0.0 finishing
0.539: Job 0.1 finishing
0.660: Job 1 finishing
0.661: Job 0 handled
0.661: Job 1 handled
0.910: Job 1.1 finishing
1.372: Job 1.0 finishing
1.372: Job 0.0 handled
1.372: Job 0.1 handled
1.372: Job 1.0 handled
1.372: Job 1.1 handled
1.373: Done!
```

The awaiting loop works, and the program quits correctly. 

There is a downside, though. After a task completes, we may not respond to its completion until all the other tasks of the same batch complete.

This is not desirable for Pulumi's scenario when cloud operations may run for minutes. If two resources are created in parallel, we want to report success as soon as it happens. Even more importantly, we want to handle the errors as they occur.

How can we respond to tasks one-by-one?

## Use WhenAny

The next option is to use `Task.WhenAny` to handle the completion of tasks one-by-one. `WhenAny` accepts a collection of tasks and returns the first one that completes. After the `await` operator returns the first completed task, we can log it and exclude it from the in-flight tasks list. Then, we call `WhenAny` again with the list of all remaining tasks.

```cs
var task = await Task.WhenAny(tasks).ConfigureAwait(false);
                
lock (_inFlightTasks)
{
    Log($"{_inFlightTasks[task]} handled");
    _inFlightTasks.Remove(task);
}

// Now actually await the returned task and realize any exceptions it may have thrown.
await task.ConfigureAwait(false);
```

Let's run the modified program and log messages again:

```
0308: Job 0 finishing
0312: Job 0 handled
0440: Job 0.1 finishing
0440: Job 0.1 handled
0899: Job 1 finishing
0900: Job 1 handled
0948: Job 1.0 finishing
0948: Job 1.0 handled
0957: Job 0.0 finishing
0957: Job 0.0 handled
0979: Job 1.1 finishing
0979: Job 1.1 handled
0979: Done!
```

This looks great! The code responds to each completion immediately, which meets our goal.

The code works perfectly for the small number of tasks, but does it scale?

## Stress Test

We ran the test with `N=2` to create 6 tasks in total. No matter which `N` we choose, there are only two sequential tasks (a parent task and its child task). As each task completes within 1 second, the full test should finish in less than 2 seconds in theory.

However, this does not hold for the `WhenAny`-based program. The plot below shows the test completion time, depending on the total number of tasks.

{{< figure src="timing.png" title="Time to completion grows rapidly as the total number of tasks increases" >}}

The 2-second rule holds until ~8.000 tasks, but then the completion time is clearly quadratic from the number of tasks.

The logs confirm that the last completed task is always at the 2 seconds mark, while the handler loop becomes excessively busy with awaiting.

This makes sense. `WhenAny` doesn't have a constant complexity but at least `O(N)` complexity. Executing it in a loop gives us `O(N^2)`, demonstrated by the chart above.

This means that large Pulumi programs managing thousands of resources would tend to complete notably slower than desired.

Predictably, the implementation based on `WhenAll` doesn't have this problem: all the thousands of tasks complete in 2 seconds.

How do we combine the benefits of both approaches?

## Custom Await Logic

It looks like the standard library doesn't have a method that satisfies the requirements. The custom implementation consists of multiple parts.

First, there is a `TaskCompletionSource` that tracks the overall task completion:

```cs
private static TaskCompletionSource<int> Tcs = new TaskCompletionSource<int>(TaskCreationOptions.RunContinuationsAsynchronously);
```

Now, all that the new `WaitForAllOpenTasksToComplete` does is waiting for this completion source to return:

```cs
private static async Task WaitForAllOpenTasksToComplete()
{
    await Tcs.Task.ConfigureAwait(false);
}
```

It becomes the responsibility of the `RegisterTask` method to initiate the completion of the task:

```cs
static void RegisterTask(string description, Task task)
{
    lock (_inFlightTasks)
    {
        // Duplicates may happen if we try registering things like Task.CompletedTask.
        // We'll ignore duplicates for now.
        if (!_inFlightTasks.ContainsKey(task))
        {
            _inFlightTasks.Add(task, description);
        }
    }
    HandleCompletion(task);
}
```

All the actual logic resides in `HandleCompletion` method:

```cs
static async void HandleCompletion(Task task)
{
    try
    {
        // Wait for the task completion.
        await task.ConfigureAwait(false);

        Log($"{_inFlightTasks[task]} handled);
    }
    catch (OperationCanceledException)
    {
        Tcs.TrySetCanceled();
    }
    catch (Exception ex)
    {
        Tcs.TrySetException(ex);
    }
    finally
    {
        // Once finished, remove the task from the set of tasks that are running.
        lock (_inFlightTasks)
        {
            _inFlightTasks.Remove(task);

            // Check if all the tasks are completed and signal the completion source if so.
            if (_inFlightTasks.Count == 0)
            {
                Tcs.TrySetResult(0);
            }
        }
    }
}
```

## Testing It Out

Let's make sure that the custom await logic works as desired. Here is the output for the N=2 case:

```
0549: Job 1 finishing
0555: Job 1 handled
0805: Job 0 finishing
0805: Job 0 handled
0851: Job 1.0 finishing
0851: Job 1.0 handled
1473: Job 1.1 finishing
1474: Job 1.1 handled
1582: Job 0.0 finishing
1582: Job 0.0 handled
1627: Job 0.1 finishing
1627: Job 0.1 handled
1629: Done!
```

As desired, the handling happens immediately after finishing a job. What about a large number of tasks?

Even 100.000 tasks complete in 2 seconds! This looks great! Mission accomplished!

## Conclusion

.NET standard library comes with great primitives to handle common patterns around tasks. However, sometimes one has to understand their limitations and create a new pattern implementation.

Do you see a problem with the approach above? Do you know a more straightforward way to achieve both goals? Please respond below!
