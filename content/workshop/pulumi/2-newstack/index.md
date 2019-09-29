---
title: New Pulumi Program
subtitle: 5 minutes to complete
nofeed: true
weight: 2
---

Pulumi supports several programming languages. The first step is to ask the CLI to bootstrap a basic TypeScript project.

## Create a folder

Make a new folder called `pulumi-workshop` anywhere on your local disk. By default, this folder will give name to your Pulumi project.

## Configure Pulumi CLI

Pulumi supports several "backends": ways to keep the state. For now, you can go for a local one: the state file will be stored on your disk.

Run the following command to switch to the local backend:

```
pulumi login --local
```

Then, set `PULUMI_CONFIG_PASSPHRASE` environment variable to any value. Pulumi needs it to encrypt the secret values, but we won't be using secrets in this lab.

Windows cmd: `set PULUMI_CONFIG_PASSPHRASE=bla` <br>PowerShell: `$env:PULUMI_CONFIG_PASSPHRASE="bla"` <br>Bash: `export PULUMI_CONFIG_PASSPHRASE=bla`

## Initialize the project

Run the following command from your empty folder to bootstrap a new project:

```
$ pulumi new azure-typescript -y

Created project 'pulumi-workshop'
Created stack 'dev'
Saved config
Installing dependencies...
Finished installing dependencies

Your new project is ready to go!
```

The output has been condenced for brevity: you should see more informational text.

## Inspect the program

Pulumi created several files, let's discuss them briefly:

- `index.ts`--- your program file, the only file that we are going to edit
- `package.json` and `package-lock.json`---definitions of required npm dependencies
- `Pulumi.yaml` and `Pulumi.dev.yaml`---project configuration
- `tsconfig.json`---settings for the TypeScript compiler
- `.gitignore`---Git exclusion list, not important for us
- `node_modules`---installed npm packages

Type `code index.ts` command to look at your Pulumi program. Right now, it consists of just one line:

``` ts
import * as pulumi from "@pulumi/pulumi";
```

## Install Azure plugin

Run the following command to install the Azure plugin for Pulumi:

```
npm install @pulumi/azure
```

The package is now added to `node_modules`, `package.json` and `package-lock.json`.

## Deploy

Run the `pulumi up` command to "deploy" your empty program. Although no resources are defined yet, the CLI asks you to create a *stack*:

```
$ pulumi up
Previewing update (dev):

    Type                 Name                 Plan
+   pulumi:pulumi:Stack  pulumi-workshop-dev  create

Resources:
   + 1 to create

Do you want to perform this update?
```

Stack is a virtual container for all the resources of a program. You may have multiple stack to deploy resources to multiple environments.

Choose `yes`.

## Checkpoint

`pulumi up` succeeded and printed `Resources: + 1 created`.

Next: [Deploy a Resource Group]({{< ref "/workshop/pulumi/3-resourcegroup" >}})