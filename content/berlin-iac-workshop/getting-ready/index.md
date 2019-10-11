---
title: "Azure Infrastructure as Code Workshop: Getting your environment ready"
date: 2019-10-02
nofeed: true
aliases:
    - /biacp/
---

Thank you for registering for my workshop "Azure Infrastructure as Code" at Serverless Architecture Conference Berlin 2019!

To make the workshop as productive as possible, I want to ask you to complete several preparation steps in advance. The steps are outlined below.

## Join the Slack Channel

If you haven't yet, I suggest joining a private Slack channel where we can discuss any issues or questions. We will also use this Slack channel during the workshop.

To join:

1. If you are already a member of Serverless Forum Slack space, go to step 4.

2. Otherwise, go to [this page](https://wt-serverless-seattle.run.webtask.io/serverless-forum-signup?webtask_no_cache=1) and submit your email to get an invitation.

3. Complete the registration at Serverless Forum Slack space.

4. DM me on Serverless Forum slack, I'm "Mikhail Shilkov" there.

5. I invite you to the private channel and give further instructions.

If you have any issues, find my other contacts at the [About Me](http://localhost:1313/about/) page.

## Laptop

Bring your own laptop! Any relatively modern laptop should be fine: we won't use anything beyond CLI commands, an editor, and basic HTTP requests via curl or browser.

All the tools are cross-platform, although I'm testing everything on Windows. Please let me know if you face any issues while installing anything.

## Azure Subscription

You need an active Azure subscription to deploy the components of the application. The total cost of all the resources that you create should be very close to $0. You can use your developer subscription, or create a free Azure subscription [here](https://azure.microsoft.com/free/).

Be sure to clean up the resources after you complete the workshop. You will find the cleanup steps at the end of each lab.

## Node.js and TypeScript compiler

We will write some programs in TypeScript. They will be executed by Node.js behind the scenes.

It's quite likely you already have node installed. If not, navigate to [Download Page](https://nodejs.org/en/download/) and install Node.js with npm.

If you have npm installed, you can install TypeScript globally on your computer with `npm install -g typescript`.

## Azure CLI

We will use the command-line interface (CLI) tool to log in to an Azure subscription and run some queries. You can install the CLI tool as [described here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

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

## Terraform CLI

Terraform is a CLI tool that drives cloud deployments from the machine where it runs. It is cross-platform and requires no installation, just a copy of the executable file accessible on the system's `PATH`.

Download the executable file from [Download Page](https://www.terraform.io/downloads.html) and either put it in one of the system's `PATH` folders or in the current directory where your workshop files are going to reside.

On Windows, you can also [install Terraform with Chocolatey](https://chocolatey.org/packages/terraform): `choco install terraform`.

Run `terraform version`, and you should get a response back:

```
$ terraform version
Terraform v0.12.8
```

## Pulumi CLI

Pulumi provides a CLI tool that drives cloud deployments from the machine where it runs. It is a cross-platform executable that has to be accessible on the system's `PATH`.

Follow [this guide](https://www.pulumi.com/docs/get-started/install/) to install the Pulumi CLI.

On Windows, you can also [install Pulumi with Chocolatey](https://chocolatey.org/packages/pulumi/): `choco install pulumi`.

Run `pulumi version`, and you should get a response back:

```
$ pulumi version
v1.2.0
```

## Text editor

Any text editor will do, but I recommend Visual Studio Code. You may want to install two extensions to get syntax highlighting, code completion, and validation:

- [Azure Resource Manager Tools extension](https://marketplace.visualstudio.com/items?itemName=msazurermtools.azurerm-vscode-tools)
- [Terraform extension](https://marketplace.visualstudio.com/items?itemName=mauve.terraform). After installation, run the command `Terraform: Enable/Disable Language Server` to enable experimental support for Terraform `0.12.x`

## Checklist

You are good to go if

- you can type `az account show` and see the details of your target subscription
- you can type `terraform version` and see a version number `0.12.x`
- you can type `pulumi version` and see a version number `1.x`

If any issues, please contact me ASAP.

See you in Berlin!