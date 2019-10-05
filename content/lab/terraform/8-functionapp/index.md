---
title: Function App
subtitle: 5 minutes to complete
nofeed: true
weight: 8
---

Finally, it's time to create the main component of our serverless application: the Function App. Define it with the following template:

``` hcl
resource "azurerm_function_app" "app" {
  name                      = <TODO: a globally-unique string. Note that it will be a part of your app's URL>
  location                  = <TODO: set to rg's location>
  resource_group_name       = <TODO: set to rg's name>
  app_service_plan_id       = <TODO: set to asp's id>
  storage_connection_string = <TODO: set to sa's primary_connection_string>
  version                   = "~2"
}
```

Fill in the TODO blocks as the hint suggests. Once done, try deploying the definition file and make sure it succeeds.

## Application settings

The deployment may succeed, but the application isn't ready yet. It's missing a number of application settings. Add a block `app_settings` inside the Function App resource:

``` hcl
resource "azurerm_function_app" "app" {
  ...
  app_settings = {
    FUNCTIONS_WORKER_RUNTIME     = "node"
    WEBSITE_NODE_DEFAULT_VERSION = "10.14.1"
    WEBSITE_RUN_FROM_PACKAGE     = "https://mikhailworkshop.blob.core.windows.net/zips/app.zip"
  }
}
```

The top two settings configure the app to run on Node.js v10 runtime.

The bottom one deploys the code to the Function App. This setting tells the app to load the specified zip file, extract the code from it, discover the functions, and run them. I've prepared this zip file for you to get started faster, you can find its code [here](TODO). The code contains a single HTTP-triggered Azure Function.

You don't need to explicitly configure application settings related to Azure Storage connections: this is taken care by the `storage_connection_string` property.

## Checkpoint

Make the URL of the following shape: `https://<your function app name>.azurewebsites.net/api/hello`. Send an HTTP request to the endpoint either via a browser, or with a `curl` command:

```
$ curl https://myuniquename.azurewebsites.net/api/hello
You've successfully deployed a Function App!
```

Congratulations! You have deployed the complete infrastructure to run a Function App.

Next: [Set Inputs and get Outputs]({{< ref "/lab/terraform/9-inouts" >}})