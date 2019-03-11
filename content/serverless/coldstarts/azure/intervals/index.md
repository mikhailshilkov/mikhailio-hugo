---
title: "When Does Cold Start Happen on Azure Functions?"
lastmod: 2019-02-24
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

There is a distinct borderline visible. Clearly, **an idle instance lives for 20 minutes and then gets recycled**. 

All requests after 20 minutes of idling hit a cold start. A warm instance handles all requests within 20 minutes.

Here is a formal visualization of the same data. It plots the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line 
    "coldstart_azure_interval" 
    "Probability of a cold start happening before minute X" >}}

Go back to [Cold Starts in Azure Functions](/serverless/coldstarts/azure/).