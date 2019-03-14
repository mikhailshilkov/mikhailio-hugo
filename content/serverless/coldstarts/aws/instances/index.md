---
title: "AWS Lambda: Cold Start Duration per Instance Size"
lastmod: 2019-02-24
tags: ["Cold Starts", "AWS", "JavaScript", "AWS Lambda"]
nofeed: true
thumbnail: instances_chart_thumb.png
---

AWS Lambda has a setting to define the memory size that gets allocated to a single instance of a function. The CPU resources are allocated proportionally to the memory. So, in theory, larger instances could start faster.

However, there seems to be no significant speed-up of the cold start as the instance size grows.

Here is the comparison for a "Hello-World" JavaScript function:

{{< chart_interval 
    "coldstart_aws_bymemory"
    "Comparison of cold start durations per instance size, no dependencies" >}}

Here is the same comparison for a JavaScript function with **14 MB** (zipped) of NPM packages:

{{< chart_interval 
    "coldstart_aws_bymemoryxl"
    "Comparison of cold start durations per instance size, 14 MB (zipped) of dependencies" >}}

Here is the same comparison for a JavaScript function with **35 MB** (zipped) of NPM packages:

{{< chart_interval 
    "coldstart_aws_bymemoryxxxl"
    "Comparison of cold start durations per instance size, 35 MB (zipped) of dependencies" >}}

None of the charts shows a considerable advantage of larger instance sizes for the cold starts.

Go back to [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).