---
title: Clean Up
subtitle: Delete the unused resources
nofeed: true
weight: 13
---

Azure resources may incur charges. Once you are done with the lab, don't forget to clean them up.

Destroying resources with Pulumi is very easy. Run the following command and confirm when prompted:

```
pulumi destroy
```

Also, destroy the Pulumi stack:

```
pulumi stack rm dev
```

Thanks for joining the hands-on lab!