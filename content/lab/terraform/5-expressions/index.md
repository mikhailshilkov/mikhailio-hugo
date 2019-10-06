---
title: Expressions
subtitle: 6 minutes to complete
navtitle: Use Expressions
nextstep: 6-state
material: main.tf
nofeed: true
weight: 5
---

We've deployed two Terraforms resource---a Resource Group and a Storage Account---but their definitions have some drawbacks:

- The `location` fields are hard-coded and are set to two different regions
- The Storage Account `name` is hard-coded too, and you had to to find a globally unique name manually
- The Storage Account references the Resource Group by its hard-coded name, which means duplication and lack of safety

Let's solve these problems.

## Values as expressions

Values for resource arguments may be defined in terms of string literals, as we did before. They are contained in double-quotes, e.g., `"westus"`.

The value can also be an *expression*. An expression has no double-quotes around it and can point to other resources. Here is an example:

```
  resource_group_name      = azurerm_resource_group.rg.name
```

This line specifies that the value for the argument `resource_group_name` should be set to `name` attribute of the resource `rg` of type `azurerm_resource_group`. In this case, this means that the Storage Account should take the name of the Resource Group from its resource definition. Even if you rename the Resource Group later on, you won't have to change the definition of the Storage Account resource.

Note that the reference uses the Terraform resource name `rg`, not the Resource Group name `terraform-workshop`.

Terraform checks expressions before applying the definitions, and it's able to catch errors like broken references.

## Reference Name and Location of the Resource Group

Modify the definition of the Storage Account resource to reference the Resource Group in `resource_group_name` and `location`:

```hcl
resource "azurerm_storage_account" "sa" {
  name                     = "<your unique SA name>"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

Run `terraform apply` again and look at the preview, you should see the suggestion to replace your Storage Account:

```
Terraform will perform the following actions:

  # azurerm_storage_account.sa must be replaced
...
      ~ location                          = "westus2" -> "westus" # forces replacement
...
```

It's not possible to change the location of a Storage Account in-place. Because we changed the location, Terraform decides to replace the resource: delete the old instance and create a new one.

Always look for replacement notes in Terraform preview: sometimes they may come as a surprise and then you would want to investigate before re-creating a resource which may contain valuable data.

However, this time, it's okay, so confirm the actions and wait for completions.

## Generating a unique name

Previously, you had to come up with a globally unique name for the Storage Account. However, this account is not our primary target: we just need it to start working with Azure Functions. It would be perfectly fine to give it some unique machine-generated name just to be able to proceed. We can use a `random_string` Terraform resource to do this for us.

First, register the `random` provider:

``` hcl
provider "random" {
}
```

And then define a `random_string` resource:

``` hcl
resource "random_string" "sa_name" {
  length = 10
  special = false
  upper = false
}
```

Storage Account names can only contain lowercase letters and digits, so we exclude special and uppercase characters. Now, update the definition of the Storage Account:

``` hcl
resource "azurerm_storage_account" "sa" {
  name                     = "sa${random_string.sa_name.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

This time, we used a different syntax of using referenced value: string interpolation with a very JavaScript-like syntax. The resulting name should be something like `saxpm31vuc7r`---starting with `sa` and then 10 random characters.

Run `terraform apply` to recreate the Storage Account.

Note that the `random_string` resource produces stable values: they are not going to change between subsequent runs. Very useful for multiple deployments!

## Checkpoint

List the resources in your Resource Group.

```
$ az resource list -g terraform-workshop -o table

Name          ResourceGroup       Location  Type
------------  ------------------- --------  ---------------------------------
saxpm31vuc7r  terraform-workshop  westus    Microsoft.Storage/storageAccounts
```

You should see a single Storage Account with a random name.
