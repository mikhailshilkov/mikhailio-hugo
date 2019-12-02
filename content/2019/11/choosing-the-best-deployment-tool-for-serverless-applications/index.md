---
title: "Choosing the Best Deployment Tool for Your Serverless Applications"
date: 2019-11-12
tags: ["AWS", "Azure", "Serverless", "AWS Lambda", "Azure Functions", "Infrastructure as code"]
description: "Factors to consider while deploying cloud infrastructure for serverless apps."
thumbnail: teaser.jpg
ghissueid: 26
originalSource: IAmOnDemand Blog
originalUrl: https://iamondemand.com/blog/choosing-the-best-deployment-tool-for-your-serverless-applications/
---

Function-as-a-Service solutions, such as AWS Lambda and Azure Functions, are a great way to build modern, scalable, and affordable cloud-native applications. By delegating routine work to cloud providers, serverless applications focus on custom logic to provide the ultimate business value. But, in fact, serverless is more than cloud functions. It's storage, HTTP gateways, databases, queues, monitoring, and security---and your serverless applications are likely to use multiple managed services and consist of many moving parts.

So how do you deploy such applications reliably? There are multiple cloud deployment tools out there! In this article, I identify several criteria to consider when making your decision.

## Point-and-Click or Write Code?

Most tutorials and getting-started guides use web portals, like AWS Management Console or Microsoft Azure portal, to create basic serverless applications and required infrastructure. The visual flow of solutions like these is simple for newcomers to understand, and they can take shortcuts and assume some sensible defaults to streamline the process.

However, simply clicking through the online wizard won't produce reliable outcomes. Two weeks later, for example, you might not be able to follow the exact same sequence of steps to create a copy of your application when you need it. Now imagine if your colleague has to try!

Instead of the manual provisioning process, you can define the infrastructure as code. I'm using “code” in a broad sense here: It can be any machine-readable format that is written by a human and executed by an automated tool.

I strongly recommend using the infrastructure-as-code approach for any application that's beyond simple demos and one-off trials. Put the code definition to the source control, and you'll get repeatable deployments, documentation, a history of changes, and reference materials---all in one step.

## Procedural or Desired State?

Bash or PowerShell scripts are the traditional way to automate. Every cloud provider has a command-line interface (CLI) to manage its resource portfolio, so it's entirely possible to script the provisioning of the entire infrastructure for your serverless application.

However, there are a few downsides to this approach. Naturally, scripts are very imperative: You describe the exact steps to execute, in the required order. And if you need to change the state of an existing environment, you'll likely need to manage update scripts that bring the infrastructure through transition steps. Finally, it's hard to manage failures: If a script fails in the middle, the exact state of your resources will often be unknown.

You can also try the declarative style of Desired State Configuration (DSC). The goal of DSC is to describe the complete state of the infrastructure, regardless of its current state. Then, it functions as an automated tool which reads the desired state, compares it to the current state, and figures out which steps to execute to reconcile the two.

All the tools that I mention in the rest of the article follow the desired-state philosophy.

## Cloud Vendor or Third Party?

