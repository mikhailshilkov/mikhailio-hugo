---
title: "Farmer or Pulumi? Why not both!"
date: 2020-12-16
tags: ["Azure", "Pulumi", "FSharp"]
description: "Azure Infrastucture as Code using F#: combining Pulumi and Farmer"
thumbnail: teaser.png
ghissueid: 49
---

*The post is a part of
[F# Advent Calendar 2020](https://sergeytihon.com/2020/10/22/f-advent-calendar-in-english-2020/).*

You are a proud F# developer. You deploy your applications to Microsoft Azure. You know that you should never right-click-deploy to production. You don't create important Azure resources via the Azure portal. You are awesome.

You want to define your cloud resources with infrastructure as code tools. However, you do NOT enjoy writing large JSON files to deploy with the Azure Resource Manager (ARM) templates.

It turns out there are at least two tools that enable you to use F# to define Azure resources: [Farmer](https://compositionalit.github.io/farmer/) and [Pulumi](https://pulumi.com).

In this article, I'll give a quick comparison of these two options. More excitingly, I'll show you how you could use both tools together in the same F# program!

## What is Farmer?

Farmer is an F# library for rapidly authoring and deploying Azure architectures. It's a hand-crafted library that provides simple but powerful primitives to produce ARM Templates from F# code. Essentially, the result of a Farmer execution is a JSON ARM template that you can feed into Azure deployment tools.

Farmer relies heavily on F# computation expressions and feels like a DSL but with strong type safety and excellent IDE support. It's open-source, free to use, and it's just a NuGet library to install.

## What is Pulumi?

Pulumi is a more ambitious tool for all aspects of modern infrastructure as code. It's designed to create, deploy, and manage infrastructure on any cloud using several programming languages.

Pulumi comes with its own command-line interface (CLI) tool to orchestrate deployments, so it doesn't rely on ARM templates in any way. Pulumi supports Azure among other cloud providers, and the Azure SDK is automatically generated from formal specifications.

## How are they different?

Farmer and Pulumi are different in many ways, but I want to focus on two aspects.

### Azure vs. Any Cloud

Farmer is focused entirely on Azure, while Pulumi supports Azure, Azure Active Directory, AWS, Google Cloud, Kubernetes, Cloudflare, Digital Ocean, and several dozens of other deployment targets. A single Pulumi program can deploy resources to multiple environments, for instance, Azure, Azure AD, Kubernetes, and Cloudflare.

Farmer relies on Azure deployment tools, while Pulumi comes with its own. There are pros and cons to both approaches.

### Hand-crafted vs. Auto-Generated

Farmer's F# code is designed to be concise and look great. It's opinionated and makes the most common scenarios short and straightforward. More obscure deployments may not be expressible directly with Farmer, but the library provides escape hatches to fall back to JSON.

Pulumi relies heavily on code generation. A resource definition is always a constructor call that accepts a bag of input properties and returns output properties. This means that you have access to the full API surface area, but you work on a low abstraction level.

## Can I use both?

Essentially, Farmer is a DSL to build ARM Templates, while Pulumi is a deployment orchestration tool. They operate on a different level and aren't directly interchangeable.

This also means that you may want to use both to combine their strengths and powers. Below, I show exactly this: I deploy a simple Farmer template from a Pulumi program.

**Disclaimer**: This is a proof-of-concept and can't be used for production deployments yet. See the "How It Works" section for details.

Let's write a sample Pulumi-Farmer program to deploy a Web App!

### Resource Definitions

I created a .NET Core console application and referenced NuGet packages `Pulumi.AzureNextGen`, `Pulumi.FSharp`, and `Farmer`. Now, I can define resources with Farmer builders:

```fsharp
// Create a storage account
let myStorageAccount = storageAccount {
    name "farmerpulumisa"
}

// Create a web app with application insights that are connected to the storage account
let myWebApp = webApp {
    name "farmerpulumiweb"
    setting "storageKey" myStorageAccount.Key
}
```

These definitions will result in four Azure resources: a Storage Account, an App Service Plan, an Application Insights component, and a Web App (App Service).

### Deployment

The next step is to define a deployment with a target location and a list of resources to deploy:

```fsharp
// Create an ARM template
let deployment = arm {
    location Location.NorthEurope
    add_resources [
        myStorageAccount
        myWebApp
    ]
}
```

### Run Pulumi Deployment

The last step is to declare the application entry point. The application calls a helper function of mine called `FarmerDeploy.run`, which accepts a resource group name and the deployment object:

```fsharp
// Deploy with Pulumi
[<EntryPoint>]
let main _ = FarmerDeploy.run "my-resource-group" deployment
```

Now, I navigate to the application folder in a command line and run `pulumi up` to deploy the program:

```
$ pulumi up

Updating (dev)

     Type                                               Name                  Status      
 +   pulumi:pulumi:Stack                                azure-nextgen-fs-dev  created     
 +   ├─ azure-nextgen:storage/v20190401:StorageAccount  farmerpulumisa        created     
 +   ├─ azure-nextgen:web/v20180201:AppServicePlan      farmerpulumiwebFarm   created     
 +   ├─ azure-nextgen:insights/v20150501:Component      farmerpulumiwebAi     created     
 +   └─ azure-nextgen:web/v20160801:WebApp              farmerpulumiweb       created     
 
Resources:
    + 5 created

Duration: 53s
```

Tada! The Farmer-Pulumi application is deployed to Azure!

## How It Works

Here is how this deployment worked:

1. Pulumi orchestrates the deployment, so the project is a Pulumi F# project.
2. `FarmerDeploy.run` accepts a Farmer deployment and converts it to a raw JSON string.
3. It sends the JSON to the Pulumi Azure NextGen provider (a plugin installed on my system).
4. The provider uses [arm2pulumi](https://github.com/pulumi/arm2pulumi) to parse the JSON template to the Pulumi resource model.
5. The resource model is sent back to the F# program, which instantiates resources with proper arguments.
6. The resources are registered with the Pulumi engine.
7. The engine orchestrates the deployment and invokes Azure API to create the resources.

**Note**: The Pulumi Azure NextGen provider is currently in preview. In particular, steps 4 and 5 above and not production-ready yet. This means that the prototype may fall short for more sophisticated Farmer deployments (and, therefore, more sophisticated JSON templates).

You can find the full example [here](https://github.com/mikhailshilkov/fsharp-advent-pulumi/tree/master/2020).

## Conclusion

More than anything, this article is a manifestation of the power of applying general-purpose programming languages to engineering cloud applications. Different tools and approaches may be combined in ways they were not initially designed for.

If you are interested in a production-grade Farmer-in-Pulumi integration, consider leaving a comment below with a scenario you have in mind, or just hit the Heart button on the top-left. Thank you!
