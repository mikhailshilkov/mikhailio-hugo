---
title: Configuration
subtitle: 6 minutes to complete
nofeed: true
weight: 8
---

We created a working Pulumi program that generates a random name for the Function App. This might not be desirable: maybe, we want to control the name. Hard-coding the name in the program may limit its reusability: for example, you wouldn't be able to use the same program to deploy to multiple environments like production and staging.

Same applies to the name and location of the Resource Group. Environments would clash on the name. If you choose to deploy to another Azure region, you have to change the code.

Let's learn how to parameterize your Pulumi program.

## Config command

The `pulum config` CLI command can save some values as configuration parameters. Run the following commands to set the names for the Resource Group and the Function App:

```
$ pulumi config set rgName pulumi-workshop
$ pulumi config set appName <myuniquename>
```

You have to come up with a globally unique name for the Function App.

There are also several built-in configuration values. For example, `azure:location` setting defines the default Azure region for all Resource Groups that don't have an explicit `location` value:

```
$ pulumi config set azure:location westus
```

## Read config values

``` ts
const config = new pulumi.Config();
const rgName = config.get("rgName");
const appName = config.get("appName");
```

Now change the definition of the Resource Group:

``` ts
const resourceGroup = new azure.core.ResourceGroup("pulumi-workshop", {
    name: rgName,
});
```

and the Function App:

``` ts
const app = new azure.appservice.FunctionApp("fa", {
    resourceGroupName: resourceGroup.name,
    name: appName,
    ...
});
```

Note that `get` reads an optional value: if you omit the configuration value, the names fall back to auto-generated ones. `config.require` can be used to read the mandatory values.

We don't set the `location` property of any of our resources anymore. Therefore, the `azure:location` configuration value is required now.

## Apply the changes

Run `pulumi preview command to see which changes are planned. You should get this output:

```
Previewing update (dev):
    Type                             Name                 Plan        Info
    pulumi:pulumi:Stack              pulumi-workshop-dev
+-  └─ azure:appservice:FunctionApp  fa                   replace     [diff: ~name]

    +-1 to replace
    4 unchanged
```

Note that I kept the logical names of the Resource Group and the Function App: `pulumi-workshop` and `fa`. Pulumi keeps the previous state of all resources in its state file, so it's able to compare the old state with the new program and calculate the transition plan. I haven't renamed my Resource Group, but the name of the Function App has changed from an auto-generated one to the configured one. Therefore, Pulumi is about to re-create the Function App with a new physical name.

If you preview matches these expectations, go ahead and run `pulumi up`. In general, you should always understand the preview before you hit 'yes'.

## Checkpoint

Send an HTTP request to the new application endpoint and make sure it still returns a greeting.

Next: [Use a High-level Component]({{< ref "/lab/pulumi/9-archiveapp" >}})