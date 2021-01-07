---
title: "Cold Starts in Azure Functions"
lastmod: 2021-01-05
layout: single
thumbnail: coldazure_thumb.jpg
images: [coldazure.jpg]
description: Influence of dependecies, language, runtime selection on Consumption Plan
tags: ["Cold Starts", "Azure", "Azure Functions"]
ghissueid: 3
---

This article describes Azure Functions running on Consumption Plan&mdash;the dynamically scaled and billed-per-execution compute service. Consumption Plan adds and removes instances dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Learn more: [Cold Starts in Serverless Functions](/serverless/coldstarts/define/).

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after deployment.

After that request is processed, the instance stays alive mostly **from 20 to 30 minutes** to be reused for subsequent requests:

{{< chart_line
    "coldstart_azure_interval"
    "Probability of a cold start happening before minute X" >}}

As you can see, some cold starts happen earlier than 10 minutes, some instances last for more than 50 minutes, so the behavior seems less deterministic than it used to be in the past. It's likely related to the new [algorithm to predict the next invocation](https://mikhail.io/2020/06/eliminate-cold-starts-by-predicting-invocations-of-serverless-functions/).

Read more: [When Does Cold Start Happen on Azure Functions?](/serverless/coldstarts/azure/intervals/)


How Slow Are Cold Starts?
-------------------------

The following chart shows the typical range of cold starts in Azure Functions V2, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval
    "coldstart_azure_bylanguagega"
    "Typical cold start durations per language"
    true >}}

A typical cold start latency spans from 1 to 10 seconds. However, less lucky executions may take up to 30 seconds occasionally. PowerShell functions are especially slow to start with values from 4 to 27 seconds.

View detailed distributions: [Cold Start Duration per Language](/serverless/coldstarts/azure/languages/).

Windows vs. Linux
-----------------

Azure Functions can be deployed either on Windows or Linux environments, depending on the plan settings. Which operating system provides faster cold starts?

{{< chart_interval
    "coldstart_azure_bylanguageos"
    "Comparison of cold start durations between two operating systems"
    true >}}

The median response time is comparable, but Linux has tighter distribution.

The Node.js runtime is consistently slower than the .NET Core one.

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with the various number of referenced NPM packages:

{{< chart_interval
    "coldstart_azure_bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

Indeed, the functions with many dependencies can be several times slower to start.

Does Deployment Method Matter?
------------------------------

There are multiple ways to deploy Azure Functions. The charts below compare three of them:

- **No Zip**&mdash;traditional AppService-style deployment based on Kudu (`--nozip` option in `func` CLI)
- **Local Zip**&mdash;uploading a zip package to the local file system of the Function App and setting `RUN_FROM_PACKAGE=1` in application settings
- **External Zip**&mdash;uploading a zip package to blob storage and setting `RUN_FROM_PACKAGE=<blob sas token>` in application settings

{{< chart_interval
    "coldstart_azure_bydeploymentcs"
    "Cold start durations per deployment method for C# functions"
    true >}}

{{< chart_interval
    "coldstart_azure_bydeploymentjs"
    "Cold start durations per deployment method for JavaScript functions"
    true >}}

The differences between deployment methods are hardly visible.
