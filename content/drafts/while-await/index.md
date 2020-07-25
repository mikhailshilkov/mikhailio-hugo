---
title: "Draining a List of .NET Tasks to Completion"
date: 2020-07-21
thumbnail: teaser.jpg
tags: []
description: ""
ghissueid: 
---

The Pulumi .NET SDK has interesting asynchronicity model. The operations of resource declaration are synchronous and complete almost intantaneously. The actual operation of resource creation is scheduled within a task which is not directly visible to the end user. Therefore, the user does not await these tasks.

Nonetheless, we must not quit from the program until all the tasks are completed. So, the SDK itself should collect all open tasks and await them in a single place.

This can be illustrated with the following model:

```cs
static async Task Main()
{
    for (int i = 0; i < N; i++)
        DoWork($"Job {i}"); // creates a Task and returns immediately

    await WaitForAllOpenTasksToComplete();
}

static void DoWork(string message)
{
    RegisterTask($"{message} handled", RunAsync());
    async Task RunAsync()
    {
        var delay = new Random().Next(1000);
        await Task.Delay(delay).ConfigureAwait(false);
        Log($"{message} finishing");
    }
}
```

The `DoWork` method creates a `Task` which waits for a random delay below one second. It passes that task to a `RegisterTask` method (to be defined) and returns without awaiting.

In our real use case, tasks may also produce new tasks, which can produce even more tasks, and so on. I emulate this by extending the `DoWork` method with an extra parameter asking to schedule more work:

```cs
static void DoWork(string message, bool moreWork = true)
{
    RegisterTask($"{message} handled", RunAsync());
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

The `Main` method creates a bunch of initial work items and needs to await the completion of all of the tasks, immediate or descendant ones, with `WaitForAllOpenTasksToComplete`.

Let's look at several options of how to implement this processing.

## Registering Tasks

First thing, I need to store the in-flight tasks somewhere, so I'll have a static collection for that. I want to keep a description with each task, so my collection is a dictionary:

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

Now, how do we implement awaiting of these tasks?

## Awating the Tasks

We can't wait for the tasks just once, because new tasks may be coming over time. Therefore, the `WaitForAllOpenTasksToComplete` is going to have a loop which waits until the in-flight tasks are drained. Here is a draft without the actual awaiting yet:

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
        Log(_inFlightTasks[task]);
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

The awaiting loop works, but it has a significant downside. After a task completes, we may not be able to respond to its completion until all the other tasks of the same batch complete too.

This is not desirable for Pulumi's scenario. If two resources are created in parallel, we want to report and success as soon as it happens. Even more importantly, we want to respond to the first error that occurs.

How can we respond to tasks one-by-one?

## Use WhenAny

```cs
var task = await Task.WhenAny(tasks).ConfigureAwait(false);
                
lock (_inFlightTasks)
{
    Log(_inFlightTasks[task]);
    _inFlightTasks.Remove(task);
}

// Now actually await the returned task and realize any exceptions it may have thrown.
await task.ConfigureAwait(false);
```