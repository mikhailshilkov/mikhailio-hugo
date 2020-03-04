---
title: New Pulumi Program
subtitle: 5 minutes to complete
navtitle: Create a Pulumi Program
nextstep: /lab/pulumi/3-resourcegroup
nofeed: true
weight: 2
---

Pulumi supports several programming languages. The first step is to ask the CLI to bootstrap a basic TypeScript project.

## Create a folder

Make a new folder called `pulumi-workshop` anywhere on your local disk. By default, this folder gives a name to your Pulumi project.

## Configure Pulumi CLI

Pulumi supports several "backends": storage types to keep the state. By default, you will use the Pulumi service as backend. It's free for individual use and provides several features like secret management and history browser.

Type `pulumi login` in your command line, hit ENTER at the prompt, and complete the sign up flow.

Other backend options are discussed [here](https://www.pulumi.com/docs/intro/concepts/state/#backends).

## Initialize the project

Run the following command from your empty folder to bootstrap a new project:

```
$ pulumi new typescript -y

Created project 'pulumi-workshop'
Created stack 'dev'
Saved config
Installing dependencies...
Finished installing dependencies

Your new project is ready to go!
```

The output has been condensed for brevity: you should see more informational text.

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

The package is now added to `node_modules`, `package.json`, and `package-lock.json`.

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

A stack is a virtual container for all the resources of a program. You may have multiple stacks to deploy resources to multiple environments.

Choose `yes`.

## Checkpoint

`pulumi up` succeeded and printed `Resources: + 1 created`.
