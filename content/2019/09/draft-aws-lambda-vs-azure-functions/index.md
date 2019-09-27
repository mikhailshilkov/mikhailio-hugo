---
title: "AWS Lambda vs. Azure Functions: Spot Ten Differences"
date: 2019-09-26
tags: ["Azure", "Pulumi", "Azure Cosmos DB"]
description:
ghissueid:
originalSource: IAmOnDemand Blog
originalUrl:
---

**Serverless** applications delegate the management burden to cloud providers and enable developers to focus on business logic. Cloud resources are allocated dynamically and transparently, and the cost is based on the actual consumption rather than on pre-purchased capacity.

AWS Lambda pioneered **Function-as-a-Service** (FaaS) application model in 2014. A small piece of code---a function---is deployed as a zip file and is linked to a specific type of event, like a queue or an HTTP endpoint. Amazon runs this function every time a matching event occurs, be it once per day or a thousand times per second.

The serverless model took off, and every major cloud provider introduced their flavor of a FaaS service. While the basic idea is the same, there are enough differences between these implementations.

Today, I compare **AWS Lambda** with **Azure Functions**, its counterpart in Azure cloud, to identify their unique features and limitations likewise.

## Hosting Plans

There is a single way to run a serverless function in AWS: deploy it to the AWS Lambda service. Amazon's strategy is to make sure that this service covers as many customer scenarios as possible.

Microsoft takes a different approach. They separated the notion of Azure Functions programming model from the serverless operational model. I can deploy my functions to a pay-per-use, fully-managed **Consumption Plan**. However, I can also use other hosting options to run the same code:

- *App Service Plan* provides a predictable pay-per-hour price but has limited auto-scaling behavior
- *Premium Plan (preview)* gives reserved capacity *and* elastic scaling, combined with advanced networking options, for a higher price
- *Docker container* can run anywhere on self-managed infrastructure
- *Kubernetes Event-Driven Architecture* (KEDA, experimental) brings functions to Kubernetes, running in any cloud or on-premises

Arguably, the Consumption Plan is the only genuinely serverless hosting option from the list. I focus on AWS Lambda vs. Azure Functions Consumption Plan for the rest of this article.

