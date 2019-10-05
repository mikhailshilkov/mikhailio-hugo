---
title: Terraform State
subtitle: 2 minutes read
nofeed: true
weight: 6
---

At the previous step, we changed the `name` argument of the Storage Account resource. Terraform then deleted the old Account and created a new one. But how did Terraform know it can delete the old Account even though it wasn't a part of our definition file anymore?

## State file

In addition to creating resources in Azure, the `terraform apply` command has also created a `terraform.tfstate` file in the current directory. This file contains the snapshot of the most recently deployed infrastructure.

Terraform manages all the resources that are in the state file. In our case, the old Account was in the state file, but not in the definition, so Terraform deleted it. Terraform won't touch any resources that you created outside of the current stack.

For more information on why Terraform requires state and why Terraform cannot function without state, please see the page [state purpose](https://www.terraform.io/docs/state/purpose.html).


## Checkpoint

Have a look at your `.tfstate` file. Then, you are good to go further :)

Next: [Create a Consumption Plan]({{< ref "/lab/terraform/7-consumptionplan" >}})