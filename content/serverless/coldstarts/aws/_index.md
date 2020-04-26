---
title: "Cold Starts in AWS Lambda"
lastmod: 2020-04-26
layout: single
description: Selection of languages, instance sizes, dependencies, VPC, and more
tags: ["Cold Starts", "AWS", "AWS Lambda"]
thumbnail: coldlambda_thumb.jpg
images: [coldlambda.jpg]
ghissueid: 2
---

This article describes AWS Lambda&mdash;the dynamically scaled and billed-per-execution compute service. Instances of Lambdas are added and removed dynamically. When a new instance handles its first request, the response time increases, which is called a **cold start**.

Read more: [Cold Starts in Serverless Functions](/serverless/coldstarts/define/).

When Does Cold Start Happen?
----------------------------

The very first cold start happens when the first request comes in after deployment.

After that request is processed, the instance stays alive to be reused for subsequent requests. There is no predefined threshold after the instance gets recycled, the empiric data show some variance of the idle period.

The following chart estimates the probability of an instance to be recycled after the given period of inactivity:

{{< chart_line
    "coldstart_aws_interval"
    "Probability of a cold start happening before minute X" >}}

Cold starts happen **10 minutes** after the previous request.

Read more: [When Does Cold Start Happen on AWS Lambda?](/serverless/coldstarts/aws/intervals/)

How Slow Are Cold Starts?
-------------------------

The following chart shows the typical range of cold starts in AWS Lambda, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval
    "coldstart_aws_bylanguage"
    "Typical cold start durations per language" >}}

JavaScript, Python, Go, Java, and Ruby are all comparable: most of the time they complete within **500 milliseconds** and almost always within **800 milliseconds**.

C# is a distinct underdog. The chart shows statistics for instances with 2 GB of allocated RAM, which are the fastest (see below). Cold starts of this instance size span between **0.5 and 1.0 seconds**.

View detailed distributions: [Cold Start Duration per Language](/serverless/coldstarts/aws/languages/).

Does Instance Size Matter?
--------------------------

AWS Lambda has a setting to define the memory size that gets allocated to a single instance of a function. Are larger instances faster to load?

Most language runtimes have no visible difference in cold start duration of different instance sizes. Here is the chart for JavaScript:

{{< chart_interval
    "coldstart_aws_bymemory"
    "Cold start durations per instance size, JavaScript functions" >}}

However, .NET (C#/F#) functions are the exception. The bigger the instance, the faster startup time it has:

{{< chart_interval
    "coldstart_aws_bymemorycs"
    "Cold start durations per instance size, C# functions" >}}

Same comparison for larger functions: [Cold Start Duration per Instance Size](/serverless/coldstarts/aws/instances/).

Does Package Size Matter?
-------------------------

The above charts show the statistics for tiny "Hello World"-style functions. Adding dependencies and thus increasing the deployed package size will further increase the cold start durations.

The following chart compares three JavaScript functions with the various number of referenced NPM packages:

{{< chart_interval
    "coldstart_aws_bydependencies"
    "Cold start durations per deployment size (zipped)" >}}

Indeed, the functions with many dependencies can be 5-10 times slower to start.

What Is The Effect Of VPC Access?
---------------------------------

AWS Lambda might need to access resources inside Amazon Virtual Private Cloud (Amazon VPC). In the past, configuring VPC access slowed down the cold starts significantly.

This is not true anymore, as the effect of VPC is minimal:

{{< chart_interval
    "coldstart_aws_byvpc"
    "Cold start durations of the same Node.js Lambda with and without VPC access" >}}