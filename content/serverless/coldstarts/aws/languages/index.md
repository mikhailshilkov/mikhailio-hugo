---
title: "AWS Lambda: Cold Start Duration per Language"
lastmod: 2019-03-22
tags: ["Cold Starts", "AWS", "JavaScript", "Python", "Go", "C#", "Ruby", "Java", "AWS Lambda"]
nofeed: true
thumbnail: languages_chart_thumb.png
---

The following chart shows the typical range of cold starts in AWS Lambda, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval 
    "coldstart_aws_bylanguage"
    "Typical cold start durations per language" >}}

The charts below give the distribution of cold start durations per supported programming language. All charts *except the last one* have the same horizontal scale (0.0-1.0 sec) to make them easily comparable.

**JavaScript**:

{{< chart_hist 
     "coldstart_aws_js" 
     "Cold start durations of AWS Lambda in JavaScript" 
     "1.0" >}}

**Python**:

{{< chart_hist 
     "coldstart_aws_python" 
     "Cold start durations of AWS Lambda in Python" 
     "1.0" >}}

**Java**:

{{< chart_hist 
     "coldstart_aws_java" 
     "Cold start durations of AWS Lambda in Java" 
     "1.0" >}}

**Go**:

{{< chart_hist 
     "coldstart_aws_go" 
     "Cold start durations of AWS Lambda in Go" 
     "1.0" >}}

**Ruby**:

{{< chart_hist 
     "coldstart_aws_ruby" 
     "Cold start durations of AWS Lambda in Ruby" 
     "1.0" >}}

**C#** (notice that the scale of X axis is different from the other charts):

{{< chart_hist 
     "coldstart_aws_csharp" 
     "Cold start durations of AWS Lambda in C#" 
     5 >}}     

Go back to [Cold Starts in AWS Lambda](/serverless/coldstarts/aws/).