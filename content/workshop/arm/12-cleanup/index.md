---
title: Clean Up
subtitle: Delete the unused resources
weight: 12
---

Azure resources may incur charges. Once you are done with the lab, don't forget to clean them up.

The easiest way to do so is to run a CLI command to delete the Resource Group:

```
az group delete --name arm-workshop --yes
```

You can make sure the Resource Group is gone with

```
az resource list -o table
```

Thanks for joining the hands-on lab!