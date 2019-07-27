---
title: "Performance and cost benchmark of various APIs used in AWS Lambda (e.g. AWS APIs and Twilio, Stripe, etc) - what's the overhead"
date: 2019-07-11
thumbnail: teaser.jpg
tags: ["Azure"]
description:
ghissueid: 16
---

## Abstract
APIs are commonly used in modern AWS applications and specifically in AWS Lambda.
This article offers a benchmark of the performance and cost impact of different APIs used with AWS Lambda. This is important because:
A Lambda can get a timeout if an API is taking too long
The user is paying for every 100ms of execution time (pay-per-use), so if an API takes too much time it will have a big impact on the Lambda cost.

The article:
- Why it makes sense to use many APIs when building a modern application - write less code, use existing services, focus on your business logic.
- What are the risks of slow APIs when using AWS Lambda.
- Show a simple app that uses 4 APIs (2 in AWS and 2 outside) and benchmark their performance and cost impact using Epsagon. (with any programming language of your choice - Python or Node are easiest since there is auto-instrumentation). Use the Timeline view to show the latency and calculate the cost impact when doing high scale requests processing.

## TOC

APIs when building applications
- The world talks API
- Examples of API: payment, email, mapping
- Cloud runs on APIs: every AWS service has API
- Gloal: reuse existing services, focus on what your core values and differenciators

APIs in serverless
- Serverless has low barier of entry, requires little boilerplace
- Lambda functions as cloud glue
- Link https://epsagon.com/blog/the-importance-and-impact-of-apis-in-serverless/

Role of Performance
- APIs are usually sync request-response over HTTP
- They may be fast, they may be slow, this is not clear from API definition itself
- May get slow at random time points or under higher load

Implications of slow APIs
- Timeouts and error handling
- Additional cost (link https://epsagon.com/blog/how-much-does-aws-lambda-cost/)
- Poor user experience if on sync path of end user

Mitigation strategies
- Test in advance and measure
- Monitor while running in production

Sample App
- Lambda gets a message with name and coordinates
- Reverse geo code to get the address (https://geocode.xyz)
- Save a log entry to Dynamo DB
- Load email template from S3
- Send email (https://sendgrid.com)

Benchmark
- Run the lambda once
- Go to Timeline view
- Make conclusions about durations
- Run the lambda 1000 times
- Look at Architecture map
- Make conclusions about the cost
- Suggest breaking down the single lambda into multiple steps (link https://epsagon.com/blog/the-right-way-to-distribute-messages-effectively-in-serverless-applications/)

Conclusions
- Test API performance before relying on them
- Monitor the performance and cost of API in production (link https://epsagon.com/blog/finding-serverless-hidden-costs/)
- Optimize the structure of your application for fast responses to users and resilience