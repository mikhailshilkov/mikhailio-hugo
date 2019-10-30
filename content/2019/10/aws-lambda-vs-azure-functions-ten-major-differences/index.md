---
title: "AWS Lambda vs. Azure Functions: 10 Major Differences"
date: 2019-10-20
tags: ["Azure", "AWS", "Azure Functions", "AWS Lambda"]
description: "A comparison AWS Lambda with Azure Functions, focusing on their unique features and limitations."
thumbnail: teaser.png
ghissueid: 24
originalSource: IAmOnDemand Blog
originalUrl: https://www.iamondemand.com/blog/aws-lambda-vs-azure-functions-ten-major-differences/
---

Forget about managing virtual machines or paying for idle hardware! Serverless compute brings unlimited scale and high availability to every company in the world, from small startups to multinational corporations. At least, that’s the vision of Amazon and Microsoft, today’s biggest cloud vendors.

AWS Lambda pioneered the Function as a Service (FaaS) application model in 2014. With Faas, a small piece of code—called a function—is deployed as a ZIP file and linked to a specific type of event, such as a queue or an HTTP endpoint. AWS runs this function every time a matching event occurs, be it once per day or a thousand times per second.

Since 2014, the serverless model has taken off, and every major cloud provider has introduced its flavor of an FaaS service: Azure Functions, Google Cloud Functions, and IBM Cloud Functions, to name a few. While the basic idea behind all the offerings is the same, there are many differences between these implementations.

Today, I’ll compare AWS Lambda with Azure Functions (Lambda’s equivalent in Azure cloud), focusing on their unique features and limitations. Here are the ten major differences between the two options.

## 1. Hosting Plans

To put it simply, there is one way to run a serverless function in AWS: deploy it to the AWS Lambda service. Amazon’s strategy here is to make sure that this service covers as many customer scenarios as possible, ranging from hobby websites to enterprise-grade data processing systems.

