---
title: "Temporal: Open Source Workflows as Code"
date: 2020-06-03
draft: true
thumbnail: teaser.jpg
tags: []
description: ""
ghissueid: 
---

Regular readers of my blog may recognize me as a big fan of [Azure Durable Functions](https://docs.microsoft.com/azure/azure-functions/durable/durable-functions-overview). Durable Functions is an extension of Azure Functions that lets you write **stateful** functions and **workflows**. The SDK does a lot behind the scenes: it manages state, checkpoints, and restarts for you, allowing you to focus on business logic.

However, many people have a hard time understanding what Durable Functions are and, especially, when they are useful. I tried to help spread the ideas: I wrote an extensive article [Making Sense of Azure Durable Functions](/2018/12/making-sense-of-azure-durable-functions/), published [DurableFunctions.FSharp](https://github.com/mikhailshilkov/DurableFunctions.FSharp) library, presented a few conference talks.

## Beyond The Scope of Durable Functions

While Durable Functions are great and pretty simple to get started with, their reliance on Azure services implies limitations on applicability.

First, **.NET** and **Node.js** are the only supported runtimes at the moment, and even Node.js sometimes lags in terms of features. **Python** support may come later this year, two years after Durable Functions were introduced. Anyway, it's safe to assume that C# developers are still the primary audience.

Besides, Durable Functions are designed to run inside the Azure cloud. While you don't have to run functions in a serverless compute model, the durability features rely heavily on **Azure Storage**. There was an initiative to bring Redis as an alternative backend, but the attempt has seemingly stagnated.

Ideally, a durable workflow library would not tie into any specific hosting model (Function Apps), programming model (Azure Functions SDK), or storage backend (Azure Storage).

Recently, I've been hopping between different languages and cloud providers. Are there other solutions that could help address similar challenges of stateful data processing?

In turns out, yes! My friend and tech blogger [Ryland](https://twitter.com/taillogs) introduced me to [Temporal](https://www.temporal.io/)&mdash;an open-source library to build workflows in code and operate resilient applications using developer-friendly primitives.

Before discussing Temporal, let's define what a workflow is.

## You Are Already Running Workflows

The word "workflow" has this unfortunate connotation coming from business process automation, BizTalk, and BPMN tools. This scope is too narrow and boring compared to what I'm thinking of here.

For me, workflows can be anything that matches three criteria:

- **Multi-step**. Several related actions need to run towards a common goal.
- **Distributed**. Actions run across multiple servers and services, bringing all the hard problems of distributed systems.
- **Arbitrary long**. While workflows may complete in less than a second, they may also span days or even years. They are not a part of a request-response flow.

This definition is very open. Running in the cloud? You probably implement workflows. Doing microservices? I bet you have tons of workflows in there. Event-driven? Aggregating data? Running cron jobs? Anything to do with the money? Queues? Event streams? Automation? Customer relations? Workflows, workflows, workflows all the way.

However, when it comes to implementation, most of these workflows are defined implicitly. Processes are running in the system, but they aren't defined in a single place. Instead, multiple pieces are spread over distributed components that have to do precisely the right thing for the workflow to complete.

The challenges of reliability, consistency, correctness are therefore addressed in an ad-hoc best-effort, poorly structured manner. These responsibilities are everyone's and no one's job at the same time.

## Temporal: Workflow as Code

Temporal is an open-source tool focused on first-class support of workflows in a sense described above. The workflows are functions in a general-purpose programming language. Temporal comes with developer SDKs and a backend service that takes care of state management and event handling.

Each workflow is a cohesive function defining the whole scenario out of provided building blocks. While some learning and onboarding are required, the "Workflow as Code" concept feels natural to developers.

Let's take a look at an example.

## Example: Subscription Management

We all buy subscriptions to online services these days, and many of us had to *implement* subscription management as part of the business applications we develop. An onboarding flow for a SaaS product (Spotify, Netflix, Dropbox, etc.) could look like this:

```
function subscribe(customerIdentifier) {
    onboardToFreeTrial(customerIdentifier);

    events.onCancellation(
        processSubscriptionCancellation(customerIdentifier)
        stopWorkflow;
    );

    wait(60 * days);
    upgradeFromTrialToPaid(customerIdentifier);
    forever {
        wait(30 * days);
        chargeMonthlyFee(customerIdentifier);
    }
}
```

I wrote this snippet in pseudocode, and it reflects how a developer might *think* about the workflow. The code relies on several building blocks:

- Domain-specific actions: `onboardToFreeTrial`, `chargeMonthlyFee`, and others;
- Time scheduling with `wait` and `forever`;
- External events to handle user's action with `onCancellation` and `stopWorkflow` to stop any further processing.

The snippet is concise and pretty easy to read. However, it's seemingly impossible to convert it to real code as-is. Once invoked, this function may need to run for months or years. We can't run a function on the same server for years: it would constantly consume resources and crash on any reboot or hardware failure.

### Ad-hoc implementation

Instead, state of the art is to design a distributed asynchronous event-driven bespoke solution. There are multiple options, but here is one of them:

- Store the status and renewal schedule of each subscription in a **database**.
- Have a **cron job** that runs periodically, queries the database for subscriptions due, and sends commands to charge a fee.
- The commands are processed by background **workers** triggered off a persistent queue.
- A separate **queue** handles cancellation requests and updates subscriptions in the database.
- A frontend service provides external **APIs** to interact with the components above.

![Picture of the ad-hoc solution](todo)

This approach may work, but it's a radical departure from the original snippet in terms of complexity. We have to manage a few durable stores, and several components have to play nicely together. Failure scenarios are numerous, and, anecdotally, not many applications get this 100% right.

More importantly, all the machinery consumes expensive developer's time and yields no business value beyond what would be delivered by the single function perpetually running on a hypothetical error-free and limitless server.

### Temporal workflow

Temporal provides a solution where your actual production code looks similar to the original pseudocode. Instead of synchronously running it forever, Temporal SDK would pause the execution when needed, create a checkpoint to store the status, and resume the execution automatically when required.

Temporal currently has two language SDKs: **Go** and **Java**, while more languages are on the way. Meanwhile, here is our workflow in Go:

```go
func SubscriptionWorkflow(ctx workflow.Context, customerId string) error {
  var err error
  if err = workflow.ExecuteActivity(ctx, OnboardToFreeTrial, customerId).Get(ctx, nil); err != nil { return err }
  defer func() {
    if err != nil && temporal.IsCanceledError(err) {
      workflow.ExecuteActivity(ctx, ProcessSubscriptionCancellation, customerId).Get(ctx, nil)
    }
  }()
  if err = workflow.Sleep(ctx, 60*24*time.Hour); err != nil { return err }
  if err = workflow.ExecuteActivity(ctx, UpgradeFromTrialToPaid, customerId).Get(ctx, nil); err != nil { return err }
  for {
    if err = workflow.Sleep(ctx, 30*24*time.Hour); err != nil { return err }
    if err = workflow.ExecuteActivity(ctx, ChargeMonthlyFee, customerId).Get(ctx, nil); err != nil { return err }
  }
}
```

And here is the Java version:

```java
public class SubscriptionWorkflowImpl implements SubscriptionWorkflow {
  public void execute(String customerIdentifier) {
    activities.onboardToFreeTrial(customerIdentifier);
    try {
      Workflow.sleep(Duration.ofDays(60));
      activities.upgradeFromTrialToPaid(customerIdentifier);
      while (true) {
        Workflow.sleep(Duration.ofDays(30));
        activities.chargeMonthlyFee(customerIdentifier);
      }
    } catch (CancellationException e) {
      activities.processSubscriptionCancellation(customerIdentifier);
    }
  }
}
```

It's not the same code as the prototype sketch, but the structure is strikingly similar. Both languages have their ways to handle errors producing some nuance and visual noise, but those ways are native and intimately familiar to developers in respective ecosystems.

The benefits of the Temporal's approach are quite clear:

- The flow is explicitly defined in a single place and can be formally reasoned through.
- There's no bespoke infrastructure to manage beyond a worker running the code and the backend service (more on those below).
- Temporal takes care of state management, queueing, resilience, deduplication, and other safety properties.

Temporal workflows use the same pause-resume-replay approach as Azure Durable Functions. For example, a call to `Workflow.sleep` doesn't pause the current thread for 60 days. Instead, the actual Java method call completes, and Temporal schedules another execution in 60 days. The new execution has the history of previous runs, so it replays to the point where the last execution stopped and takes the next step.

## How Temporal Works

There's no voodoo here, so a backend service and a data store are required to support the almost-magical workflow execution. Any Temporal environment includes **workers**, a **backend service**, and a **data store**.

![Picture of workers, service, database](todo)

Workers execute the end user's code as the one shown above. The user is responsible for running enough workers, which can be any long-lived compute nodes: VMs, containers, Kubernetes pods, etc.

Each worker connects to the service via a gRPC protocol. The service provides scheduling, queueing, and state manipulation primitives to distribute the workload between workers and ensure liveness and safety guarantees of the system.

The service saves its data in persistent external storage, which currently can be **Cassandra**, **MySQL**, or **PostgreSQL**.

The service is designed for multi-tenant usage, so your organization only needs a single instance up and running, and multiple applications can benefit. I suspect there will be a managed SaaS option somewhere in the future.

## Conclusion

Microservices, serverless functions, cloud-native applications&mdash;distributed event-driven business applications are hot, and we will deal with them for years. I worry that the application development industry underestimates the complexity of such systems. Ad-hoc solutions to common problems may rapidly increase the technical debt and slow down the ability to innovate.

I'm excited to see tools like Temporal enter the space of open-source workflows, or rather the space of asynchronous data processing. My firm belief is that every developer can benefit from a higher-level framework that guarantees that developers can focus on business logic. And the business logic is still written in code with languages that they know and love.

In future installments, I plan to explore Temporal in a deeper way, including different usage scenarios, getting up and running in the cloud, SDK features, query APIs, and more. Stay tuned!

If you want to give Temporal a try, head to the [docs site](https://docs.temporal.io/docs/overview/), explore the code at [GitHub](https://github.com/temporalio/temporal) or ask questions in [Slack](https://join.slack.com/t/temporalio/shared_invite/zt-c1e99p8g-beF7~ZZW2HP6gGStXD8Nuw).