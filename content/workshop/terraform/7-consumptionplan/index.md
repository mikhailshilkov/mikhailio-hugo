---
title: Consumption Plan
subtitle: 3 minutes to complete
weight: 7
---

There are several options to deploy Azure Functions. The serverless pay-per-execition hosting plan is called *Consumption Plan*.

There's no resource named Consumption Plan, though. The resource name is inherited from Azure App Service: Consumption is one kind of an App Service Plan. It's the SKU property of the resource that defines the type of the hosting plan.

Copy the following block to your `main.tf` file:

``` hcl
resource "azurerm_app_service_plan" "asp" {
  name                = "asp"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind                = "FunctionApp"

  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}
```

Note the specific way that the properties `sku` and `kind` are configured. If you ever want to deploy to another type of the service plan, you would need to change these values accordingly.

Run another `apply` and makse sure it succeeds.

## Checkpoint

Re-run the command to list all resources in the Resource Group:

```
$ az resource list -g terraform-workshop -o table

Name          ResourceGroup       Location    Type
------------  ------------------  ----------  ---------------------------------
saxpm31vuc8r  terraform-workshop  westus      Microsoft.Storage/storageAccounts
asp           terraform-workshop  westus      Microsoft.Web/serverFarms
```

You should see both the Storage Account and the Consumption Plan (its type is known as `Microsoft.Web/serverFarms` in Azure Resource Manager).

Next: [Create a Function App]({{< ref "/workshop/terraform/8-functionapp" >}})