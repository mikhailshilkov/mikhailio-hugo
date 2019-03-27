---
title: Reducing Cold Start Duration in Azure Functions
date: 2019-03-27
thumbnail: thumb.png
tags: ["Serverless", "Azure Functions", "Cold Starts", "Azure"]
description: The influence of the deployment method, application insights, and more on Azure Functions cold starts.
ghissueid: 7
---

Back in February, I published the first version of [Cold Starts in Azure Functions](/serverless/coldstarts/azure/)&mdash;the detailed analysis of cold start durations in serverless Azure. The article showed the following numbers for C# and JavaScript functions:

{{< chart_interval 
    "reducing-azure-functions-cold-start-time/languages"
    "Typical cold start durations per language (February 2019)"
    true >}}

Note that I amended the format of the original chart: the range shows the most common 67% of values, and the dot shows the median value. This change makes the visual comparison easier for the rest of today's post.

My numbers triggered several discussions on twitter. In one of them, Jeff Hollan (a program manager on Functions team) responded:

{{< tweetnoconvo 1100474640026132480 >}}

The team collects the stats of cold starts internally, and their numbers were lower than mine. We started an e-mail thread to reconcile the results. I won't publish any messages from the private thread, but I'm posting the main findings below.

## Check the deployment method

For my tests, I've been using "Run from external package" deployment method, where the function deployment artifact is stored as a zip file on blob storage. This method is the most friendly for automation and infrastructure-as-code pipelines.

Apparently, it also increases the cold start duration. I believe the situation already improved since my original article, but here are the current numbers from mid-March.

.NET:

{{< chart_interval 
    "reducing-azure-functions-cold-start-time/deploymentcs"
    "Cold start durations per deployment method for C# functions (March 2019)"
    true >}}

Node.js:

{{< chart_interval 
    "reducing-azure-functions-cold-start-time/deploymentjs"
    "Cold start durations per deployment method for JavaScript functions (March 2019)"
    true >}}

Run-from-external-zip deployment increases the cold start by approximately 1 second.

## Application Insights

I always configured my Function Apps to write telemetry to Application Insights. However, this adds a second to the cold start:

{{< chart_interval 
    "reducing-azure-functions-cold-start-time/appinsights"
    "Cold start durations with and without Application Insights integration"
    true >}}

I can't really recommend "Don't use Application Insights" because the telemetry service is vital in most scenarios. Anyway, keep this fact in mind and watch [the corresponding issue](https://github.com/Azure/azure-functions-host/issues/4183).

## Keep bugging the team

While you can use the information above, the effect is still going to be limited. Obviously, the power to reduce the cold starts lies within the Azure Functions engineering team.

Coincidence or not, the numbers have already significantly improved since early February, and [more work](https://github.com/Azure/azure-functions-host/issues/4184) is [in progress](https://github.com/Azure/azure-functions-host/commit/792bb463b4bc48d67570d5b44b69c89b9d43f86d).

I consider this to be a part of my mission: spotlighting the issues in public gives that nudge to prioritize performance improvements over other backlog items.

Meanwhile, the data in [Cold Starts in Azure Functions](/serverless/coldstarts/azure/) and [Comparison of Cold Starts in Serverless Functions across AWS, Azure, and GCP](/serverless/coldstarts/big3/) are updated: I'm keeping them up-to-date as promised before.