---
title: Variables, Parameters, and Outputs
subtitle: 7 minutes to complete
nextstep: 8-consumptionplan
nofeed: true
weight: 7
---

We created the Storage Account because every Function App needs an account for its internal usage. The Function App will reference the Storage Account parameters in application settings.

How do we establish such a reference?

## Variables

A reference can be created based on the Storage Account name. One slight problem is that we defined a dynamic auto-generated name, so we can't hard-code a reference to it.

To make this possible, let's extract the Storage Account name into a *variable*. Add the following top-level block to your template:

``` json
"variables": {
    "storageAccountName": "[uniquestring(resourceGroup().id)]"
},
```

The block defines a variable named `storageAccountName` with the value copied from the storage account definition. Now, we can reference this variable from the storage account name with the `variables` built-in function:

``` json
    "name": "[variables('storageAccountName')]",
```

We will also need a second piece of the storage account information: its resource ID. We can use another built-in function `resourceId` to extract this property into another variable:

``` json
"variables": {
    "storageAccountName": "[uniquestring(resourceGroup().id)]",
    "storageAccountId": "[resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName'))]"
},
```

Note how one variable can reference another variable in its definition.

Variables are internal elements of the template: they are not observable from the outside.

There are similar concepts---*parameters* and *outputs*---to accept inputs and return outputs of the deployment.

## Parameters

Let's add a parameter to accept the name of the Function App. Add the following block at the top level of the template, next to `variables`:

``` json
"parameters": {
    "appName": {
        "type": "string",
        "metadata": {
            "description": "The name of the function app that you wish to create."
        }
    }
},
```

Now, if you rerun the deployment, you will see a prompt:

```
Please provide string value for 'appName' (? for help):
```

You can type in the name, and the deployment proceeds. To avoid typing the name manually every time, add the parameter value to the deployment command:

```
$ az group deployment create --name WorkshopDeployment
  --resource-group arm-workshop
  --template-file azureDeploy.json
  --parameters "appName=myuniquename"
  --mode complete
```

(use a backtick `` ` `` to type multi-line commands in PowerShell, a caret `^` in Windows cmd, or a backslash `\` on *nix)

## Outputs

It's also possible to return values from an ARM template. Let's define a mock *output* to return the endpoint of our future Azure Function. Use a top-level `outputs` block:

``` json
"outputs": {
    "endpoint": {
        "type": "string",
        "value": "Coming soon!"
    }
},
```

Running a deployment doesn't print the outputs automatically. You may use a separate `show` command to retrieve an output value:

```
az group deployment show
  --name WorkshopDeployment
  --resource-group arm-workshop
  --query properties.outputs.endpoint.value
```

## Checkpoint

The command above should print

```
"Coming soon!"
```
