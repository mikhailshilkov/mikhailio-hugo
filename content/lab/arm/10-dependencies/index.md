---
title: Dependencies
subtitle: 4 minutes to complete
navtitle: Set the deployment order with dependencies
nextstep: 11-furthersteps
nofeed: true
weight: 10
---

More often than not, Azure resources within a single deployment have dependencies on each other. For instance, our Function App depends on both Consumption Plan and Storage Account.

### Parallel or sequential

By default, Azure deployment will try to deploy all resources in parallel to minimize the deployment time. However, you should avoid a possible situation when a dependent resource starts deploying before all required resources are ready.

Up until now, we were adding resources one-by-one and making frequent deployments, so we didn't face any issues. However, if you try creating a new Resource Group and deploying the whole template at once, you might get some errors back.

### Explicit dependencies

We can tell Azure about dependencies between resources by setting the `dependsOn` property. Add the following snippet to your Function App resource:

```json
"dependsOn": [
    "[variables('storageAccountName')]",
    "[variables('planName')]"
],
```

Now, if you create a blank Resource Group and rerun the deployment, Azure will first deploy a Storage Account and a Consumption Plan, wait for those to complete, and only then start the deployment of the Function App.

### Implicit dependencies

Some template functions, e.g., `reference` and `list*`, create an implicit dependency between the resource in its argument and the resource where it's used.

Since implicit dependencies aren't very obvious and have some tricky boundary conditions, I recommend always to set an explicit dependency, even if an implicit function is used.

## Checkpoint

Run the deployment one more time. You should get no errors, and the HTTP endpoint should still return a greeting.
