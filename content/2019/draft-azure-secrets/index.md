---
title: Azure Secrets
date: 2019-07-04
thumbnail: teaser.jpg
tags: ["Azure"]
description:
ghissueid: 15
---

Examples of secrets:

- A connection string to messaging / database
- An access key for a 3rd party service
- SAS Token to Azure Storage

1. Hard-coded secrets

Example of accessing secrets

2. App config file

Don't mix secrets with configuration.

3. Environment variables / Application Settings

Pulumi secret + app settings

4. Key vault

Put the secret to Key vault, read it from code.

5. Accessing Key Vault with MSI

No need to configure SP.

6. Key vault with app service settings

Reduce the code, load settings transparently from key vault, use env vars locally.

7. MSI + RBAC

The most secure secrets are no secrets.