---
title: "Azure Functions: Cold Start Duration per Language"
lastmod: 2021-01-05
tags: ["Cold Starts", "Azure", "CSharp", "JavaScript", "Python", "Java", "Azure Functions"]
nofeed: true
thumbnail: languages_chart_thumb.png
---

The following chart shows the typical range of cold starts in Azure Functions, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval
    "coldstart_azure_bylanguagega"
    "Typical cold start durations per language" >}}

The charts below give the distribution of cold start durations per runtime version and supported programming language. They all apply to V2 and Windows, unless stated otherwise.

All charts have the same horizontal scale (0-20 sec) to make them easily comparable.

**C#**:

{{< chart_hist
     "coldstart_azure_csharp"
     "Cold start durations of Azure Functions V2 in C#"
     20 >}}

**JavaScript**:

{{< chart_hist
     "coldstart_azure_js"
     "Cold start durations of Azure Functions V2 in JavaScript"
     20 >}}

**Java**:

{{< chart_hist
     "coldstart_azure_java"
     "Cold start durations of Azure Functions V2 in Java"
     20 >}}

**Python (Linux)**:

{{< chart_hist
     "coldstart_azure_python"
     "Cold start durations of Azure Functions in Python running on Linux"
     20 >}}

**PowerShell**:

{{< chart_hist
     "coldstart_azure_powershell"
     "Cold start durations of Azure Functions in PowerShell"
     20 >}}

Go back to [Cold Starts in Azure Functions](/serverless/coldstarts/azure/).