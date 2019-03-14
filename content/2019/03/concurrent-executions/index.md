---
title: Draft Concurrent Executions
date: 2019-03-12
thumbnail: todo_thumb.jpg
images: [todo.jpg]
tags: ["Serverless"]
description: TODO.
ghissueid: x
---

Serverless vendors have different approaches to sharing or isolating resources between multiple executions of the same cloud function. In this article, I'm exploring the execution concurrency  models of three FaaS services and the related trade-offs.

## AWS Lambda

AWS Lambda executions are always completely isolated from each other.

A function execution is mostly synonymic to a function instance. Each execution runs on a separate host (a VM or a container). All the resource of this host (CPU, RAM) are dedicated to this execution.

```
A: XXXXXXXXXXXXXXXXXX
B:     XXXXXXXXXXXXXXXXXX
C:         XXXXXXXXXXXXXXXXXX
```

<figcapture>Image: 3 overlapping executions running on 3 hosts. Each line is a separate host.</figcapture>

This model has a benefit of predictability: the resource manager gives the same quantity of resources to each execution. Thus, the variability between executions will be low. 128 MB instances are known to have high variance, but that's an implementation detail.

Resource allocation has to be pre-configured in advance using memory size.

In terms of pricing, the executions are also independent. If each execution has 1 GB of RAM allocated and runs for 1 second, the total bill for the example above will be 3 GB*s.

This model works better for some workloads better than others.

## I/O Bound Workloads

Typical enterprise workload is not very critical neither to CPU (not much computation other than serialization and conversions), nor to RAM (mostly runtime and libraries since functions are stateless). Many functions actually call other resources synchronously: databases, web APIs. The execution duration will be determined by the response time of those resources.

AWS charges for the full execution time, even if 90% of it was waiting for an external response. In this case, the resources dedicated to the execution are basically wasted. 

Ben Kehoe argued for [The need for asynchronous FaaS call chains in serverless systems](https://read.acloud.guru/the-need-for-asynchronous-rpc-architecture-in-serverless-systems-ff168f1c8785) almost 2 years ago but the situation is still the same.

## Resource Pooling

In the ideal world of green-field projects, serverless functions would only connect to NoSQL databases via stateless protocols and the invocations would complete fast. 

However, in the real world, it's often required to access traditional SQL databases like Postgres or SQL Server. Unfortunately, database connection protocols were not designed for hundreds of stateless short-lived single-execution instances. Connections are expensive to establish. There is a limit of how many of them the database can handle.

A good example of these issues are great posts by Jeremy Daly: [How To: Reuse Database Connections in AWS Lambda](https://www.jeremydaly.com/reuse-database-connections-aws-lambda/), [How To: Manage RDS Connections from AWS Lambda Serverless Functions](https://www.jeremydaly.com/manage-rds-connections-aws-lambda/), [Serverless MySQL](https://github.com/jeremydaly/serverless-mysql).

The same problem but on a lower scale are applicable to HTTP based communication: reuse of DNS lookups, TCP connections, etc.

Obviously, it would help if multiple executions of a function could share the pool of database and TCP connections. 

## Azure Functions

Azure Functions are trying to address this issue by separating the notion of executions and instances. An instance is a host with dedicated resources (both CPU and RAM are fixed and currently not configurable). Each instance can run multiple executions at the same time.

The example with 3 overlapping executions can now look like this:

Image: 3 overlapping executions running on 1 host.

```
   XXXXXXXXXXXXXXXXXX
A:     XXXXXXXXXXXXXXXXXX
            XXXXXXXXXXXXXXXXXX
```

In this case, the executions can share the common pool of resources. 

The efficiency is also reflected in the reduced bill. If 1 GB of memory is consumed regardless of how many (1, 2, or 3) executions are active, then the total bill for these 3 executions will be 1.5 GB*s, where 1.5s is the time between the start of the first execution and the end of the last execution. TODO: draw the timing on the image.

In the example above sharing of resources is beneficial to both the cloud provider and the end customer. It might be problematic in the case of CPU-bound workloads, see [Bcrypt/Azure example in How Serverless Providers Scale Queue Processing](https://blog.binaris.com/from-0-to-1000-instances/#azure-2).

Concurrent executions enable reuse of SQL connection pools and HTTP clients.

## Configuring Concurrency in Azure Functions

We have a clear trade-off between resource allocation efficiency and performance guarantees. How do Azure Functions decide how many executions to put into a single instance? 

There is no one clear answer. It's a combination of the decision by Scale Controller and configuration nobs. It also depends on the trigger type.

For instance, for Azure Functions triggered by queue messages, there are settings `batchSize` and `newBatchThreshold`. The maximum number of concurrent executions is then defined by the limit `batchSize + newBatchThreshold`.

Cosmos DB and Event Hubs triggers invoke one Function execution per batch of items. Each batch is related to one partition in the event source. The concurrency is then determined at runtime by Scale Controller based on factors like the number of partitions and the metrics from existing instances.

HTTP Functions are a combination of these two approaches. There is a setting `maxConcurrentRequests` which can be used to limit the concurrency. Its default setting is `200` which is quite generous. In practice, it's not likely to reach that level of concurrent executions unless they are idle for minutes. Scale Controller will run new instances of the Function, which would improve the response time but will incur a higher bill.

## Binaris

Binaris can run in both modes: exclusive invocations similar to AWS Lambda or concurrent invocations similar to Azure Functions. The user decided which one to use by applying a simple setting in `binaris.yaml` file:

``` yaml
functions:
  NewCreate:
    file: function.js
    entrypoint: handler
    executionModel: concurrent
    runtime: node8
```

The value `exclusive` will limit the concurrency of each "function unit" (container) to one.

The value `concurrent` will enable the shared execution model which allows for re-entrant invocations on the same function unit. The current model allows for up to 10 concurrent invocations within a single unit. All re-entrant invocations share the same memory, disk space, and available vCPU.

TODO: Does Binaris always fill existing units up to full capacity of 10 before adding another unit?

Binaris charges a flat rate for each millisecond of running time. The rate does not depends on whether there is just a single execution running or there are multiple executions running on the same instance.

TODO: What is the memory limit now? I suspect you charge for the full RAM limit, not the effective use of it? Given the picture with 3 invocations above, will the billing work similar to Azure?

TODO: What benefits (other than simplicity of config) over Azure can I mention here?

## Conclusion

Sharing computational resources between multiple concurrent executions of serverless functions can be beneficial for I/O-bound workloads. While some executions are idle waiting for a response from the network, other executions may continue using the allocated resources. This also applies to assets like database connections and libraries loaded into the shared memory.

Shared executions enable more efficient use of hardware resources which leads to lower bill for the function owner.

However, the concurrency might lead to resource contention for CPU-intensive workloads, which might negatively affect the performance of serverless functions. Thus, until cloud providers learn a perfect way to optimize concurrency at runtime, it's important to give the function owner a simple way to configure the concurrency mode. Given a transparent and simple nob, they can make a judgment call between concurrency and isolation.