Microsoft takes a different approach. They separated the notion of the Azure Functions programming model from the serverless operational model. With Azure Functions, I can deploy my functions to a pay-per-use, fully-managed Consumption plan. However, I can also use [other hosting options](https://docs.microsoft.com/en-us/azure/azure-functions/functions-scale) to run the same code:

- App Service plan: provides a predictable pay-per-hour price, but has limited auto-scaling behavior
- Premium plan (preview): gives reserved capacity *and* elastic scaling, combined with advanced networking options, for a higher price
- A Docker container: can run anywhere on self-managed infrastructure
- Kubernetes-based event-driven architecture (KEDA, experimental): brings functions to Kubernetes, running in any cloud or on-premises

The Consumption plan has the lowest management overhead and no fixed-cost component, which makes it the most serverless hosting option on the list. For that reason, I’m going to focus on AWS Lambda vs. Azure Functions Consumption plan for the rest of this article.

## 2. Configurability

When deploying [an AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/resource-model.html), I need to define the maximum memory allocation, which has to be between 128MB and 3GB. The CPU power and cost of running the function are proportional to the allocated memory. It takes a bit of experimentation to define the optimal size, depending on the workload profile. Regardless of size, all instances run on Amazon Linux.

On the other hand, Azure Functions Consumption plan is one-size-fits-all. It comes with 1.5GB of memory and one low-profile virtual core. You can choose between Windows and Linux as a host operating system.

[Azure Functions Premium plan](https://docs.microsoft.com/en-us/azure/azure-functions/functions-premium-plan#plan-and-sku-settings) comes with multiple instance sizes, up to 14GB of memory, and four vCPUs. However, you have to pay a fixed per-hour fee for the reserved capacity.

## 3. Programming Languages

AWS Lambda natively supports JavaScript, Java, Python, Go, C#, F#, PowerShell, and Ruby code.

Azure Functions has runtimes for JavaScript, Java, Python, C#, F#, and PowerShell (preview). Azure lacks Go and Ruby—otherwise, the language options are very similar.

## 4. Programming Models

Specifics vary between runtimes, but, overall, AWS Lambda has a [straightforward programming model](https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html). A function receives a JSON object as input and may return another JSON as output. The event type defines the schema of those objects, which are documented and defined in language SDKs.

Azure Functions has a more sophisticated model based on [triggers and bindings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings). A trigger is an event that the function listens to. The function may have any number of input and output bindings to pull and/or push extra data at the time of processing. For example, an HTTP-triggered function can also read a document from Azure Cosmos DB and send a queue message, all done declaratively via binding configuration.

The implementation details differ per language runtime. The binding system provides extra flexibility, but it also brings some complexity, in terms of both API and configuration.

## 5. Extensibility

One drawback of all FaaS services on the market is the limited set of supported event types. For example, if you want to trigger your functions from a Kafka topic, you are out of luck on both AWS and Azure.

Other aspects of serverless functions are more customizable. AWS Lambda defines a [concept of layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html): a distribution mechanism for libraries, custom runtimes to support other languages, and other dependencies.

Azure Functions enables open [binding extensions](https://github.com/Azure/azure-webjobs-sdk-extensions/wiki/Binding-Extensions-Overview) so that the community can create new types of bindings and bring them into Function Apps.

## 6. Concurrency and Isolation

Both services can run multiple (potentially thousands) executions of the same function simultaneously, each handling one incoming event.

AWS Lambda always reserves a separate instance for a single execution. Each execution has its exclusive pool of memory and CPU cycles. Therefore, the performance is entirely predictable and stable.

Azure Functions allocates multiple concurrent executions to the same virtual node. If one execution is idle waiting for a response from the network, other executions may use resources which would otherwise be wasted. However, resource-hungry executions may fight for the pool of shared resources, harming the overall performance and processing time.

## 7. Cost

Serverless pricing is based on a pay-per-usage model. Both services have two cost components: pay-per-call and pay-per-GB*seconds. The latter is a metric combining execution time and consumed memory.

Moreover, the price tag for both services is almost exactly the same: $0.20 per million requests and $16 per million GB*seconds ($16.67 for AWS). One million executions running for 100 ms each and consuming 1GB of memory cost less than $2. Since AWS Lambda was the first on the market, I assume Microsoft just copied the numbers.

There are some differences in the details, though:

- AWS Lambda charges for full provisioned memory capacity, while Azure Functions measures the actual average memory consumption of executions.
- If Azure Function’s executions share the instance, the memory cost isn’t charged multiple times, but shared between executions, which may lead to noticeable reductions.
- Both services charge for at least 100 ms and 128MB for each execution. AWS rounds the time up to the nearest 100 ms, while Azure rounds up to 1 ms.
- CPU profiles are different for Lambda and Functions, which may lead to different durations for comparable workloads.

I wrote more on how to measure the cost of Azure Functions [here](https://mikhail.io/2019/08/how-to-measure-the-cost-of-azure-functions/).

## 8. HTTP Integration

AWS Lambda used to require Amazon API Gateway to listen to HTTP traffic, which came at a massive additional cost. Recently, Amazon introduced [integration with Elastic Load Balancing](https://aws.amazon.com/about-aws/whats-new/2018/11/alb-can-now-invoke-lambda-functions-to-serve-https-requests/), which may be more cost efficient for high-load scenarios. However, the pricing is per hour, so good judgment is required.

Azure Functions comes with HTTP endpoint integration out of the box, and there is no additional cost for this integration.

## 9. Performance and Scalability

AWS Lambda has been on the market longer than Azure Functions, and has a laser focus on the single-hosting model. Although there are no established industry-wide benchmarks, many claim that AWS Lambda is better for rapid scale-out and handling massive workloads, both for web APIs and queue-based applications. The bootstrapping delay effect—cold starts—are also less significant with Lambda.

Azure Functions has improved significantly in the last year or two, but Microsoft is still playing catch-up.

I published several comparison articles in the past:

- [Serverless at Scale: Serving StackOverflow-like Traffic](https://mikhail.io/2019/serverless-at-scale-serving-stackoverflow-like-traffic/)
- [From 0 to 1000 Instances: How Serverless Providers Scale Queue Processing](https://mikhail.io/2018/11/from-0-to-1000-instances-how-serverless-providers-scale-queue-processing/)
- [Cold Starts in Serverless Functions](https://mikhail.io/serverless/coldstarts/)

## 10. Orchestrations

Serverless functions are nanoservices: small blocks of code doing just one thing. The question of how to build large applications and systems out of those tiny pieces is still open, but some composition patterns already exist.

Both AWS and Azure have dedicated services for workflow orchestration: AWS Step Functions and Azure Logic Apps. Quite often, functions are used as steps in those workflows, allowing them to stay independent but still solve significant tasks.

In addition, [Azure Durable Functions](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview) is a library that brings workflow orchestration abstractions to code. It comes with several patterns to combine multiple serverless functions into stateful long-running flows. The library handles communication and state management robustly and transparently, while keeping the API surface simple.

## So, What Should You Choose?

AWS Lambda and Azure Functions are similar services, but the devil is in the details—and virtually every angle shows some essential distinctions between the two. My list of ten differences is certainly not exhaustive, and each aspect would need a separate article to cover it in full.

It’s unlikely that your choice will be driven purely by these differences. At the same time, whenever you have to choose one option over the other, or when [you switch between providers](https://www.iamondemand.com/blog/azure-user-heres-what-you-must-know-about-aws/), it’s crucial to adjust your thinking and practices to match the peculiarities.

In short, choose the option that fits you best!