---
title: "AWS Lambda: Cold Start Duration per Instance Size"
lastmod: 2021-01-05
tags: ["Cold Starts", "AWS", "JavaScript", "AWS Lambda"]
nofeed: true
thumbnail: instances_chart_thumb.png
---

AWS Lambda has a setting to define the memory size that gets allocated to a single instance of a function. The CPU resources are allocated proportionally to the memory. So, in theory, larger instances could start faster.

However, for most runtimes, there seems to be no significant speed-up of the cold start as the instance size grows.

Here is the comparison for a "Hello-World" JavaScript function:

{{< chart_interval
    "coldstart_aws_bymemory"
    "Cold start durations per instance size, JavaScript, no dependencies" >}}

Here is the same comparison for a JavaScript function with **14 MB** (zipped) of NPM packages:

{{< chart_interval
    "coldstart_aws_bymemoryxl"
    "Cold start durations per instance size, JavaScript, 14 MB (zipped) of dependencies" >}}

Here is the same comparison for a JavaScript function with **35 MB** (zipped) of NPM packages:

{{< chart_interval
    "coldstart_aws_bymemoryxxxl"
    "Cold start durations per instance size, JavaScript, 35 MB (zipped) of dependencies" >}}

None of the charts shows a considerable advantage of larger instance sizes for the cold starts.

However, .NET (C#/F#) functions are the exception. The bigger the instance, the faster startup time it has:

{{< chart_interval
    "coldstart_aws_bymemorycs"
    "Cold start durations per instance size, C# functions, no dependencies" >}}

Go back to [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).