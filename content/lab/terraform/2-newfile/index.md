---
title: New Terraform File
subtitle: 3 minutes to complete
navtitle: Create a Terraform File
nextstep: 3-resourcegroup
nofeed: true
weight: 2
---

A Terraform configuration file is a text file that describes the resources that you want to create as part of a single deployment. The file is written in a specialized language called Hashicorp Configuration Language, or HCL.

## Create a file

Pick or make a folder on your local disk and create a new file called `main.tf`. Copy-and-paste the following lines in it:

``` hcl
provider "azurerm" {
}
```

This block means that we are going to use the AzureRM (Azure Resource Manager) Terraform provider. There are no resources to create yet.

## Initialize the provider

Before we start creating resources, we need to install the requested provider. From the folder where `main.tf` file is located, run the following command:

```
$ terraform init

Initializing the backend...
Initializing provider plugins...
- Checking for available provider plugins...
- Downloading plugin for provider "azurerm" (hashicorp/azurerm) 1.33.1...
Terraform has been successfully initialized!
```

The output has been condensed for brevity: you should see more informational text. Terraform installs the requested provider into the `.terraform` subfolder of the current directory.

## Deploy

Run the `terraform apply` command to "deploy" your empty definition file. Although nothing gets deployed, you should see a confirmation:

```
$ terraform apply
Apply complete! Resources: 0 added, 0 changed, 0 destroyed.
```

## Checkpoint

`terraform init` and `terraform apply` commands have succeeded.
