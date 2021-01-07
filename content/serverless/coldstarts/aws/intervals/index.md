---
title: "When Does Cold Start Happen on AWS Lambda?"
lastmod: 2021-01-05
tags: ["Cold Starts", "AWS", "AWS Lambda"]
nofeed: true
thumbnail: intervals_chart_thumb.png
---

The first cold start happens when the very first request comes in.

After that request is processed, the instance stays alive for the time being to be reused for subsequent requests. But for how long?

The following chart attempts to answer this question. It plots the response duration in seconds (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the data set. Blue points are cold starts and red points are responses from warm instances:

{{< chart_scatter
    "coldstart_aws_scatter"
    "Cold and warm latency as a function of interval between two subsequent requests" >}}

The lifetime of an idle instance is between **5 and 7 minutes**.

This is confirmed by the following chart, which estimates the probability of a cold start (Y-axis) by the interval between two subsequent requests (X-axis):

{{< chart_line
    "coldstart_aws_interval"
    "Probability of a cold start happening before minute X" >}}

Go back to [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).
