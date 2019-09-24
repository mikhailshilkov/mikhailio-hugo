---
title: Resource Group
subtitle: 4 minutes to complete
weight: 3
---

*Azure Resource Group* is a container for resources that are deployed together. Every Azure resource must be assigned to a resource group.

In contrast to Azure ARM Templates, Terraform handles Resource Groups is a normal resource. Therefore, a Resource Group is a first resource that we need to declare.

## Create a Resource Group

Add the following lines to your `main.tf` file:

```hcl
resource "azurerm_resource_group" "rg" {
  name     = "terraform-workshop"
  location = "westus"
}
```

The newly declared resource has the type `azurerm_resource_group` and the name `rg`. Note that `rg` is just a logical resource name in the configuration file, not the actual name of the resource group. The name is defined by `name` property and `location` defines the Azure region to deploy to.

## Apply changes

You changed the program---now it's time to apply the change to the cloud infrastructure. Run `terraform apply` command.

Instead of executing the changes immediately, Terraform will show you a preview of the changes-to-happen:

```
$ terraform apply

Terraform will perform the following actions:

  # azurerm_resource_group.rg will be created
  + resource "azurerm_resource_group" "rg" {
      + id       = (known after apply)
      + location = "westus"
      + name     = "terraform-workshop"
      + tags     = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

Type `yes` in the command prompt to execute the change:

```
  Enter a value: yes

azurerm_resource_group.rg: Creating...
azurerm_resource_group.rg: Creation complete after 3s

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

## Checkpoint

Make sure that your Resource Group was created successfully:

```
$ az group exists -g terraform-workshop
true
```

Next: [Create a Storage Account]({{< ref "/workshop/terraform/4-storageaccount" >}})