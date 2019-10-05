---
title: Multiple Files
subtitle: 4 minutes to complete
navtitle: Structure a Module as Multiple Files
nextstep: 11-furthersteps
nofeed: true
weight: 10
---

At some point, your `main.tf` may become too large to stay readable. You can split such a file into several files.

## Multiple Files

When invoking any command that loads the Terraform configuration, Terraform loads all configuration files within the directory specified in alphabetical order.

The exact names and order aren't important to Terraform. The order of variables and resources defined within the configuration doesn't matter. Terraform configurations are declarative, so references to other resources and variables do not depend on the order they're defined.

Therefore, you should structure the files to make it the most readable and maintainable for developers and operators.

## Module Breakdown

It's common to define providers, input variables, and output values in their files. Execute the following breakdown:

- Move two provider definitions to a new `providers.tf` file
- Move variables definitions to `variables.tf`
- Move outputs to `outputs.tf`

Test your refactoring by running `terraform apply`.

## Checkpoint

Run `terraform apply` and make sure that no changes are required. The file structure should have no impact on actual cloud resources.
