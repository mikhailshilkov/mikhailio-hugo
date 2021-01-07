---
title: "When Does Cold Start Happen on Google Cloud Functions?"
lastmod: 2021-01-05
tags: ["Cold Starts", "GCP", "Google Cloud Functions"]
nofeed: true
thumbnail: interval_chart_thumb.png
---

The very first cold start happens when the very first request comes in after deployment.

After that request is processed, the instance stays alive for the time being to be reused for subsequent requests. But for how long?

The following chart attempts to answer this question. It plots the response duration in seconds (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the data set. Blue points are cold starts and red points are responses from warm instances:

{{< chart_scatter
    "coldstart_gcp_scatter"
    "Cold and warm latency as a function of interval between two subsequent requests" >}}

Instances are recycled after **15 minutes** of inactivity. Google stopped keeping idle instances for many hours, as they used to do.

The following chart estimates the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line
    "coldstart_gcp_interval"
    "Probability of a cold start happening before minute X" >}}

Go back to [Cold Starts in Google Cloud Functions](/serverless/coldstarts/gcp/).