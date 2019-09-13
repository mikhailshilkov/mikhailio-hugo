---
title: Prerequisites
subtitle: Getting your environment ready
weight: 1
---

By following this hands-on lab, you will learn the basics of Azure Resource Manager (ARM) Templates by deploying real cloud resources. Therefore, several tools are required to go forward.

#### Azure Subscription

You need an active Azure subscription to deploy the components of the application. The total cost of all resources that you are going to create should be very close to $0. You can use your developer subscription, or create a free Azure subscription [here](https://azure.microsoft.com/free/).

Be sure to clean up the resources after you complete the workshop, as described at the last step.

#### Azure CLI

All interaction with Azure will happen via the command-line interface (CLI) tool. You can install the CLI tool as [described here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

The tool is cross-platform: it should work on Windows, macOS, or Linux (including WSL).

After you complete the installation, open a command prompt and type `az`. You should see the welcome message:

```
$ az
     /\
    /  \    _____   _ _  ___ _
   / /\ \  |_  / | | | \'__/ _\
  / ____ \  / /| |_| | | |  __/
 /_/    \_\/___|\__,_|_|  \___|


Welcome to the cool new Azure CLI!
```

Now, login to your Azure account by typing `az login` and providing your credentials in the browser window. When this is done, type `az account show`:

```
$ az account show
{
  "environmentName": "AzureCloud",
  "id": "12345678-9abc-def0-1234-56789abcdef0",
  "isDefault": true,
  "name": "My Subscription Name",
  "state": "Enabled",
  "tenantId": "eeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "user": {
    "name": "name@example.com",
    "type": "user"
  }
}
```

If you have multiple subscriptions and the wrong one is shown, [change the active subscription](https://docs.microsoft.com/en-us/cli/azure/manage-azure-subscriptions-azure-cli?view=azure-cli-latest#change-the-active-subscription).

#### Text editor

Any text editor will do, but I recommend Visual Studio Code. Please install [Azure Resource Manager Tools extension](https://marketplace.visualstudio.com/items?itemName=msazurermtools.azurerm-vscode-tools) to get syntax highlighting, code completion, and validation while editing ARM Templates.

#### Note: Azure Cloud Shell

If you don't want to install any software on your workstation, you can complete the entire lab in [Azure Cloud Shell](https://azure.microsoft.com/en-us/features/cloud-shell/). It's a command-line tool available within your Azure portal, right in the browser.

The Azure CLI tool and Visual Studio Code are pre-installed in Cloud Shell. Just type `az` or `code .` to run them.

However, I still recommend traditional out-of-browser experience. For example, the online version of Code has no extensions to help you author the templates.

## Checkpoint

You are good to go if you can type `az account show` and see the details of your target subscription.

Next: [Create a Resource Group]({{< ref "/workshop/arm/2-resourcegroup" >}})