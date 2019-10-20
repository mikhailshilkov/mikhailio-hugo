---
title: Resource Group
subtitle: 4 minutes to complete
navtitle: Deploy a Resource Group
nextstep: 4-storageaccount
material: index.ts
nofeed: true
weight: 3
---

*Azure Resource Group* is a container for resources that are deployed together. Every Azure resource must be assigned to a resource group.

In contrast to Azure ARM Templates, Pulumi handles Resource Groups is a regular resource. Therefore, a Resource Group is the first resource that we need to declare.

## Create a Resource Group

Add the following lines to your `index.ts` file:

``` ts
import * as azure from "@pulumi/azure";

const resourceGroup = new azure.core.ResourceGroup("pulumi-workshop", {
    name: "pulumi-workshop",
    location: azure.Locations.WestUS,
});
```

> Note: Here and at the later steps, we build the file incrementally. You should add the snippets to your existing `index.ts` file instead of replacing the previous code.

Declaring a resource is just calling a constructor of the corresponding type. We assigned the new resource to the variable `rg` to be able to use it for other resources.

Note that each resource has two names: a logical one (first constructor argument) and a physical one (`name` property in the second argument). The logical name is visible in Pulumi console, while the physical name is the actual resource name in Azure. You could omit the `name` property: then a physical name would be automatically constructed as `Logical Name + random suffix`.

We used a predefined constant `azure.Locations.WestUS` to assign the Azure region to deploy to. This way is preferred to passing an arbitrary string---no chance to make a typo.

## Apply changes

You changed the program---now it's time to apply the change to the cloud infrastructure. Run `pulumi up` command.

Instead of executing the changes immediately, Pulumi shows you a preview of the changes-to-happen:

```
$ pulumi up

Previewing update (dev):

    Type                         Name                 Plan
    pulumi:pulumi:Stack          pulumi-workshop-dev
+   └─ azure:core:ResourceGroup  pulumi-workshop      create

Resources:
    + 1 to create
```

Select `yes` in the command prompt to execute the change:

```
Updating (dev):
    Type                         Name                 Status
    pulumi:pulumi:Stack          pulumi-workshop-dev
+   └─ azure:core:ResourceGroup  pulumi-workshop      created

Resources:
    + 1 created
    1 unchanged

Duration: 21s
```

## Checkpoint

Make sure that your Resource Group was created successfully:

```
$ az group exists -g pulumi-workshop
true
```
