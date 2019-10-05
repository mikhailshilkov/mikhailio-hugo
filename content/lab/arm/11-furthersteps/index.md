---
title: Further Steps
subtitle: Ideas to implement on your own
nextstep: 12-cleanup
nofeed: true
weight: 11
---

Congratulations! You've reached the end of the guided lab. You've learned the basics of developing and deploying Azure Resource Manager templates.

Of course, we've only scratched the surface of ARM templates' capabilities. If you still have time and passion, the following tasks should give you enough material to continue learning on your own.

### Deploy a resource on your own

Think of any resource type that you tend to use in your serverless applications and try adding it to your template. Try adding Azure Application Insights, Azure Service Bus, Azure Cosmos DB, or any other resource to your liking.

Hint: [Azure Quickstart Templates](https://github.com/Azure/azure-quickstart-templates) is a great place to find an example implementation.

### Quiz: Clean up the resources in a Resource Group

A typical clean-up operation would involve deleting the Resource Group.

How could you delete all the resources that your deployment created, but keep the Resource Group intact?

Hint: there is no built-in command for this. Be creative with what you learned today.

### Use conditions

Add an extra parameter to your template called `newPlan`. If the value of this parameter is anything but `yes`, do not create a new Consumption Plan as a part of the deployment, but use the built-in one.

Hint: Refer to [Use condition in Azure Resource Manager templates](https://docs.microsoft.com/azure/azure-resource-manager/resource-manager-tutorial-use-conditions).

### Code reuse

Once your JSON template becomes too large, you can start splitting it into multiple files with *linked templates*.

Add an Azure Event Hub namespace and an Event Hub by linking [this template](https://github.com/Azure/azure-quickstart-templates/blob/master/101-eventhubs-create-namespace-and-eventhub/azuredeploy.json) from your template.

Hint: Refer to [Using linked and nested templates when deploying Azure resources](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-linked-templates).

## Clean Up

Once you are done experimenting, don't forget to clean up to avoid additional charges.