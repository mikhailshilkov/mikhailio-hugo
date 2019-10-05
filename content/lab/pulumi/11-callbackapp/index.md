---
title: Callback App
subtitle: 6 minutes to complete
nofeed: true
weight: 11
---

The component `ArhiveFunctionApp` can deploy functions created in any language which is supported by Azure Functions. For instance, you could develop a function in C# and check the `runtime` application setting to `dotnet`.

However, if you choose to stick to Node.js as the runtime, there's another simple way to create a function.

## Inline functions

It is possible to define the implementation of an Azure Functions inside the Pulumi program. Add the following code to your `index.ts` file in the root folder of the project:

``` ts
const callbackApp = new azure.appservice.HttpEventSubscription("callbackfn", {
    resourceGroup,
    callback: async (context, request) => {
        return {
            status: 200,
            body: "Greetings from Azure Functions in a callback!",
            headers: {
                "content-type": "text/html",
            },
        };
    },
});

export let callbackEndpoint = callbackApp.url;
```

At deployment time, Pulumi serializes the callback into a standalone JavaScript file, generates bindings and settings, packages them all up as a zip, and deploys the rest of infrastructure.

Run `pulumi up` to deploy this third Function App. The list of created resources will match the list produced by `ArhiveFunctionApp`.

The deployment will also print a new output:

```
Outputs:
  + callbackEndpoint: "https://callbackfn8c0bd67c.azurewebsites.net/api/callbackfn"
```

## Checkpoint

Send an HTTP request to the new application endpoint and make sure it returns a greeting from the callback.

Next: [Further Steps]({{< ref "/lab/pulumi/12-furthersteps" >}})