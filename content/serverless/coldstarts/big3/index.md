---
title: "Comparison of Cold Starts in Serverless Functions across AWS, Azure, and GCP"
lastmod: 2021-01-05
thumbnail: big3_thumb.jpg
images: [big3.jpg]
description: "AWS Lambda, Azure Functions, and Google Cloud Functions compared in terms of cold starts across all supported languages"
tags: ["Cold Starts", "AWS Lambda", "Azure Functions", "Google Cloud Functions", "AWS", "Azure", "GCP"]
ghissueid: 1
---

This article compares Function-as-a-Service offerings of Big-3 cloud providers in terms of cold starts. AWS Lambda, Azure Functions (Consumption Plan), and Google Cloud Functions are all dynamically scaled and billed-per-execution compute services. Instances of cloud functions are added and removed dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Read more: [Cold Starts in Serverless Functions](/serverless/coldstarts/define/).

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after deployment.

After that request is processed, the instance stays alive to be reused for subsequent requests.

The strategy for reuse differs very between the cloud vendors:

| Service                   | Idle instance lifetime           |
|---------------------------|----------------------------------|
| AWS Lambda                | 5-7 minutes                      |
| Azure Functions           | Mostly between 20 and 30 minutes |
| Google Cloud Functions    | 15 minutes                       |

AWS and Google Cloud have the policies to recycle an idle instance after a predefined period, 5 to 7 and 15 minutes respectively. Azure employ some other strategies to determine the threshold, potentially based on the history of the past invocations.

Learn more about lifetime: [AWS Lambda](/serverless/coldstarts/aws/intervals/), [Azure Functions](/serverless/coldstarts/azure/intervals/), [Google Cloud Functions](/serverless/coldstarts/gcp/intervals/).

How Slow Are Cold Starts?
-------------------------

The following chart shows the comparison of typical cold start durations for common languages across three cloud providers. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< featured >}}

{{< chart_interval
    "coldstart_all_bylanguage"
    "Typical cold start durations per language" >}}

{{< /featured >}}

AWS clearly leads with all languages being **well below 1 second**. GCP start-up usually takes **between 0.5 and 2 seconds**. Azure is a clear underdog with startup times often **up to 5 seconds**.

All functions above run on Linux.

Read the detailed statistics: [AWS Lambda](/serverless/coldstarts/aws/languages/), [Azure Functions](/serverless/coldstarts/azure/languages/), [Google Cloud Functions](/serverless/coldstarts/gcp/languages/).

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployment package size will further increase the cold start latency.

The following chart compares three JavaScript functions with the various number of referenced NPM packages:

{{< featured >}}

{{< chart_interval
    "coldstart_all_bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

{{< /featured >}}

The trend is quite consistent: larger packages cause a significant slowdown of the cold start.

AWS and GCP are mostly comparable. Note that this test deployed Azure Functions to Windows, which explains the difference with the per-language chart.

Details per provider: [AWS Lambda](/serverless/coldstarts/aws/), [Azure Functions](/serverless/coldstarts/azure/), [Google Cloud Functions](/serverless/coldstarts/gcp/).