Further reading: [Azure Functions hosting](https://docs.microsoft.com/en-us/azure/azure-functions/functions-scale).

## Configurability

When deploying an AWS Lambda, I need to define the maximum *memory allocation*, that has to be in the range between 128 MB and 3 GB. The CPU power and the cost of running the function are proportional to the allocated memory. It takes a bit of experimentation to define the optimal size depending on the workload profile. Regardless of the size, all instances run on Amazon Linux.

Azure Function Consumption Plan is one-size-fits-all. It comes with 1.5 GB of memory and one low-profile virtual core. You may choose between Windows and Linux as a host operating system.

Azure Premium Plan comes with multiple instance sizes, up to 14 GB of memory and 4 vCPUs. However, you have to pay a fixed per-hour fee for the reserved capacity.

Further reading: [AWS Lambda Configuration](https://docs.aws.amazon.com/lambda/latest/dg/resource-model.html), [Azure Functions Premium SKUs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-premium-plan#plan-and-sku-settings).

## Programming Languages

AWS Lambda natively supports JavaScript, Java, Python, Go, C#, F#, PowerShell, and Ruby code.

Azure Functions have runtimes for JavaScript, Java, Python, C#, F#, and PowerShell (preview). Azure lacks Go and Ruby---otherwise, the language options are very similar.

## Programming Models

Specifics vary between runtimes, but overall AWS Lambda has a straightforward programming model. A function receives a JSON object as input and may return another JSON as output. The event type defines the schema of those objects, which are documented and defined in language SDKs.

Azure Functions has a more sophisticated model based on *triggers* and *bindings*. A trigger is an event which the function listens to. Besides, the function may have any number of input and output bindings to pull and/or push extra data at the time of processing. For example, an HTTP-triggered function can also read a document from Azure Cosmos DB and send a queue message, all done declaratively via binding configuration.

The implementation details differ per language runtime. The binding system provides extra flexibility, but it also brings some complexity both in terms of API and configuration.

Further reading: [AWS Lambda with Other Services](https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html), [Azure Functions triggers and bindings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings).

## Extensibility

One drawback of all FaaS services on the market is the limited set of supported event types. Say, if you want to trigger your functions from a Kafka topic, you are out of luck on both AWS and Azure.

Other aspects of serverless functions are more customizable. AWS Lambda defines a concept of *layers*: a distribution mechanism for libraries, custom runtimes to support other languages, and other dependencies. Azure Functions enables open *binding extensions* so that the community can create new types of bindings and bring them into Function Apps.

Further reading: [AWS Lambda layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html), [Binding Extensions Overview](https://github.com/Azure/azure-webjobs-sdk-extensions/wiki/Binding-Extensions-Overview).

## Concurrency and Isolation

Both services can run multiple, potentially thousands, *executions* of the same function simultaneously, each handling one incoming event.

AWS Lambda always reserves a separate *instance* for a single execution. Each execution has its exclusive pool of memory and CPU cycles. Therefore, the performance is entirely predictable and stable.

Azure Functions allocates multiple concurrent executions to the same virtual node. If one execution is idle waiting for a response from the network, other executions may use resources which otherwise would be wasted. However, resource-hungry executions may fight for the pool of shared resources, harming the overall performance and processing time.

Further reading: [Concurrency and Isolation in Serverless Functions](https://mikhail.io/2019/03/concurrency-and-isolation-in-serverless-functions/).

## Cost

Serverless pricing is based on a pay-per-usage model. Both services have two cost components: pay-per-call and pay-per-GB*s, the latter is a metric combining execution time and consumed memory.

Moreover, the price tag is almost precisely the same: $0.20 per million requests and $16 per million GB*s ($16.67 for AWS). One million executions running for 100 ms each and consuming 1GB of memory cost less than $2. Since AWS Lambda was the first on the market, I assume Microsoft just copied the numbers.

There are some differences in the details, though:

- AWS Lambda charges for full provisioned memory capacity, while Azure Functions measures the actual average memory consumption of executions
- If Azure Function's executions share the instance, the memory cost isn't charged multiple times but shared between executions, which may lead to noticeable reductions
- Both services charge for at least 100 ms and 128 MB for each execution; AWS also rounds the time up to the nearest 100 ms, while Azure rounds up to 1 ms
- CPU profiles are different between Lambda and Functions, which may lead to different durations for comparable workloads

Further reading: [How to Measure the Cost of Azure Functions](https://mikhail.io/2019/08/how-to-measure-the-cost-of-azure-functions/).

## HTTP Integration

Azure Functions come with HTTP endpoint integration out of the box, and this integration has no extra cost to it.

AWS Lambda used to require AWS API Gateway to listen to HTTP traffic, which also brought a massive additional cost. Recently, Amazon introduced integration with Elastic Load Balancer (ELB), which may be more cost-efficient for high-load scenarios. However, the pricing is per-hour, so good judgment is required.

Further reading: [Application Load Balancer can now Invoke Lambda Functions to Serve HTTP(S) Requests](https://aws.amazon.com/about-aws/whats-new/2018/11/alb-can-now-invoke-lambda-functions-to-serve-https-requests/).

## Performance and Scalability

AWS Lambda has been longer on the market and has a laser focus on the single hosting model. Although there are no established industry-wide benchmarks, AWS Lambda is reported to have better characteristics in terms of rapid scale-out and handling massive workloads. The bootstrapping delay effect---cold starts---are also less significant.

Azure Functions has improved significantly in the last year or two, but Microsoft is still playing catch-up.

Further reading:

- [Serverless at Scale: Serving StackOverflow-like Traffic](https://mikhail.io/2019/serverless-at-scale-serving-stackoverflow-like-traffic/)
- [From 0 to 1000 Instances: How Serverless Providers Scale Queue Processing](https://mikhail.io/2018/11/from-0-to-1000-instances-how-serverless-providers-scale-queue-processing/)
- [Cold Starts in Serverless Functions](https://mikhail.io/serverless/coldstarts/)

## Orchestrations

Serverless functions are "nano services": small blocks of code doing just one thing. The question of how to build large applications and systems out of those tiny pieces is still open. Nonetheless, some composition patterns already exist.

Both AWS and Azure have dedicated services for workflow orchestration: AWS Step Functions and Azure Logic Apps. Quite often, functions are used as steps in those workflows, allowing them to stay independent but solve a more significant task.

In addition, Azure Durable Functions is a library that brings workflow orchestration abstractions to code. It introduces several idioms and tools to define stateful,
potentially long-running operations, and manages mechanics of reliable communication and state management behind the scenes.

Further reading: [Making Sense of Azure Durable Functions](https://mikhail.io/2018/12/making-sense-of-azure-durable-functions/).

## Which One to Choose?

AWS Lambda and Azure Functions are similar services, but the devil is in the details, and virtually every angle shows some essential distinctions between the two. My list of ten differences is certainly not exhaustive, and each aspect would need a separate article to cover it in full.

It's unlikely that your choice of the cloud provider will be driven purely by those differences. At the same time, whenever you have the choice, or whenever you switch between the providers, it's crucial to adjust your thinking and practices to match the peculiarities.

Choose the one that fits you best!