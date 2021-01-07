---
title: "Cold Starts in Google Cloud Functions"
lastmod: 2021-01-05
layout: single
tags: ["Cold Starts", "GCP", "Google Cloud Functions"]
description: Running GA and Beta languages on different instance sizes
thumbnail: coldgcp_thumb.jpg
images: [coldgcp.jpg]
ghissueid: 4
---

This article describes Google Cloud Functions&mdash;the dynamically scaled and billed-per-execution compute service. Instances of Cloud Functions are added and removed dynamically. When a new instance handles its first request, the response time suffers, which is called a **cold start**.

Learn more: [Cold Starts in Serverless Functions](/serverless/coldstarts/define).

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after deployment.

After that request is processed, the instance stays alive to be reused for subsequent requests. There is no predefined threshold for instance recycling: the empiric data show a high variance of idle-but-alive periods.

The following chart estimates the probability of an instance to be recycled after the given period of inactivity:

{{< chart_line
    "coldstart_gcp_interval"
    "Probability of a cold start happening before minute X" >}}

Instances are recycled after **15 minutes** of inactivity. Google stopped keeping idle instances for many hours, as they used to do.

Read more: [When Does Cold Start Happen on Google Cloud Functions?](/serverless/coldstarts/gcp/intervals)

How Slow Are Cold Starts?
-------------------------

The following chart shows the typical range of cold starts in Google Cloud Functions, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval
    "coldstart_gcp_bylanguage"
    "Typical cold start durations per language" >}}

Python functions look a bit slower, however, not significantly.

View detailed distributions: [Cold Start Duration per Language](/serverless/coldstarts/gcp/languages).

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with the various number of referenced NPM packages:

{{< chart_interval
    "coldstart_gcp_bydependencies"
    "Comparison of cold start durations per deployment size (zipped)" >}}

Indeed, the functions with many dependencies can be 5 times slower to start.

Does Instance Size Matter?
--------------------------

Google Cloud Functions have a setting to define the memory size that gets allocated to a single instance of a function. Are larger instances faster to load?

{{< chart_interval
    "coldstart_gcp_bymemory"
    "Comparison of cold start durations per instance size" >}}

There seems to be no significant speed-up of the cold start as the instance size grows.

Same comparison for larger functions: [Cold Start Duration per Instance Size](/serverless/coldstarts/gcp/instances).