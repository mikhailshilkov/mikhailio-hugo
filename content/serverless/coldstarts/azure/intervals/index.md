---
title: "When Does Cold Start Happen on Azure Functions?"
lastmod: 2021-01-05
tags: ["Cold Starts", "Azure", "Azure Functions"]
nofeed: true
thumbnail: interval_chart_thumb.png
---

The first cold start happens when the very first request comes in after deployment.

After that request is processed, the instance stays alive for the time being to be reused for subsequent requests. But for how long?

The following chart answers this question. It plots the response duration in seconds (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the data set. Blue points are cold starts and red points are responses from warm instances:

{{< chart_scatter
    "coldstart_azure_scatter"
    "Cold and warm latency as a function of the interval between two subsequent requests" >}}

After that request is processed, the instance stays alive mostly **from 20 to 30 minutes** to be reused for subsequent requests. Some cold starts happen earlier than 10 minutes, some instances last for more than 50 minutes, so the behavior seems less deterministic than it used to be in the past. It's likely related to the new [algorithm to predict the next invocation](https://mikhail.io/2020/06/eliminate-cold-starts-by-predicting-invocations-of-serverless-functions/).

Here is a formal visualization of the same data. It plots the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line
    "coldstart_azure_interval"
    "Probability of a cold start happening before minute X" >}}

Go back to [Cold Starts in Azure Functions](/serverless/coldstarts/azure/).