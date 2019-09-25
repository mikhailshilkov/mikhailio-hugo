---
title: Deployment Modes
subtitle: 5 minutes to complete
nofeed: true
weight: 6
---

When deploying your resources, you may specify a *deployment mode*. The deployment is either an *incremental* update or a *complete* update. The primary difference between these two modes is how Resource Manager handles existing resources in the Resource Group which are not defined in the template.

For both modes, Resource Manager tries to create all resources specified in the template. If a resource with the same name already exists in the Resource Group and its settings are unchanged, no operation is executed for that resource. If you change the properties for a resource, the resource is updated with the new values.

If you try to update the location or the type of an existing resource, the deployment fails with an error. Instead, deploy a new resource with the location or type that you need.

In incremental mode, Resource Manager leaves unchanged resources that exist in the Resource Group but aren't specified in the template. In complete mode, Resource Manager deletes resources that exist in the Resource Group but aren't specified in the template.

## Switch to complete mode

The default mode is incremental. However, it's advised that you use complete mode whenever possible.

To switch your deployment to the complete mode, add `--mode complete` to the CLI command:

```
$ az group deployment create --template-file azureDeploy.json --mode complete -g arm-workshop -o table
```

Since the Storage Account with the fixed name isn't defined in the template anymore, it is deleted by the command.

## Checkpoint

List resources in your Resource Group:

```
$ az resource list -g arm-workshop -o table

Name            ResourceGroup Location     Type
--------------  ------------- -----------  ---------------------------------
42tsnvw2a6dlc   arm-workshop  westeurope   Microsoft.Storage/storageAccounts
```

 The command should yield a single resource again: a Storage Account with a funny auto-generated name.

Next: [Variables, Parameters, and Outputs]({{< ref "/workshop/arm/7-parameters" >}})