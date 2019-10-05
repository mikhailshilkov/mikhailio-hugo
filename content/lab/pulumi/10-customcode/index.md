---
title: Custom Code
subtitle: 5 minutes to complete
nofeed: true
weight: 10
---

Up until now, you haven't touched the application code: you deployed the provided zip file. Let's see how to start changing it.

## Download the code

Download the file `https://mikhailworkshop.blob.core.windows.net/zips/app.zip`. Create an `app` folder inside your Pulumi's working directory. Extract the contents of the zip file directly to the `app` folder.

The folder contents should look like this now:

```
app                                  <-- extracted zip
app/host.json                        <-- Functions host configuration
app/local.settings.json
app/hello                            <-- 'hello' function
app/hello/function.json              <-- 'hello' bindings
app/hello/index.js                   <-- 'hello' JavaScript code
index.ts
package.json
Pulumi.yaml
...other Pulumi and npm files
```

## Modify the function code

Navigate to `app/hello` folder and edit the code in the `index.js` file. For example, change the `body` assignment to

``` js
    body: "This is my code running in a Function App!",
```

## Point Archive App to the local code

Change the `ArchiveFunctionApp` definition to point it to the local `app` folder with `FileArchive` helper:

``` ts
const archiveApp = new azure.appservice.ArchiveFunctionApp("archive-app", {
    resourceGroup,
    archive: new pulumi.asset.FileArchive("./app"),
});
```

`ArchiveFunctionApp` would zip the folder at deployment time, upload it to Blob Storage, and point the Function App to this archive.

Redeploy the program with `pulumi up` and check the endpoint of the `archiveApp`.

## Checkpoint

Send an HTTP request to the `archiveEndpoint` and make sure it returns the new greeting.

Next: [Azure Functions as Callbacks]({{< ref "/lab/pulumi/11-callbackapp" >}})