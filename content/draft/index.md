---
title: How Azure CLI stores your credentials
date: 2019-07-02
thumbnail: teaser.jpg
tags: ["TODO"]
description:
ghissueid: 12
---

Azure has a number of tools to manage resources. The Azure command-line interface (CLI) is probably #2 most-used tool after the portal. CLI is cross-platform and feature rich. (Give an example of a powerful short command.) It's quite likely that if you use Azure and do some sort of automation - you have a CLI installed on your PC.

## A quick primer of OAuth and JWT tokens

The very first command that you run after installing the CLI on your development machine is going to be

``` bash
az login
```

There are several sign-in flows, but most typically the CLI will open the default browser asking you to login there. The login has a unique session ID. Once you login with this session ID, the CLI will receive a notification on its back channel. The notification will contain the all-power Access Token.

The Access Token will be used for most other commands to access Azure Management REST API. API uses OAuth protocol where the access token is passed in Authorization HTTP header.

The Access Token has a limited timespan - I observed 60 minutes. To avoid requiring to login after its expiration, there is another powerful token - refresh token. Whenever access token expires, CLI goes to authentication, presents the refresh token, and asks for a new access token. The lifetime of a refresh token is longer and it's managed on the service side. There are some (configurable) policies to expire it, e.g. if it was inactive for more than X days. They can also be revoked manually at any time.

## Storing tokens on the local disk

There is one problem though. CLI is a short-lived program: it runs for the duration of a single commands and then quits. The process dies so there's no way to keep access tokens in memory between the executions. To the CLI keeps the state on disk. If you go the %HOMEPATH%/.azure/ folder you will find two files, among others:

`azureProfile.json` will contain the information about your subscriptions and users. `accessTokens.json` is more interesting. As the name suggests, it contains all the tokens from Azure CLI, right there in plain text.

If you go ahead and copy-paste this toek to jwt.io, you will see the information about it: ...

## Token reuse by other tools

The access token is not specific to CLI and can be used in any tool. Copy-paste your access token to the following curl command and you will get a list of resource groups in your subscriptions.

Both Terraform and Pulumi have a default method of logging into Azure with Azure CLI. They probably delegate to Azure CLI instead of accessing `accessTokens.json` directly, but that's mostly convenience not the hard requirement. Effectively, they are able to reuse the tokens created by Azure CLI for its own purpose.

## Security risks of token exposure

The existance of a file with Azure access tokens means that you should be careful not to expose it to anyone. Don't share $HOME/.azure/ with anybody, don't put it on GitHub, don't upload it to random file sharing applications.

Access tokens file could potentially become an attack vector. Say, you install a new shiny CLI tool from NPM. You run it from your own user account, the tool does its job but also silently uploads `accessTokens.json` file to somebody's DropBox. A month later you get surprised while looking at your Azure bill.


I checked this scenario by uploading my `~/.azure` folder to a brand-new VM. A fresh installation of Azure CLI happily welcomes me without the need for `az login`:

## Pro tip

A practical pro tip to conclude the topic. Whenever you find yourself needing to call an Azure Management REST API, do the following:

1. Copy-paste the URL from a sample online and adjust it with your resources' identifiers
2. Add an Authorization request header with the value `Bearer TOKENGOESHERE` with `TOKENGOESHERE` being a value copy-pasted from `accessTokens.json`.
3. If the token has expired, call `az get-acess-token` to refresh it and repeat the step 2.
