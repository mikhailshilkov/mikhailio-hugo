---
title: Archive App
subtitle: 6 minutes to complete
nofeed: true
weight: 9
---

The Function App is ready, we also created a Storage Account and a Plan to support it. It wasn't that hard, but there are ways to make the code even more straightforward.

## Components

Pulumi programs can enjoy all the benefits of a general-purpose programming language, TypeScript in our case. One of such benefits is the ability to create reusable components.

Anybody can define a custom `ComponentResource` which is a class creating child resources in some coherent way. Pulumi's `pulumi-azure` library comes with several pre-built component resources to simplify the deployment of Function Apps.

Extend your program with the following lines:

``` ts
const archiveApp = new azure.appservice.ArchiveFunctionApp("archive-app", {
    resourceGroup,
    archive: new pulumi.asset.RemoteArchive("https://mikhailworkshop.blob.core.windows.net/zips/app.zip"),
});

export const archiveEndpoint = pulumi.interpolate`${archiveApp.endpoint}hello`;
```

These lines is all that is required to create another fully-functional Function App. Run `pulumi up` again. It adds the following resources to your stack:

```
$ pulumi up --yes
Updating (dev):

    Type                                    Name                 Status
    pulumi:pulumi:Stack                     pulumi-workshop-dev
+   └─ azure:appservice:ArchiveFunctionApp  archive-app          created
+      ├─ azure:storage:Account             archiveapp           created
+      ├─ azure:appservice:Plan             archive-app          created
+      ├─ azure:storage:Container           archive-app          created
+      ├─ azure:storage:ZipBlob             archive-app          created
+      └─ azure:appservice:FunctionApp      archive-app          created

Outputs:
  + archiveEndpoint: "https://archive-app52380b48.azurewebsites.net/api/hello"
    endpoint       : "https://myapp21479d.azurewebsites.net/api/hello"
```

You can see that the newly create `ArchiveFunctionApp` resource is a parent resource for five other resources. It copied the zip file into the Blob Storage, that's where the extra two resources come from.

Now you have two identical applications. Let's see how you can change one of them.

## Checkpoint

Send an HTTP request to the new `archiveEndpoint` and make sure it returns the same greeting.

Next: [Deploy Custom Code]({{< ref "/lab/pulumi/10-customcode" >}})