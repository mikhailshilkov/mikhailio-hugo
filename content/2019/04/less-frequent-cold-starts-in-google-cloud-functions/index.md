---
title: Less Frequent Cold Starts in Google Cloud Functions
date: 2019-04-27
thumbnail: teaser.png
tags: ["Cold Starts", "GCP", "Google Cloud Functions"]
description: Google keeps idle instances of Cloud Functions alive for many hours.
ghissueid: 10
---

Several days ago, I released an update to the [Serverless Cold Starts](/serverless/coldstarts/) section of my website. The most significant change to the previous dataset seems to be in how GCP treats idle instances of Google Cloud Functions.

Cold starts are expensive, so all cloud providers preserve a warm instance of a cloud function even when the application is idle. If the function stays unused for an extended period, such idle instance might eventually be recycled.

Azure Functions recycles its instances after 20 minutes of idling. AWS Lambda has no fixed value, but in practice, it's between 25 and 65 minutes of idling.

## Recycling of Idle Instances in Google Cloud Functions

The behavior of Google Cloud Functions used to look quite random: an idle instance could survive for 5 hours or die after 5 minutes.

{{< chart_scatter 
    "less-frequent-cold-starts-in-google-cloud-functions/old_scatter"
    "Examples of GCF idle instances lifecycle in February 2019" >}}

This chart plots the response duration (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the dataset. Blue points are cold starts, and red points are responses from warm instances.

The chart has changed in April:

{{< chart_scatter 
    "less-frequent-cold-starts-in-google-cloud-functions/new_scatter"
    "Examples of GCF idle instances lifecycle in April 2019" >}}

It seems that this chart shows fewer points, but that's deceptive: the points are just much denser and almost all of the responses are warm! Even after 4-5 hours of idling, the instance survives most of the time.

The following chart estimates the probability (Y-axis) of a cold start by the interval between two subsequent requests (X-axis). A higher line means higher chances of an instance being recycled:

{{< chart_line_multi 
    "less-frequent-cold-starts-in-google-cloud-functions/bytime_interval" 
    "Probability of a cold start happening before minute X in February vs. April" >}}

While the chance of surviving 5 hours of inactivity used to be about 15%, now it's flipped, and an idle instance survives for 5 hours in almost 85% of cases.

## What Are The Other Factors?

It looks like larger instances in terms of provisioned memory are more likely to survive than smaller instances:

{{< chart_line_multi 
    "less-frequent-cold-starts-in-google-cloud-functions/bymemory_interval" 
    "Probability of a cold start by instance size" >}}

After 5 hours of idling, an instance of 128 MB is 2.5x more likely to be recycled compared to a 2 GB instance.

A similar effect is observed for language runtimes:

{{< chart_line_multi 
    "less-frequent-cold-starts-in-google-cloud-functions/bylanguage_interval" 
    "Probability of a cold start by instance size by language" >}}

While Python and Javascript are in the same ballpark, Go functions seem to survive longer and more reliably.

## Practical Takeaway

Cloud providers are fighting the cold starts on many fronts. Now, it seems that Google found a way to keep warm container instances idle for extended periods without too much overhead for their infrastructure.

With this recent improvement, the practice of having a dummy timer-based trigger to keep function instances warm gets less useful. Which is a good thing: less hand-holding and management means more time on developing useful features! One tiny step closer to a serverless nirvana.