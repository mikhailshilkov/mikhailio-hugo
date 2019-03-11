---
title: "Cold Start Duration of VPC-connected AWS Lambda"
lastmod: 2019-02-24
tags: ["Cold Starts", "AWS", "JavaScript", "VPC", "AWS Lambda"]
nofeed: true
thumbnail: vpc_chart_thumb.png
---

AWS Lambda might need to access resources inside Amazon Virtual Private Cloud (Amazon VPC). Configuring VPC access will slow down the cold starts.

The following charts shows the cold start duration distribution of an "Hello World" JavaScript Lambda with VPC connectivity enabled:

{{< chart_hist 
     "coldstart_aws_vpc" 
     "Cold start durations of VPC-connected AWS Lambda" 
     "1.2" >}}

It's interesting that many cold starts are actually fast (the left column). Are they reusing networking infrastructure for multiple Lambda instances?

Here is the comparison of functions with and without VPC connectivity:

{{< chart_interval 
    "coldstart_aws_byvpc"
    "Comparison of cold start durations of the same Lambda with and without VPC access" >}}

Go back to [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).