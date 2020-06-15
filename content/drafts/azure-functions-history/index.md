---
title: "Azure Functions History"
date: 2020-06-01
draft: true
thumbnail: teaser.jpg
tags: []
description: ""
ghissueid: 
---

Intro: Azure Functions exist for 3 years. They have many moving pieces and sometimes hard to understand. I find it useful to know the past history, how they got here. That's the goal for today. In the end, you should be able to understand how Azure Functions work and why they are this way.

## Azure Web Sites

PaaS to host web sites. Example give hosting a Wordpress.

Ease of use: several clicks in the portal to create. Deploy with FTP, git, WebDeploy.


## Azure Web Jobs

A simple way to run background tasks. Migrate people away from Cloud Apps (that's the original Azure service, pre-RM).

Copy your exe/cmd/sh/... file to a special folder. Deploy to Web Sites. Azure takes care of running it on the same machine. Continous jobs run all the time, schedule jobs run on schedule.

## WebJobs SDK

Web Job is just an exe file, you could do whatever you want. However, there are common tasks that people needed to run. E.g. process messages from queues or watch for new blobs in a storage container.

Driven by desire to simplify this experience, MS released WebJobs SDK where you write code like this.

```cs
class Program
{
    static void Main(string[] args)
    {
        JobHost host = new JobHost();
        host.RunAndBlock();
    }

    public static void SquishNewlyUploadedPNGs(
        [BlobInput("input/{name}")] Stream input,
        [BlobOutput("output/{name}")] Stream output)
    {
        var quantizer = new WuQuantizer();
        using (var bitmap = new Bitmap(input))
        {
            using (var quantized = quantizer.QuantizeImage(bitmap))
            {
                quantized.Save(output, ImageFormat.Png);
            }
        }

    }
}
```

So it's still a console application, but you can structure your code a little functions.

https://www.hanselman.com/blog/IntroducingWindowsAzureWebJobs.aspx

Important: Web Jobs vs WebJobs SDK. Same distinction will apply for Functions

## Azure App Service

Realized that Web Sites is too narrow. Also, unify other services like Mobile Services and API Apps under the same brack "App Service".

App Service Plan. App Service Premium Plan.

## Scalability

### Single instance

Picture of HTTP Load Balancer, configuration, file in storage, controller, instance. If an instance dies (e.g. OS needs to be updated), a new instance is created.

### Multiple instances

One instance may not be enough. So, you can ask for 3 instances. That's just a configuration setting, controller reads it and provisions enough instances. The load balancer is configured to use all of them.

What happens with Web Jobs in this case? They will run on every instance. They will compete to each other, e.g. take messages from the same queue. So, you may need to put some thought into issues that may come from that, e.g. in you need messages to be processed in order.

There is a special flag to mark a web job as a singleton, so that it runs on a single instance at a time.

### Autoscaling

Typically, you workload isn't static over time. For example, higher load during working hours. If you provision instance count for that maximum, you lose a lot of money on idle instances during the night.

Instead of scaling manually every day, or writing a script for that, App Service has a built-in feature called autoscaling. In the example above, you can set the autoscaling rule for 9-18. Controller takes care of applying these rules.

Sometimes, there's no clear-cut time-based scaling rule. Instead, you can measure the actual utilization of existing instances, and add or remove them if it goes out of bounds. Example. Sources are CPU or queue length.

The scale controller only kicks every 5 minutes. It takes time and resources to create/remove instances, so you don't want to be doing this too often. But that means you can miss a spike in load.

Note that you pay for each instance, so be careful with scaling or it may get expensive.

## Azure WebJobs SDK Script

A cool thing about App Service is that it can run pretty much any tech stack. While most apps were probably .NET, App Service and Web Jobs could run Node.js, or even things like PHP. But WebJobs SDK wasn't like this: it was for .NET only.

What if I want to run a Node.js script when a queue message arrives? That's the goal of WebJobs SDK Script. Instead of `JobHost` instance, it runs a `ScriptHost` instance that can forward the incoming requests to external scripts. The host was primarily built and optimized for Node.js, but it could run many other types of external scripts, e.g. PowerShell.

The host used a library called Edge.js to run Node.js scripts inside the same .NET process of the host itself. All other languages would be out-of-proc, which meant that a new process was created for each separate request. (Obviously, has some performance issues.)

Because you can't use .NET attributes in arbitrary scripts, the metadata were moved to a separate file `manifest.json`.

https://github.com/Azure/azure-functions-host/commits/v1?before=429de5ccbdc5a67481025287a2b0021c830d4124+1995

## Azure Functions Launch

Thanks for sticking around for that long, finally, we start with Azure Functions.

In march 2016, Azure Functions were announced. In essence, Azure Functions were the same WebJobs SDK Script. URL of Azure Functions is azurewebsites.net.

But with two important changes:

- New developer experience (for instance, editing in the portal)
- New billing model

While DX is important for overall product adoption, it's the billing model that has profound implication on the way the service works, so I want to focus on it. The model is called "Consumption Plan".

## Consumption Plan

Instead of paying per instance per hour, the new Consumption Plan only charges for the time actually used. This brings a fundamental mismatch between what Azure spends and what Azure charges for. They still run VMs, but they only charge if that VM is actually running user's workload.

Anyway, Microsoft modified existing App Service plans and released a new Consumption Plan. The idea is relatively straightforward:

- Use the same general setup: load balancers, scale controller, instances, autoscaling, ARM
- Use the cheapest VMs that can do the work: I'm not sure if that's published anywhere, but I believe A1 instances are used (1 vCore, 1.75GB of memory). It's a very basic VM with limited resources
- Scale to zero

## Scale to Zero

The vast majority of Function Apps would actually cost nothing. Developers would deploy something to try and live those apps running forever. Microsoft can't keep those apps always on, or they go broke because of all those idle VMs. So now, if an App has no requests within several minutes, scale controller would kill its only instance.

Walk through new message, new HTTP call, scale out.

## Early Performance Issues

### Cold starts

### Out-of-proc languages

### Scale out

## Aggressive Scale Controller

## V2: Out-of-proc Workers

.NET still in-proc: caught by SDK reachness.

## Custom Handlers

Your own language.

## Linux Support

Docker

## App Service Plan, Premium Plan, KEDA
