---
title: Outputs
subtitle: 4 minutes to complete
navtitle: Get the Function App endpoint with Outputs
nextstep: 8-configs
material: index.ts
nofeed: true
weight: 7
---

It's also possible to return output values from a Pulumi program.

## Exporting outputs

At the previous step, we had to look up the Function App name via an `az` command. Let's *export* the name and the hostname of the App instead. Add the following lines at the end of your `index.ts`:

``` ts
export const appName = app.name;
export const hostname = app.defaultHostname;
```

`pulumi up` command automatically prints the output values at the end:

```
Updating (dev):
...

Outputs:
  + appName: "facc74d2f2"
  + hostname: "facc74d2f2.azurewebsites.net"
```

## Using outputs inside your program

If you hover over the `hostname` variable in your program, you will see that it has type `pulumi.Output<string>` not just `string`. That's because Pulumi runs your program before it creates any infrastructure, and it wouldn't be able to put an actual `string` into the variable. You can think of `pulumi.Output<T>` as similar to `Promise<T>`, although they are not the same thing.

Suppose, you want to export the full endpoint of your Function App. The following line is NOT CORRECT:

``` ts
export const endpoint = `https://${app.defaultHostname}/api/hello`;
```

It fails at runtime because a value of `pulumi.Output<string>` is interpolated into the string.

Instead, you should use one of the Pulumi's helper functions:

``` ts
// 'apply' can transform an Output to another Output with a function
export const endpoint1 = app.defaultHostname.apply(v => `https://${v}/api/hello`);

// 'interpolate' is a shortcut for Output interpolation
export const endpoint2 = pulumi.interpolate`https://${app.defaultHostname}/api/hello`;
```

Add these lines to the program and run `pulumi up` again.

Mastering `Output`s and their friends `Input`s does take time. Refer to the [docs](https://www.pulumi.com/docs/intro/concepts/programming-model/#outputs) for more details.

## Checkpoint

Use the output `endpoint1` or `endpoint2` (they are the same) to make another request to your Function App and make sure it still returns a greeting.
