---
title: "Google Cloud Functions: Cold Start Duration per Language"
lastmod: 2019-04-22
tags: ["Cold Starts", "GCP", "JavaScript", "Python", "Go", "Google Cloud Functions"]
nofeed: true
thumbnail: languages_chart_thumb.png
---

The following chart shows the typical range of cold starts in Google Cloud Functions, broken down per language. The darker ranges are the most common 67% of durations, and lighter ranges include 95%.

{{< chart_interval 
    "coldstart_gcp_bylanguage"
    "Typical cold start durations per language" >}}

The charts below show the distribution of cold start durations per supported programming language.
All charts have the same horizontal scale (0-4 sec) to make them easily comparable.

**JavaScript** (currently, the only generally available runtime):

{{< chart_hist 
     "coldstart_gcp_js" 
     "Cold start durations of Google Cloud Functions in JavaScript" 
     4 >}}

**Go** (currently in beta):

{{< chart_hist 
     "coldstart_gcp_go" 
     "Cold start durations of Google Cloud Functions in Go" 
     4 >}}

**Python** (currently in beta):

{{< chart_hist 
     "coldstart_gcp_python" 
     "Cold start durations of Google Cloud Functions in Python" 
     4 >}}

Go back to [Cold Starts in Google Cloud Functions](/serverless/coldstarts/gcp/).