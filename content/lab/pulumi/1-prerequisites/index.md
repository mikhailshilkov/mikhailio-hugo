---
title: Prerequisites
subtitle: Getting your environment ready
nofeed: true
weight: 1
---

By following this hands-on lab, you will learn the basics of Pulumi and its Azure provider by deploying real cloud resources. Therefore, several tools are required to go forward.

#### Azure Subscription

You need an active Azure subscription to deploy the components of the application. The total cost of all resources that you are going to create should be very close to $0. You can use your developer subscription, or create a free Azure subscription [here](https://azure.microsoft.com/free/).

Be sure to clean up the resources after you complete the workshop, as described at the last step.

#### Azure CLI

We will use the command-line interface (CLI) tool to login to an Azure subscription and run some queries. You can install the CLI tool as [described here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

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

#### Pulumi CLI

Pulumi provides a CLI tool which drives cloud deployments from the machine where it runs. It is a cross-platform executable that has to be accessible on the system's `PATH`.

Follow [this guide](https://www.pulumi.com/docs/get-started/install/) to install the Pulumi CLI.

Alternatively, you can [install Pulumi with Chocolatey](https://chocolatey.org/packages/pulumi/): `choco install pulumi`.

Run `pulumi version` and you should get a response back:

```
$ pulumi version
v1.1.1
```

#### Node.js and TypeScript compiler

We will write Pulumi programs in TypeScript. They will be executed by Node.js behind the scenes.

It's quite likely you already have node installed. If not, navigate to [Download Page](https://nodejs.org/en/download/) and install Node.js with npm.

If you have npm installed, you can install TypeScript globally on your computer with `npm install -g typescript`.

#### Text editor

Any text editor will do, but I recommend one with TypeScript syntax highlighting. The most common choice is Visual Studio Code.

#### Note: Azure Cloud Shell

If you don't want to install any software on your workstation, you can complete the entire lab in [Azure Cloud Shell](https://azure.microsoft.com/en-us/features/cloud-shell/). It's a command-line tool available within your Azure portal, right in the browser.

Azure CLI and Visual Studio Code are pre-installed in Cloud Shell, Just type `az` or `code .` to run them. The Pulumi CLI can be installed as described above.

Traditional out-of-browser tools are still likely to provide better development experience.

## Checkpoint

You are good to go if

- you can type `az account show` and see the details of your target subscription.
- you can type `pulumi version` and see a version number `1.x` or above.

Next: [Create a Pulumi Program]({{< ref "/lab/pulumi/2-newstack" >}})