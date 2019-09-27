---
title: "Azure Functions: Cold Start Duration per Language"
lastmod: 2019-09-26
tags: ["Cold Starts", "Azure", "C#", "JavaScript", "Python", "Java", "Azure Functions"]
nofeed: true
thumbnail: languages_chart_thumb.png
---

The following chart shows the typical range of cold starts in Azure Functions V2, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval
    "coldstart_azure_bylanguage"
    "Typical cold start durations per language" >}}

The charts below give the distribution of cold start durations per runtime version and supported programming language. All charts (except PowerShell preview) have the same horizontal scale (0-12 sec) to make them easily comparable.

## Azure Functions V2

**C#**:

{{< chart_hist
     "coldstart_azure_csharp"
     "Cold start durations of Azure Functions V2 in C#"
     12 >}}

**JavaScript**:

{{< chart_hist
     "coldstart_azure_js"
     "Cold start durations of Azure Functions V2 in JavaScript"
     12 >}}

**Java**:

{{< chart_hist
     "coldstart_azure_java"
     "Cold start durations of Azure Functions V2 in Java"
     12 >}}

**Python (Linux)**:

{{< chart_hist
     "coldstart_azure_python"
     "Cold start durations of Azure Functions in Python running on Linux"
     12 >}}

**PowerShell (preview)**:

{{< chart_hist
     "coldstart_azure_powershell"
     "Cold start durations of Azure Functions in PowerShell"
     26 >}}

## Azure Functions V1

**C#**:

{{< chart_hist
     "coldstart_azure_v1csharp"
     "Cold start durations of Azure Functions V1 in C#"
     12 >}}

**JavaScript**:

{{< chart_hist
     "coldstart_azure_v1js"
     "Cold start durations of Azure Functions V1 in JavaScript"
     12 >}}

Go back to [Cold Starts in Azure Functions](/serverless/coldstarts/azure/).