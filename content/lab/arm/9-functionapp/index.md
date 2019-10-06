---
title: Function App
subtitle: 10 minutes to complete
navtitle: Create a Function App
nextstep: 10-dependencies
material: azuredeploy.json
nofeed: true
weight: 9
---

Finally, it's time to create the main component of our serverless application: the Function App. Define it with the following template:

``` json
{
    "type": "Microsoft.Web/sites",
    "apiVersion": "2016-08-01",
    "name": "TODO",
    "location": "TODO",
    "kind": "functionapp",
    "properties": {
        "serverFarmId": "TODO",
        "siteConfig": {
            "appSettings": [
            ]
        }
    }
}
```

Fill in the TODO blocks to:

- Set the `name` of the application to the proper parameter that we defined before
- Derive the `location` from the location of the Resource Group
- Refer the `serverFarmId` property to the resource ID of the Consumption Plan

Once done, try deploying the template.

## Application settings

The deployment may succeed, but the application isn't ready yet. It's missing several application settings.

First, configure the app to run on V2 Functions runtime with Node.js workers. Add the following settings to the `appSettings` array above:

``` json
{
    "name": "FUNCTIONS_EXTENSION_VERSION",
    "value": "~2"
},
{
    "name": "FUNCTIONS_WORKER_RUNTIME",
    "value": "node"
},
{
    "name": "WEBSITE_NODE_DEFAULT_VERSION",
    "value": "10.14.1"
},
```

The next batch of settings is required to link the Function App to the Storage Account. Copy-and-paste the following settings:

``` json
{
    "name": "WEBSITE_CONTENTSHARE",
    "value": "[parameters('appName')]"
},
{
    "name": "AzureWebJobsStorage",
    "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(variables('storageAccountId'),'2015-05-01-preview').key1)]"
},
{
    "name": "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING",
    "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(variables('storageAccountId'),'2015-05-01-preview').key1)]"
},
```

The bottom two settings are not straightforward at all. What happens here is that we compose a connection string to the Storage Account using the account name and a SAS Token, which is retrieved with a `listKeys` function call.

## Connection string as a Variable?

These two settings are both required, but they have exactly the same value. The software developer's mindset might suggest creating a new variable to contain the value and referencing that variable from both application settings.

Give it a try.

Unfortunately, the deployment fails after such refactoring. The function `listKeys` is classified as a runtime function, and as such, it is not supported in a variable definition. See [this issue](https://github.com/Azure/azure-quickstart-templates/issues/1503) for some explanation.

For now, we'll have to give up and keep the duplication.

## Deploy the code

The final application setting will deploy the code to the Function App:

``` json
{
    "name": "WEBSITE_RUN_FROM_PACKAGE",
    "value": "https://mikhailworkshop.blob.core.windows.net/zips/app.zip"
}
```

This setting tells the app to load the specified zip file, extract the code from it, discover the functions, and run them. I've prepared this zip file for you to get started faster, you can find its code [here](https://github.com/mikhailshilkov/mikhailio-hugo/tree/master/content/lab/materials/app).

The code contains a single HTTP-triggered Azure Function.

## Function endpoint

At the previous step, we created a dummy output to report the application endpoint.

Unfortunately, there is no "native" way to retrieve the URL of an Azure Function from an ARM template. Instead, set the value of the `endpoint` output to the manually constructed expression `[concat('https://', parameters('appName'), '.azurewebsites.net/', 'api/hello')]`.

Redeploy the template with all settings.

## Checkpoint

Display the value of the output endpoint:

```
$ az group deployment show --name WorkshopDeployment
    -g deleteme-workshop --query properties.outputs.endpoint

"https://myuniquename.azurewebsites.net/api/hello"
```

Send an HTTP request to the endpoint either via a browser or with a `curl` command:

```
$ curl https://myuniquename.azurewebsites.net/api/hello
You've successfully deployed a Function App!
```

Congratulations! You have deployed the complete infrastructure to run a Function App.