Each cloud vendor has its own native tool to manage infrastructure as code: [AWS CloudFormation](https://aws.amazon.com/cloudformation/), [Azure Resource Manager (ARM) templates](https://docs.microsoft.com/en-us/azure/azure-resource-manager/template-deployment-overview), and [Google Cloud Deployment Manager](https://cloud.google.com/deployment-manager/), for example. These are all first-class services, so they have excellent feature coverage and are widely used, stable, and battle-tested.

However, while the vendor tools are robust, they have a set of constraints. Obviously, each tool focuses on one cloud, so mastering CloudFormation won't make you an ARM guru. Also, the deployment managers are fundamental infrastructure components of their respective clouds. Because they need to support every service and feature, they tend to operate at a quite low level. Additionally, they must avoid breaking changes, so legacy features and issues tend to pile up over time. The tools may feel rigid, and because they are closed source and vendor managed, you don't have much influence.

It's worth noting that numerous third-party infrastructure management tools try to compete with cloud vendors, and serverless apps can successfully use many of them. [HashiCorp's Terraform](https://www.terraform.io/), for example, is a cross-provider tool, which covers not only the majority of each cloud's features, but also the configuration of Kubernetes, Docker images, Kafka, monitoring tools, and some databases.

The downside of third-party tools is that they may not offer support for some cloud features. For example, while using Terraform's AzureRM provider, I definitely bumped into missing features, especially for newer services or niche configurations. To compensate for these kinds of issues, third-party tools are usually open source and accept contributions, so an active community is an essential factor.

## Execution on the Client or in the Cloud?

Cloud vendor tools take your definition files and run them from within the managed cloud service. For example, Azure creates a first-class object---deployment---which shows the deployed resources or problems that occurred. CloudFormation can automatically roll back a failed deployment to the previous well-known state.

In contrast, CLI scripts, Terraform, and [Pulumi](https://www.pulumi.com/) run the deployment from the client machine where they are executed, or, even better, from CI/CD servers for most production deployments. This means they have more granular control over the execution flow and error handling, but also that they aren't able to reuse the built-in deployment features of the native-cloud managers.

Some tools, like [Troposphere](https://github.com/cloudtools/troposphere), [AWS Cloud Development Kit (AWS CDK)](https://aws.amazon.com/cdk/), and [Serverless Framework](https://serverless.com/), have their own way to describe the infrastructure. Still, they transpile these definitions to formats like CloudFormation to make use of the cloud deployment engines.

## General Purpose or Specialized?

CloudFormation, ARM templates, and Terraform are all general-purpose tools: You can define serverless applications with them, but that's not their primary focus. Traditional infrastructure and networking solutions still have a far larger audience, so these scenarios attract more attention from the vendors. General-purpose tools lack higher-level abstractions, so the resource definitions tend to be verbose and repetitive.

Instead of general-purpose tools, you can use a specialized solution that is inherently modeled around the concepts of serverless. Serverless Framework is a multi-provider tool, while [AWS Serverless Application Model (SAM)](https://aws.amazon.com/serverless/sam/) is a comparable option from AWS. Another example is Claudia.js---a deployment tool for node-based AWS Lambda.

It's easy to get started with specialized tools, and to use them for implementing basic scenarios. However, if your application is a combination of serverless features and traditional infrastructure, you may need to use more than one tool. In this case, make sure that the benefits of the specialized tools are enough to compensate for the complexity of using multiple options simultaneously.

I struggled with trying to use Serverless Framework for Azure: The experience was not ideal, and some features were missing. Understandably, AWS is Serverless Framework's primary target, so plugins targeting other clouds may lag behind.

## Markup or Programming Language?

If you settle for a desired-state configuration tool, you will likely use a markup language to define the cloud infrastructure. CloudFormation, Google Cloud Deployment Manager, and Serverless Framework use YAML, while ARM templates are defined in JSON. Terraform invented its own markup language called HCL. This language makes the definitions more succinct and expressive, but requires you to master a new language and toolchain.

However, markup languages are lacking expressiveness to easily represent conditional shapes, multiple similar resources, or higher-level abstractions. They embed home-grown constructs inside YAML or JSON, or make you fall back to template-based generation. A newer class of tools is trying to address this limitation by using general-purpose programming languages to define cloud infrastructures. For example, AWS CDK uses TypeScript, Python, Java, and .NET to produce CloudFormation output.

Pulumi takes this idea even further by providing support for a similar set of languages to provision infrastructure for any cloud---and many tools beyond the cloud. Developers can use their existing skills and tools to define type-safe and testable infrastructure and to create higher level abstractions with classes, components, and functions.

Both Pulumi and AWS CDK have a set of components focusing on serverless applications, so they might be the best tools for providing both high-level expressive serverless components and low-level infrastructure resources, if needed.

In the past, I deployed Azure resources with templates containing five thousand lines of JSON. It wasn't a great developer experience to write all those lines, and the application was mostly a bunch of web servers and SQL databases---nothing too fancy. When I define a similar infrastructure with TypeScript, the code size reduction is at least tenfold. [This post](https://mikhail.io/2019/02/from-yaml-to-typescript-developers-view-on-cloud-automation/) gives an example of a similar transformation for an AWS serverless app.

## Conclusion

Serverless applications consist of many components, combining multiple managed services into one cohesive flow. Regardless of your preference for a specific tool, you should use the infrastructure-as-code approach to make your serverless applications reliable and maintainable in the long run.

Cloud infrastructure tools are evolving quickly, and none of them are perfect just yet. To choose what's best for you, evaluate your needs and constraints, compare several options, and keep an eye on the field: More innovations are coming soon.