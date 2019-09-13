---
title: Consumption Plan
weight: 8
---

There are several modes to deploy Azure Functions. The serverless pay-per-execition hosting option is called Consumption Plan.

There's no resource named Consumption Plan. The resource name is inherited from the old days when App Service used to only serve web sites, so the type is `Microsoft.Web/serverfarms`. It's the SKU property of the resource that defines the type of the hosting plan.

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

Note the specific way that the `sku` property is configured. If you ever want to deploy to another type of the service plan, you would change this property.

The `name` property refers to a not-yet-existing variable `planName`. Go ahead and define this variable with the value `[concat(parameters('appName'), '-asp')]`. The function `concat` concatenates all the arguments that it receives. In this case, we append an `-asp` suffix to the application name.


## Good to go if...

Re-run the command to list all resources in the resource group:

```
$ az resource list -g arm-workshop -o table

Name             ResourceGroup Location    Type
--------------   ------------- ----------- ---------------------------------
42tsnvw2a6dlc    arm-workshop  westeurope  Microsoft.Storage/storageAccounts
myuniquename-asp arm-workshop  westeurope  Microsoft.Web/serverFarms
```

You should see both a Storage Account and an App Service Plan.

Next: [Function App]({{< ref "/workshop/arm/9-functionapp" >}})