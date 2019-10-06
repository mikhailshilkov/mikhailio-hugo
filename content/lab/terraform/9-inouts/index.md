---
title: Inputs and Outputs
subtitle: 6 minutes to complete
navtitle: Set Inputs and Get Outputs
nextstep: 10-multiplefiles
material: main.tf
nofeed: true
weight: 9
---

We created a working Terraform module, but it has several essential properties hard-coded in the text. This fact limits its reusability: for example, you wouldn't be able to use the same module to deploy to multiple environments like production and staging. Environments would clash on the name of the Function App. Also, if you choose to deploy to another Azure region, you have to change the code.

Let's learn how to parameterize your Terraform modules.

## Input variables

Input variables serve as parameters for a Terraform module, allowing aspects of the module to be customized without altering the module's source code.

Each input variable accepted by a module must be declared using a `variable` block. Extend your module with a definition of the `region` variable:

``` hcl
variable "region" {
  type    = string
  default = "westus"
}
```

Now, you can refer to the variable value with `var.<NAME>` expression. Change the definition of your Resource Group to set the region from the variable:

``` hcl
resource "azurerm_resource_group" "rg" {
  name     = "terraform-workshop"
  location = var.region
}
```

Our `region` variable has a default value. If you want to override this value, you can pass a `-var` parameter to the CLI call:

```
terraform apply -var="region=westeurope"
```

The `-var` option can be used any number of times in a single command.

Go ahead and define variables `rg_name` for the Resource Group name and `app_name` for the Function App name. Use those variables in resource definitions. Construct the name of the App Service Plan to be `${var.app_name}-asp`.

Apply the changes: some resources will likely need to be replaced.

## Output values

It's also possible to return values from a Terraform module. Let's define an *output value* to return the endpoint of our Azure Function. Add the following block to your `main.tf`:

``` hcl
output "endpoint" {
  value = "https://${azurerm_function_app.app.default_hostname}/api/hello"
}
```

`terraform apply` command automatically prints the output values:

```
Apply complete! Resources: 0 added, 0 changed, 0 destroyed.

Outputs:

endpoint = https://myuniquename.azurewebsites.net/api/hello
```

## Checkpoint

Send an HTTP request to the endpoint above via a browser, or with a `curl` command, and make sure it still returns a greeting.
