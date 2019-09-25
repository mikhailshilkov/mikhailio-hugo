---
title: Consumption Plan
subtitle: 5 minutes to complete
nofeed: true
weight: 8
---

There are several options to deploy Azure Functions. The serverless pay-per-execition hosting plan is called *Consumption Plan*.

There's no resource named Consumption Plan, though. The resource name is inherited from the old days when Azure App Service used to only serve web sites, so the type is called `Microsoft.Web/serverfarms`. It's the SKU property of the resource that defines the type of the hosting plan.

Copy the following block into `resources` collection of your ARM template:

``` json
{
    "type": "Microsoft.Web/serverfarms",
    "apiVersion": "2016-09-01",
    "name": "[variables('planName')]",
    "location": "[resourceGroup().location]",
    "sku": {
        "name": "Y1",
        "tier": "Dynamic"
    }
}
```

Note the specific way that the `sku` property is configured. If you ever want to deploy to another type of the service plan, you would need to change the values accordingly.

The `name` property value refers to a not-yet-existing variable `planName`. Go ahead and define this variable with the expression `[concat(parameters('appName'), '-asp')]`.

The function `concat` concatenates all the received arguments. In this case, we append an `-asp` suffix to the application name.

Run another template deployment and makse sure it succeeds.

## Checkpoint

Re-run the command to list all resources in the Resource Group:

```
$ az resource list -g arm-workshop -o table

Name             ResourceGroup Location    Type
--------------   ------------- ----------- ---------------------------------
42tsnvw2a6dlc    arm-workshop  westeurope  Microsoft.Storage/storageAccounts
myuniquename-asp arm-workshop  westeurope  Microsoft.Web/serverFarms
```

You should see both the Storage Account and the Consumption Plan.

Next: [Create a Function App]({{< ref "/workshop/arm/9-functionapp" >}})