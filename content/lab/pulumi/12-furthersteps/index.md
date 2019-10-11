---
title: Further Steps
subtitle: Ideas to implement on your own
nextstep: 13-cleanup
nofeed: true
weight: 12
---

Congratulations! You've reached the end of the guided lab. You've learned the basics of developing and deploying Pulumi programs.

Of course, we've only scratched the surface of Pulumi capabilities. If you still have time and passion, the following tasks should give you enough material to continue learning on your own.

### Deploy a resource on your own

Think of any resource type that you tend to use in your serverless applications and try adding it to your template. Try adding Azure Application Insights, Azure Service Bus, Azure Cosmos DB, or any other resource to your liking.

Hint: [Examples Repository](https://github.com/pulumi/examples/) is a great place to find sample code snippets.

### Create a reusable component

Once your `index.ts` file becomes too large, you can start splitting it into multiple files. It works exactly the same as for any other TypeScript program!

For instance, add a new file `eventHub.ts` that would define an Azure Event Hub namespace and an Event Hub and use it from your root module.

Hint: Use `export` and `import` syntax to share values between files.

### Use conditions, loops, collection operations

Add an extra configuration to your stack called `newPlan`. If the value of this variable is anything but `yes`, do not create a new Consumption Plan as a part of the deployment, but use the built-in one.

Create a configuration to represent how many Function Apps you need to make. Use a `for` loop or `Array.map` function to define as many apps as requested.

A general-purpose programming language makes this very simple.

### Try advanced features of callback functions

Callback-based functions work not only for HTTP request. They support the majority of Azure Functions scenarios, including multiple trigger types, input and output bindings.

Browse through examples in [Ten Pearls With Azure Functions in Pulumi](https://www.pulumi.com/blog/ten-pearls-with-azure-functions-in-pulumi/) and implement a function or two on your own.

### Deploy functions in other languages

`ArchiveFunctionApp` also supports deploying Azure Functions written in C#, F#, Python, Java, or PowerShell.

Check [Azure Functions in All Supported Languages](https://github.com/pulumi/examples/tree/master/azure-ts-functions-raw) for an end-to-end example.

## Clean Up

Once you are done experimenting, don't forget to clean up to avoid additional charges.