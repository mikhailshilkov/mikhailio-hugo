---
title: "Serverless in the Wild: Azure Functions Production Usage Statistics"
date: 2020-05-05
thumbnail: teaser.jpg
tags: ["Serverless", "Azure", "Azure Functions", "Paper review"]
description: "Insightful statistics about the actual production usage of Azure Functions, based on the data from Microsoft's paper"
ghissueid: 37
markup: "mmark"
---

Microsoft Azure and Microsoft Research [released](https://arxiv.org/pdf/2003.03423.pdf) a paper called "Serverless in the Wild: Characterizing and Optimizing the Serverless Workload at a Large Cloud Provider". In part 1 of the paper, they revealed some insightful statistics about the actual production usage of Azure Functions for two weeks in summer 2019.

This blog post is my summary and highlights of the most intriguing data points. I'll cover part 2 of the paper, focusing on cold starts, in a separate installment.

## Trigger Types and Invocations

Every Azure Function has a trigger: it's linked to a specific event source, and every event in that source causes the Function to execute. Event sources include HTTP endpoints, timers, message queues, topics, event logs, and others. Which triggers are used more often?

The paper doesn't have a precise breakdown by specific sources like Service Bus or Event Grid, but it gives relative numbers per event category. It also shows the percentage of Function invocations that each type is responsible for.

Here is the comparison table:

{.table .pure-table .table-striped}
| Trigger type  | % of Functions | % of Invocations |
|---------------|----------------|------------------|
| HTTP          | 55%            | 36%              |
| Queue         | 15%            | 34%              |
| Event         | 2%             | 25%              |
| Timer         | 16%            | 2%               |
| Orchestration | 7%             | 2%               |
| Others        | 5%             | 1%               |

Notable facts:

- More than half of Functions are triggered by HTTP.
- Asynchronous queue and, especially, event functions have much more invocations on average than any other Function type.
- The opposite is accurate for timer Functions: a relatively high number of Functions translates to a fraction of invocations.
- Durable functions are quite popular if that's what the authors mean by "orchestration" triggers.

## Functions and Applications

Function App is the deployment unit of Azure Functions. Each Function App may contain one or more Functions packaged together. How often do people use multiple Functions, and what for?

{.table .pure-table .table-striped}
| # of Functions | Percentage |
|----------------|------------|
| 1              | 54%        |
| 2              | 16%        |
| 3              | 10%        |
| 4 to 5         | 8%         |
| 6 to 10        | 7%         |
| 11+            | 5%         |
| (100+)         | 0.04%      |
| (2000+)        | (a couple) |

Apparently, multi-function applications are widespread! The number of functions-per-app is all over the spectrum, with some wild usage scenarios of hundreds or even thousands of Functions in the same Function App.

Combining this with trigger types, it seems hard to derive any common patterns of trigger combinations in the same app. The paper lists several common ones, but none of them has more than 5% of usage. For instance, only 4.5% of applications are exactly one HTTP trigger and one timer trigger&mdash;which I could potentially attribute to the pattern of warming HTTP Functions against [cold starts](/serverless/coldstarts).

## Invocation Patterns

How often are functions invoked? What are typical numbers for executions per day, minute, or second?

The variation in invocation frequency is tremendous. While many Functions may stay idle for days, others run many times per second. There's nothing unexpected here: it's free to create a Function App, so many apps exist for test purposes, one-off experiments, or to handle infrequent timers or automation tasks. At the same time, some production Functions would serve intensive workloads via HTTP, queues, or event buses.

The paper shows actual numbers for frequency distribution:

- **45%** of Function Apps are invoked at most **once per hour**.
- Another **36%** are invoked at most **once per minute**.
- The remaining **19%** of more frequently invoked Functions represent more than 99.5% of all invocations. 
- Only about **3%** of applications are invoked more often than **once a second**.

I'm surprised that the vast majority of Functions run, on average, very infrequently. It looks like more than 97% of Function Apps don't require any scalability beyond scaling from zero to a single instance and back.

The following chart shows the cumulative number of invocations that Azure Functions handle across all applications. Unfortunately, there are no absolute numbers&mdash;the chart is normalized to the peak.

{{< figure src="invocations.png" title="Total invocations per hour for all Azure Functions, relative to the peak" >}}

There are apparent repeatable patterns and a constant baseline of roughly 50% of the invocations. The platform needs to handle about 2x scalability through a given day.

Overall, the macro-scalability of the platform seems to be less of a challenge compared to optimizing the lifecycle of each individual Function App. Across applications, the number of invocations per day varies by 8 orders of magnitude, making the resources the provider has to dedicate to each application also highly variable.

Since the majority of applications are mostly idle, any inefficiency in handling them, being significant relative to their total execution (billable) time, can be prohibitively expensive. And that's a hard problem to solve!

## Function Execution Times

Once a Function is triggered, for how long will it typically run until completed?

Predictably, executions in Function-as-a-Service are very short compared to other cloud workloads. However, again, there are several orders of magnitude difference across different Functions:

- About **20%** of Functions would complete, on average, in less than **100 ms**.
- Approximately **50%** of the Functions execute for less than **1 second** on average.
- Also, **50%** of the Functions have **maximum** execution time shorter than **3 seconds**.
- Yet, the slowest **10%** of the Functions have maximum execution time more than **1 minute**, and **4% take more than a minute on average**.

The most common durations seem to be between 100 ms and several seconds, which is not surprising.

## Conclusion

It's incredible how much of a variation exists in real-world workloads running in Azure Functions. Across all the metrics above, there never seem to be one or two dominating scenarios. It's impressive that a single service can decently handle all the variability.

Kudos to folks at Microsoft Azure for releasing the data and analysis for their actual production workloads, albeit just for two weeks and without absolute numbers.

The second part of the paper uses this data to analyze potential improvements in cold starts of Azure Functions. And that's an excellent topic for a follow-up blog post, so stay tuned!
