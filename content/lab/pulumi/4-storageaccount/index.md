---
title: Storage Account
subtitle: 5 minutes to complete
navtitle: Create a Storage Account
nextstep: 5-consumptionplan
nofeed: true
weight: 4
---

Before we can deploy a serverless application, we need to create a *Storage Account*. Every Azure Functions application requires a Storage Account for its internal needs.

## Add a Storage Account resource

Copy-and-paste the following snippet to your `index.ts` file:

``` ts
const storageAccount = new azure.storage.Account("storage", {
    resourceGroupName: resourceGroup.name,
    accountReplicationType: "LRS",
    accountTier: "Standard",
});
```

It defines a locally-redundant standard Storage Account, and it is a part of the Resource Group that we defined before.

This time, we haven't defined an explicit physical name for the resource. That's because the name of a Storage Account has to be globally unique. Instead of inventing such a name, we can trust Pulumi to generate one.

Also, we haven't defined an explicit location for the Storage Account. By default, Pulumi inherits the location from the Resource Group. You can always override it with `location` property if needed.

Run `pulumi up` to apply the changes.

## Checkpoint

List the resources in your Resource Group with the command below:

```
$ az resource list -g pulumi-workshop -o table

Name             ResourceGroup    Location    Type
---------------  ---------------  ----------  ---------------------------------
storage93f87a31  pulumi-workshop  westus      Microsoft.Storage/storageAccounts
```

Observe the randomized name of your newly created Storage Account.
