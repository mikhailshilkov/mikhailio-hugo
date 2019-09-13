---
title: Resource Group
subtitle: 4 minutes to complete
weight: 2
---

*Azure Resource Group* is a container for resources that are deployed together. Every Azure resource must be assigned to a resource group.

During this hands-on lab, we will create a single Resource Group and a single ARM Template. All resources defined in the Template will be deployed to this Resource Group.

## Is a Resource Group a part of an ARM Template?

The original concept of ARM Templates suggests deploying a template into a pre-existing Resource Group. This way, a Resource Group is not defined inside the template but is created separately and before the first deployment.

Later on, Microsoft introduced a way to deploy a Resource Group as a part of the Template, enabling a single deployment to target multiple Resource Groups. Nonetheless, this stays an advanced topic and we will avoid subscription-level deployments in this workshop.

## Create a Resource Group

We are going to create a blank Resource Group and use it as a target of all deployments of this workshop. You only need two parameters for the new Resource Group:

- **Name**---think of a name that would be easy to remember and type, e.g. `arm-workshop`. The name has to be unique within your subscription.
- **Location**---pick the nearest [Azure region](https://azure.microsoft.com/global-infrastructure/regions/); for me it's `westeurope`.

Now, execute the command to create the Resource Group:

```
$ az group create --name arm-workshop --location westeurope --output table
```

The `--output table` parameter switches the output to a more concise human-readable format. Here is the result you should see:

```
Location    Name
----------  -----------------
westeurope  arm-workshop
```

## Checkpoint

Make sure that your Resource Group was created successfully:

```
$ az group exists -g arm-workshop
true
```

Next: [Create a Blank ARM Template]({{< ref "/workshop/arm/3-blanktemplate" >}})