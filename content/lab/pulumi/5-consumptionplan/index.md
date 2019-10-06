---
title: Consumption Plan
subtitle: 3 minutes to complete
navtitle: Define a Consumption Plan
nextstep: 6-functionapp
material: index.ts
nofeed: true
weight: 5
---

There are several options to deploy Azure Functions. The serverless pay-per-execution hosting plan is called *Consumption Plan*.

There's no resource named Consumption Plan, however. The resource name is inherited from Azure App Service: Consumption is one kind of an App Service Plan. It's the SKU property of the resource that defines the type of hosting plan.

Copy the following block to your `index.ts` file:

``` ts
const plan = new azure.appservice.Plan("asp", {
    resourceGroupName: resourceGroup.name,
    kind: "FunctionApp",
    sku: {
        tier: "Dynamic",
        size: "Y1",
    },
});
```

Note the specific way that the properties `sku` and `kind` are configured. If you ever want to deploy to another type of service plan, you would need to change these values accordingly.

Run another `up` and make sure it succeeds.

## Checkpoint

Re-run the command to list all resources in the Resource Group:

```
$ az resource list -g pulumi-workshop -o table

Name             ResourceGroup    Location    Type
---------------  ---------------  ----------  ---------------------------------
storage92e87b37  pulumi-workshop  westus      Microsoft.Storage/storageAccounts
aspcc384450      pulumi-workshop  westus      Microsoft.Web/serverFarms
```

You should see both the Storage Account and the Consumption Plan (its type is known as `Microsoft.Web/serverFarms` in Azure Resource Manager).
