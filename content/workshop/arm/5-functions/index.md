---
title: Template Functions
subtitle: 6 minutes to complete
nofeed: true
weight: 5
---

We've deployed our first resource - a Storage Account, but its definition has some drawbacks:

- The `location` is set to West US
- The `name` is hard-coded too, which means we wouldn't be able to deploy this to multiple resource groups (e.g. in test, staging, and production environments)

Let's solve these problems.

## Functions

Values in ARM templates may be defined in terms of fixed literals, as we did before. But they also support *expressions*. An expression is wrapped with square brackets `[]`. Expressions may contains *function* invocations. Here is a call to an imaginary function `someFunction`:

``` json
...
"value": "[someFunction('parameter1', 'parameter2').property1]",
```

You can see that we can pass arguments and evaluate the properties of the result.

## Inherit Location from the resource group

One commonly-used function is `resourceGroup()`. It returns the properties of the current Resource Group that the template is deployed to.

Most probably, we want to deploy the Storage Account into the same Azure region where the Resource Group resides. This can be achieved with the `resourceGroup()` function and the `location` property of its result:

``` json
{
    "type": "Microsoft.Storage/storageAccounts",
    "name": "name-you-used-on-the-previous-step",
    "apiVersion": "2018-02-01",
    "location": "[resourceGroup().location]",
    "kind": "StorageV2",
    "sku": {
        "name": "Standard_LRS"
    }
}
```

Try deploying the modified template.

Unfortunately, you are going to get another error:

```
Azure Error: InvalidResourceLocation
Message: The resource 'mysauniquename' already exists in location 'westus' in resource
group 'arm-workshop'. A resource with the same name cannot be created in location
'westeurope'. Please select a new resource name.
```

The good news is that the location has clearly changed. Let's do something with the account name.

## Generating a unique name

We could keep changing the name of the Storage Account but that seems sub-optimal. This account is actually not our primary target: we just need it to start working with Azure Functions. It would be perfectly fine to give it some unique machine-generated name just to be able to proceed. The `uniquestring` function can do this for us.

Change the account definition to the following:

``` json
{
    "type": "Microsoft.Storage/storageAccounts",
    "name": "[uniquestring(resourceGroup().id)]",
    "apiVersion": "2018-02-01",
    "location": "[resourceGroup().location]",
    "kind": "StorageV2",
    "sku": {
        "name": "Standard_LRS"
    }
}
```

The `uniquestring` function performs a 64-bit hash of the provided strings to create a unique string. We provide the ID of the current Resource Group as the input argument, so the name is going to differ per Resource Group. Very useful for multiple deployments!

Run the deployment again and it should succeed this time.

## Checkpoint

List the resources in your Resource Group.

```
$ az resource list -g arm-workshop -o table

Name            ResourceGroup Location     Type
--------------  ------------- -----------  ---------------------------------
mysauniquename  arm-workshop  westus       Microsoft.Storage/storageAccounts
42tsnvw2a6dlc   arm-workshop  westeurope   Microsoft.Storage/storageAccounts
```

You should see both a new account in the Resource Group's region, as well as the old one in West US. We'll remove the old account at the next step.

Next: [Deployment Modes]({{< ref "/workshop/arm/6-deploymentmode" >}})