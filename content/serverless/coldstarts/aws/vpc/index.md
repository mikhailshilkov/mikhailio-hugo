---
title: "Cold Start Duration of VPC-connected AWS Lambda"
lastmod: 2019-09-26
tags: ["Cold Starts", "AWS", "JavaScript", "VPC", "AWS Lambda"]
nofeed: true
thumbnail: vpc_chart_thumb.png
---

AWS Lambda might need to access resources inside Amazon Virtual Private Cloud (Amazon VPC). In the past, configuring VPC access slowed down the cold starts significantly.

This is not true anymore, as the effect of VPC is minimal:

{{< chart_interval
    "coldstart_aws_byvpc"
    "Cold start durations of the same Node.js Lambda with and without VPC access" >}}

Go back to [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).