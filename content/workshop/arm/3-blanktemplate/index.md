---
title: Blank ARM Template
subtitle: 4 minutes to complete
nofeed: true
weight: 3
---

An ARM Template is a JSON file which describes the resources that you want to create as part of a single deployment. The file has a specific schema that you must follow.

I recommend using Visual Studio Code with the Azure Resource Manager Tools extension to make for the best authoring experience.

## Create a Template

Pick or make a folder on your local disk and create a new file called `azureDeploy.json`. Copy-and-paste the following lines in it:

``` json
{
    "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "resources": [
    ]
}
```

This defines a blank template with no resources to create.

## Deploy the Template

Before we start defining resources, let's just deploy the empty template to get familiar with the workflow. From the folder where `azureDeploy.json` file is located, run the following command:

```
$ az group deployment create --template-file azureDeploy.json -g arm-workshop -o table
```

You should see ` - Running ..` output for some time and then get the confirmation of the success:

```
Name         ResourceGroup     State      Timestamp            Mode
-----------  ----------------  ---------  -------------------  -----------
azureDeploy  arm-workshop      Succeeded  2019-09-01T08:53:38  Incremental
```

## Checkpoint

Your deployed an empty template and got the state `Succeeded` in the output.

Next: [Deploy a Storage Account]({{< ref "/workshop/arm/4-storageaccount" >}})