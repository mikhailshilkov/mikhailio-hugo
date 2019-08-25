---
title: AWS Lambda Cold Starts After 10 Minutes
date: 2019-08-20
thumbnail: teaser.png
tags: ["Cold Starts", "AWS", "AWS Lambda"]
description: How AWS Lambda changed the policy of recycling idle instances
ghissueid: 18
---

I've just released an update to the [Serverless Cold Starts](/serverless/coldstarts/) section of my website. The most significant change to the previous dataset seems to be in how AWS treats idle instances of AWS Lambda.

Cold starts are expensive, so all cloud providers preserve a warm instance of a cloud function even when the application is idle. If the function stays unused for an extended period, such idle instance might eventually be recycled.

Azure Functions recycles its instances after 20 minutes of idling. Google Cloud Functions has no fixed value, but most often, instances may survive several hours of inactivity. The policy of AWS Lambda has recently changed.

## Pre-July: between 25 and 60 minutes

The behavior of AWS Lambda used to look a bit random: an average idle instance would typically survive between 25 and 60 minutes:

{{< chart_scatter
    "aws-lambda-10-minutes/old_scatter"
    "Examples of AWS Lambda idle instances lifecycle in June 2019" >}}

This chart plots the response duration (Y-axis) by the interval since the previous requests (X-axis). Each point represents a single request in the dataset. Blue points are cold starts, and red points are responses from warm instances.

While some cold starts happen after 10 minutes or so, many instances survive up to 1 hour.

## Post-July: the fixed lifespan of 10 minutes

The chart has changed in July:

{{< chart_scatter 
    "aws-lambda-10-minutes/new_scatter"
    "Examples of AWS Lambda idle instances lifecycle in August 2019" >}}

There is no ambiguity anymore: every instance lives for precisely 10 minutes after the last request.

This behavior is similar to Azure Functions, but the value is two times shorter: 10 minutes for AWS versus 20 minutes for Azure.

## Month-over-month view

I broke down the data set by month and calculated the periods when an idle instance is recycled with 10%, 50%, and 90% probabilities. Here is the chart that I produced, the higher line means the higher duration of survival:

{{< chart_line_multi
    "aws-lambda-10-minutes/interval_history"
    "The typical lifetime of an idle AWS Lambda" "2019 by month" "minutes" >}}

Once again, we can see how the broader range of probabilistic lifespans collapsed into the deterministic 10-minute threshold.

## Practical Takeaway

Applications with infrequent invocations running in AWS Lambda might experience more cold starts compared to pre-July time.

Cold starts are a major perceived pain point of serverless services. While cloud providers are fighting the cold starts on many fronts, it's interesting to see a change in AWS Lambda, which seemingly goes the opposite direction.

On the other hand, the predictability of a fixed lifespan makes the keep-it-warm workarounds more reliable. Whenever you feel a cold start might be a problem for your Lambda, you might want to issue a warm-up request every 5 minutes. You can find an example of doing so in a structured way in [AWS Lambda Warmer as Pulumi Component](/2018/08/aws-lambda-warmer-as-pulumi-component/).

Read more about [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).