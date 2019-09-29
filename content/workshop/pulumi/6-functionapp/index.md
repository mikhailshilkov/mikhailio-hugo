---
title: Function App
subtitle: 5 minutes to complete
nofeed: true
weight: 6
---

Finally, it's time to create the main component of our serverless application: the Function App. Define it with the following snippet:

``` ts
const app = new azure.appservice.FunctionApp("fa", {
    resourceGroupName: /*TODO: reference the rg name*/,
    appServicePlanId: /*TODO: reference the plan id*/,
    storageConnectionString: /*TODO: reference the storage account primaryConnectionString*/,
    version: "~2",
});
```

Fill in the TODO blocks as the hint suggests. Once done, try deploying the updated program and make sure it succeeds.

## Application settings

The deployment may succeed, but the application isn't ready yet. It's missing a number of application settings. Add a property `appSettings` inside the Function App resource:

``` ts
const app = new azure.appservice.FunctionApp("fa", {
    ...
    appSettings: {
        FUNCTIONS_WORKER_RUNTIME: "node",
        WEBSITE_NODE_DEFAULT_VERSION: "10.14.1",
        WEBSITE_RUN_FROM_PACKAGE: "https://mikhailworkshop.blob.core.windows.net/zips/app.zip",
    },
});
```

The top two settings configure the app to run on Node.js v10 runtime.

The bottom one deploys the code to the Function App. This setting tells the app to load the specified zip file, extract the code from it, discover the functions, and run them. I've prepared this zip file for you to get started faster, you can find its code [here](TODO). The code contains a single HTTP-triggered Azure Function.

You don't need to explicitly configure application settings related to Azure Storage connections: this is taken care by the `storageConnectionString` property.

## Checkpoint

Deploy the changes with `pulumi up`. Run `az resource list -g pulumi-workshop -o table` and note the actual name of you Function App, something like `fa123456ab`.

Make the URL of the following shape: `https://<your function app name>.azurewebsites.net/api/hello`. Send an HTTP request to the endpoint either via a browser, or with a `curl` command:

```
$ curl https://fa123456ab.azurewebsites.net/api/hello
You've successfully deployed a Function App!
```

Congratulations! You have deployed the complete infrastructure to run a Function App.

Next: [Get the Function App endpoint with Outputs]({{< ref "/workshop/pulumi/7-outputs" >}})