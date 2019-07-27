---
title: 10 Pearls with Azure Functions in Pulumi
date: 2019-07-25
tags: ["Azure", "Serverless"]
description:
---

In this post, we'll take a look at 10 "pearls"&mdash;bite-sized code snippets&mdash;that demonstrate using Pulumi to build serverless applications with Azure Functions and infrastructure as code. These pearls are organized into four categories, each demonstrating a unique scenario:

- **Deploy Function Apps**: take an existing Azure Functions application in your language of choice and deploy it with infrastructure as code.
- **HTTP Functions as Callbacks**: mix TypeScript functions right into the infrastructure definition to produce concise, strongly-typed, self-contained, serverless HTTP endpoints.
- **Handle Events in the Cloud**: leverage the whole variety of event sources available to Azure Functions with lightweight and intuitive event handlers.
- **Data Flows with Function Bindings**: pull extra data into the functions and push results out with functions bindings&mdash;declarative connectors to Azure services.

Here is a complete index of the pearls below, in case you want to jump to a specific one:

[**Deploy Function Apps**](#deploy-function-apps)

- [Deploy a Function App written in .NET or any other supported runtime](#1-deploy-a-net-function-app)
- [Configure Functions to run on an Elastic Premium Plan](#2-run-functions-using-an-elastic-premium-plan)

[**HTTP Functions as Callbacks**](#http-functions-as-callbacks)

- [Define Node.js Functions as inline callbacks](#3-define-nodejs-functions-as-inline-callbacks)
- [Implement REST APIs as multiple Functions](#4-rest-apis-as-multiple-functions)
- ["Warm" the Functions to avoid Cold Starts](#5-function-"warming"-with-a-timer-function)

[**Handle Events in the Cloud**](#handle-events-in-the-cloud)

- [Process events from Azure Event Hub](#6-process-events-from-azure-event-hubs)
- [Subscribe to Blob creation with Azure Event Grid](#7-subscribe-to-azure-event-grid)
- [Run a Function every time an Azure resource is modified](#8-respond-to-resource-level-events)

[**Data Flows with Function Bindings**](#data-flows-with-function-bindings)
- [Push a message to a Storage Queue with an output binding](#9-output-bindings)
- [Pull a Storage Table row with an input binding](#10-input-bindings)

## Deploy Function Apps

Azure Functions support many languages, and Pulumi doesn't limit your choice. You are free to take any existing serverless application and deploy it in an infrastructure-as-code manner.

### 1. Deploy a .NET Function App

Probably, the majority of Function Apps are .NET applications created with Visual Studio, Visual Studio Code, or Functions CLI. With no changes to the code required, Pulumi can deploy such application in several lines of TypeScript:

``` ts
const dotnetApp = new azure.appservice.ArchiveFunctionApp("http-dotnet", {
    resourceGroupName: resourceGroup.name,
    archive: new pulumi.asset.FileArchive("./app/bin/Debug/netcoreapp2.1/publish"),
    appSettings: {
        "runtime": "dotnet",
    },
});
```

There are only four elements to it: the Function App name ("http-dotnet"), the resource group it belongs to, the path to the compiled .NET assemblies, and the desired runtime. Pulumi takes care of the rest: it creates a Storage Account, a Blob Container, it zips up the binaries and uploads them to the blob container, calculates a SAS token, prepares a Consumption Plan and a Function App on this consumption plan, configures the required application settings, includes a reference to the zip archive with a SAS token:

![Serverless Application deployed by Pulumi](console.png)

Only a few options are required, but your flexibility is not limited: while the defaults are in place, you can change any setting to your liking.

### 2. Run Functions using an Elastic Premium Plan

While the Consumption Plan is the ultimate serverless option, there are other ways to host Azure Functions. A while ago, Microsoft introduced the Premium Plan: a combination of the power and guarantees of a fixed App Service Plan with the elasticity of Consumption.

If you want to take advantage of a Premium Plan, go ahead and define it as a Pulumi resource, then link it from the Function App definition:

``` ts
const premiumPlan = new azure.appservice.Plan("my-premium", {
    resourceGroupName: resourceGroup.name,
    sku: {
        tier: "Premium",
        size: "EP1",
    },
    maximumElasticWorkerCount: 20,
});

const javaApp = new azure.appservice.ArchiveFunctionApp("http-java", {
    resourceGroupName: resourceGroup.name,
    plan: premiumPlan,
    archive: new pulumi.asset.FileArchive("./java/target/azure-functions/fabrikam-functions"),
    appSettings: {
        "runtime": "java",
    },
});
```

This time I deploy a Java application. The Premium Plan has a couple of configuration nobs: the instance size and the maximum scale-out limit.

## HTTP Functions as Callbacks

Node.js is another runtime supported by Azure Functions. You could follow the same route and use `ArchiveFunctionApp` class to deploy the application from an external folder.

However, the node SDK of Pulumi provides a way to mix the code of your functions directly into the infrastructure definition.

### 3. Define Node.js Functions as Inline Callbacks

A TypeScript or a JavaScript function becomes an Azure Function deployed to the cloud:

``` ts
const greeting = new azure.appservice.HttpEventSubscription('greeting', {
    resourceGroupName: resourceGroup.name,
    callback: async (context, req) => {
        return {
            status: 200,
            body: `Hello ${req.query['name'] || 'World'}!`,
        };
    }
});

export const url = greeting.url;
```

While mixing infrastructure and application code in the same file may seem counter-intuitive, it provides a pile of benefits:

- Combined code binaries (data plane) and infrastructure (control plane) as a single unit of deployment;
- No need to worry about boilerplate configuration like `host.json` and `function.json` files;
- Robust typing out-of-the-box: for instance, you can flawlessly "dot into" the `content` and `req` object above.

You can read more about the motivation in [Serverless as Simple Callbacks with Pulumi and Azure Functions](/2019/05/serverless-as-simple-callbacks-with-pulumi-and-azure-functions/).

The example above deploys a Function App with a single Function. However, Azure supports applications with multiple Functions bundled together.

### 4. REST APIs as Multiple Functions

It's pretty common to use Azure Functions to implement RESTful APIs. We can combine several related HTTP Functions into a single deployment unit.

To achieve that, we define an `HttpFunction` object per Azure Function, each with its callback and settings. Then, we pass an array of these objects into a `MultiCallbackFunctionApp` constructor. Each Function definition may have a specific route and HTTP methods to handle:

``` ts
const get = new azure.appservice.HttpFunction("Read", {
    route: "items",
    methods: ["GET"],
    callback: async (context, request) => {
        const items = await repository.list();
        return { status: 200, body: items };
    },
});

const post = new azure.appservice.HttpFunction("Add", {
    route: "items",
    methods: ["POST"],
    callback: async (context, request) => {
        const id = await repository.add(request.body);
        return { status: 201, body: { id }  };
    },
});

const app = new azure.appservice.MultiCallbackFunctionApp("multi-app", {
    resourceGroupName: resourceGroup.name,
    functions: [get, post],
});
```

Of course, the number of Functions is not limited to two. You can also combine Functions of different types, as presented in the following example.

### 5. Function "Warming" with a Timer Function

Scheduled jobs are another frequent use case for serverless functions. It's possible to define a [*cron expression*](https://docs.microsoft.com/azure/azure-functions/functions-bindings-timer#cron-expressions) and get the code executed at designated intervals.

The Consumption Plan disposes a worker if no Function runs in about 20 minutes. The next execution causes a [*cold start*](https://mikhail.io/serverless/coldstarts/define/), and the response latency would be high.

The following example might seem unexpected, but it's a well-known pattern in the world of Azure Functions. We combine a target HTTP Function with a Timer Function executed once in several minutes. The body of the Timer Function is empty: its sole purpose is to trigger the Function App at a regular cadence to keep the worker "warm":

``` ts
const warmer = new azure.appservice.TimerFunction("warmer", {
    schedule: "0 */5 * * * *",
    callback: async () => {},
});

const http = new azure.appservice.HttpFunction("hello", {
    callback: async (context, req) => {
        return {
            status: 200,
            body: "Hello World!",
        };
    }
});

const app = new azure.appservice.MultiCallbackFunctionApp("always-warm-app", {
    resourceGroupName: resourceGroup.name,
    functions: [http, warmer],
});
```

It's easy to imagine a custom component `WarmedFunctionApp` which appends a standard Timer Function to an array of Functions passed to its constructor.

## Handle Events in the Cloud

While HTTP is a widespread use case, Azure Functions support many other trigger types too. [The previous post](/2019/05/serverless-as-simple-callbacks-with-pulumi-and-azure-functions/) featured Storage Queues and ServiceBus Topics. Now, Pulumi supports Timers, Events Hubs, Event Grid, Storage Blobs, Service Bus Queues, and Cosmos DB Change Feed events too!

### 6. Process Events from Azure Event Hubs

Azure Event Hubs is a fully-managed log-based messaging service comparable to Apache Kafka. In contrast to a self-hosted Kafka cluster, it only takes several lines of TypeScript to create an Event Hub and start processing events:

``` ts
const eventHub = new eventhub.EventHub("my-hub", {
    resourceGroupName: resourceGroup.name,
    namespaceName: namespace.name,
    partitionCount: 2,
    messageRetention: 7,
});

eventHub.onEvent("MyHubEvent", async (context, msg) => {
    console.log("Event Hub message: " + JSON.stringify(msg));
});
```

Every time a new event comes in, be it once per hour or a thousand times a second, the Function gets executed. Azure manages the scale-out for you.

### 7. Subscribe to Azure Event Grid

Azure Event Grid is another trigger type for Azure Functions, and a special one: it's a dispatching service to distribute events from many other Azure services and even external data sources.

A classic example is subscribing to events from Azure Blob Storage. The Event Grid subscription hooks to a given Storage Account and provides several handy options to filter the event stream. The example below subscribes to all JPG files created in any container of the account:

``` ts
const storageAccount = new azure.storage.Account("eventgridsa", {
    resourceGroupName: resourceGroup.name,
    accountReplicationType: "LRS",
    accountTier: "Standard",
    accountKind: "StorageV2",
});

eventgrid.events.onGridBlobCreated("OnNewBlob", {
    storageAccount,
    subjectFilter: {
        caseSensitive: false,
        subjectEndsWith: ".jpg",
    },
    callback: async (context, event) => {
        context.log(`Subject: ${event.subject}`);
        context.log(`File size: ${event.data.contentLength}`);
    },
});
```

The `event` object is strongly typed: the snippet above logs the file size, but there are many other properties at your disposal. Code completion makes the discovery process painless.

It's worth mentioning that Pulumi does much work behind the scenes here. In particular, it retrieves the appropriate secret key from Azure Functions ARM API and creates an Event Grid subscription which points to a specific webhook containing that key.

### 8. Respond to Resource-level Events

Here is a good illustration of the power of Event Grid. A callback function gets triggered for each change in any resource belonging to the target Resource Group:

``` ts
const resourceGroup = new azure.core.ResourceGroup("eventgrid-rg");

eventgrid.events.onResourceGroupEvent("OnResourceChange", {
    resourceGroupName: resourceGroup.name,
    callback: async (context, event) => {
        context.log(`Subject: ${event.subject}`);
        context.log(`Event Type: ${event.eventType}`);
        context.log(`Data: ${JSON.stringify(event.data)}`);
    },
});
```

This trick opens up a way to so many automation and governance scenarios.

## Data Flows with Function Bindings

Azure Functions come with a powerful system of bindings. So far, we only saw examples of trigger bindings, the sources of events. Besides, there are output and input bindings too.

### 9. Output Bindings

Output bindings enable developers to easily forward the data from a Function to an arbitrary destination in a declarative manner. For instance, if a queue handler needs to send a message to another queue, we don't have to use cloud SDKs. Instead, we can return the message-to-be-sent from the callback and wire it to the output queue. Here is a quick example:

``` ts
const queue1 = new azure.storage.Queue("queue1", {
   storageAccountName: storageAccount.name,
});

const queue2 = new azure.storage.Queue("queue2", {
    storageAccountName: storageAccount.name,
});

queue1.onEvent("NewMessage",  {
    outputs: [queue2.output("queueOut")],
    callback: async (context, person) => {
        return {
            queueOut: `${person.name} logged into the system`,
        };
    },
});
```

Two elements play together here:

- The `outputs` property defines an output binding with the name `queueOut` and the destination to `queue2`.
- The `queueOut` property of the result object contains the output message.

The binding name has to match the output property.

### 10. Input Bindings

Input bindings pull extra bits of information and pass them over as input parameters to the callback. The exact usage depends on the trigger and binding types and might be tricky to get right with JSON configuration files. Here is one example of wiring done in a Pulumi program:

``` ts
const values = new azure.storage.Table("values", {
    storageAccountName: storageAccount.name,
});

const getFunc = new azure.appservice.HttpEventSubscription('get-value', {
    resourceGroupName: resourceGroup.name,
    route: "{key}",
    inputs: [
        values.input("entry", { partitionKey: "lookup", rowKey: "{key}" }),
    ],
    callback: async (context, request, entry) => {
        return {
            status: 200,
            body: entry.value,
        };
    },
});
```

There are three crucial bits here:

- The `route` property of this HTTP Function contains a template parameter `key`. The runtime extracts the actual `key` value from the HTTP request.
- The `inputs` option contains a reference to a Storage Table with a hard-coded `partitionKey` and a `rowKey` bound to the `key` template parameter. At execution time, a row is retrieved based on the combination of the keys. The entry, if found, is passed to the callback.
- The `callback` has three input parameters, while all previous examples had two. The third parameter contains the retrieved row.

It's possible to have multiple input and output bindings, and any combination of those.

## Wrapping Up

In this post, we've seen some of the exciting things you can do with Azure Functions in Pulumi. Developers use serverless functions as a glue between managed cloud services. Pulumi offers a compelling way to define those links between the pieces of cloud infrastructure in a simple and expressive way.

To get started, head over to the [Quickstart](https://www.pulumi.com/docs/quickstart/azure/), check more examples at [Pulumi Azure GitHub](https://github.com/pulumi/pulumi-azure/tree/master/examples) and join [Pulumi Community Slack](https://slack.pulumi.io/).