---
title: Storage Account
subtitle: 6 minutes to complete
weight: 4
---

It's time to deploy our first resource!

## Add a Storage Account resource

Before we can deploy a serverless application, we need to create a *Storage Account*. Every Azure Functions application requires a Storage Account for its internal needs.

Copy-and-paste the following snippet into the `resources` array of your `azureDeploy.json` file:

``` json
{
    "type": "Microsoft.Storage/storageAccounts",
    "name": "mysa",
    "apiVersion": "2018-02-01",
    "location": "westus",
    "kind": "StorageV2",
    "sku": {
        "name": "Standard_LRS"
    }
}
```

Each resource, including our Storage Account, has the following properties:

- **`type`** defines the namespace and the type of the resource
- **`name`** is the name of the resource to be created
- **`apiVersion`** is a specific version of the resource definition format; the selection differs per resource type, but it always has date in it
- **`location`** is the Azure region to deploy the resource to (don't change `westus` for now, it's part of the plan)

The other parameters from the snippet are specific to Storage Accounts: `kind` and `sku` define what type of the account we want to create. This time we went for a locally-redundant V2 general-purpose account.

## Deploy the resource

Run the deployment command again:

```
$ az group deployment create --template-file azureDeploy.json -g arm-workshop -o table
```

However, this time the deployment fails:

```
Deployment failed. Correlation ID: d8383713-1f3d-4b89-b882-cbcb9942cfda. {
  "error": {
    "code": "StorageAccountAlreadyTaken",
    "message": "The storage account named mysa is already taken."
  }
}
```

Change the name of the Storage Account to something unique, e.g. add some random characters, and try deploying again. Eventually, you should see the success message.

## Checkpoint

List the resources in your Resource Group with the command below:

```
$ az resource list -g arm-workshop -o table

Name            ResourceGroup Location    Type
--------------  ------------- ----------  ---------------------------------
mysauniquename  arm-workshop  westus      Microsoft.Storage/storageAccounts
```

The list should contain the newly created Storage Account.

Next: [Use Functions Inside the Template]({{< ref "/workshop/arm/5-functions" >}})