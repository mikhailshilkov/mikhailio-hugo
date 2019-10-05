---
title: Storage Account
subtitle: 5 minutes to complete
navtitle: Create a Storage Account
nextstep: 5-expressions
nofeed: true
weight: 4
---

Before we can deploy a serverless application, we need to create a *Storage Account*. Every Azure Functions application requires a Storage Account for its internal needs.

## Add a Storage Account resource

Copy-and-paste the following snippet to your `main.tf` file:

``` hcl
resource "azurerm_storage_account" "sa" {
  name                     = "tfsa"
  resource_group_name      = "terraform-workshop"
  location                 = "westus2"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

It defines a locally-redundant standard Storage Account, and it is a part of the Resource Group that we defined before.

Run `terraform apply` to apply the changes. You will get quite a lengthy preview of the changes, which means that a Storage Account has many properties. Some of them are optional inputs that we omitted, and some are outputs that are known after the resource is created.

Confirm the command and wait for its completion. Most likely, the command will fail with the message `The storage account named tfsa is already taken.`. This error happens because the name of a Storage Account must be globally unique.

Notice how preview hasn't warned you about this problem. A successful preview doesn't guarantee the success of the operation.

Add some random letters and numbers to the `name` property and rerun the command. We'll discuss a better way shortly. Meanwhile, make sure the command succeeds after the resource is renamed.

## Checkpoint

You received a `Creation complete` message for your Storage Account.
