---
title: "Azure Functions: Cold Start Duration per Language"
lastmod: 2019-02-24
tags: ["Cold Starts", "Azure", "C#", "JavaScript", "Python", "Java", "Azure Functions"]
nofeed: true
thumbnail: languages_chart_thumb.png
---

The following chart shows the typical range of cold starts in Azure Functions V2, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval 
    "coldstart_azure_bylanguagewindows"
    "Typical cold start durations per language"
    true >}}

The charts below give the distribution of cold start durations per runtime version and supported programming language. All charts have the same horizontal scale (0-18 sec) to make them easily comparable.

## Azure Functions V2

**C#**:

{{< chart_hist 
     "coldstart_azure_csharp" 
     "Cold start durations of Azure Functions V2 in C#" 
     18 >}}

**JavaScript**:

{{< chart_hist 
     "coldstart_azure_js" 
     "Cold start durations of Azure Functions V2 in JavaScript" 
     18 >}}

**Java**:

{{< chart_hist 
     "coldstart_azure_java" 
     "Cold start durations of Azure Functions V2 in Java" 
     18 >}}

## Azure Functions V1

**C#**:

{{< chart_hist 
     "coldstart_azure_v1csharp" 
     "Cold start durations of Azure Functions V1 in C#" 
     18 >}}

**JavaScript**:

{{< chart_hist 
     "coldstart_azure_v1js" 
     "Cold start durations of Azure Functions V1 in JavaScript" 
     18 >}}

## Azure Functions on Linux

There is a preview version of Azure Functions Consumption Plan running on top of Linux and Service Fabric Mesh, which is a very different stack from Windows- and AppService-based production environments.

The cold starts of **Python** functions seem to be comparable though:

{{< chart_hist 
     "coldstart_azure_python" 
     "Cold start durations of Azure Functions in Python running on Linux"
     18 >}}

Go back to [Cold Starts in Azure Functions](/serverless/coldstarts/azure/).