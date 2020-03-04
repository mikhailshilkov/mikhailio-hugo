---
title: Further Steps
subtitle: Ideas to implement on your own
nextstep: /lab/terraform/12-cleanup
nofeed: true
weight: 11
---

Congratulations! You've reached the end of the guided lab. You've learned the basics of developing and deploying Terraform modules.

Of course, we've only scratched the surface of Terraform capabilities. If you still have time and passion, the following tasks should give you enough material to continue learning on your own.

### Deploy a resource on your own

Think of any resource type that you tend to use in your serverless applications and try adding it to your template. Try adding Azure Application Insights, Azure Service Bus, Azure Cosmos DB, or any other resource to your liking.

Hint: [Azure Provider Docs](https://www.terraform.io/docs/providers/azurerm/index.html) is a great place to find sample code snippets.

### Code reuse

Once your root module becomes too large, you can start splitting it into multiple *submodules*.

For instance, add a new module that would define an Azure Event Hub namespace and an Event Hub and use it from your root module.

Hint: Refer to [Creating Modules ](https://www.terraform.io/docs/modules/index.html).

### Use conditions

Add an extra variable to your template called `new_plan`. If the value of this variable is anything but `yes`, do not create a new Consumption Plan as a part of the deployment, but use the built-in one.

This might be more tricky than you expect.

Hint: Refer to [Terraform tips & tricks: loops, if-statements, and gotchas](https://blog.gruntwork.io/terraform-tips-tricks-loops-if-statements-and-gotchas-f739bbae55f9) for inspiration.

## Clean Up

Once you are done experimenting, don't forget to clean up to avoid additional charges.
