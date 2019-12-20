---
title: Authoring a Custom Binding for Azure Functions
date: 2017-07-26
thumbnail: teaser.jpg
description: The process of creating a custom binding for Azure Functions.
tags: ["Azure", "Azure Functions"]
---

In my [previous post](https://mikhail.io/2017/07/custom-autoscaling-with-durable-functions/)
I described how I used Durable Functions extensions
in Azure Function App. Durable Functions are using several binding types
that are not part of the standard suite: `OrchestrationClient`,
`OrchestrationTrigger`, `ActivityTrigger`. These custom bindings
[are installed](https://azure.github.io/azure-functions-durable-extension/articles/installation.html)
by copying the corresponding assemblies to a special Extensions folder.

Although Bring-Your-Own-Binding (BYOB) feature hasn't been released yet, I
decided to follow the path of Durable Functions and create my own
custom binding.

Configuration Binding
---------------------

I've picked a really simple use case for my first experiments with custom
bindings: reading configuration values.

Azure Functions store their configuration values in App Settings (local
runtime uses `local.settings.json` file for that).

That means, when you need a configuration value inside your C# code,
you normally do

``` csharp
string setting = ConfigurationManager.AppSettings["MySetting"];
```

Alternatively, `Environment.GetEnvironmentVariable()` method can be used.

When I [needed to collect](https://mikhail.io/2017/07/custom-auto-scaling-in-azure/)
service bus subscription metrics, I wrote this kind of bulky code:

``` csharp
var resourceToScale = ConfigurationManager.AppSettings["ResourceToScale"];

var connectionString = ConfigurationManager.AppSettings["ServiceBusConnection"];
var topic = ConfigurationManager.AppSettings["Topic"];
var subscription = ConfigurationManager.AppSettings["Subscription"];
```

The code is no rocket science, but it's tedious to write, so instead I came
up with this idea to define Functions:

``` csharp
public static void MyFunction(
    [TimerTrigger("0 */1 * * * *")] TimerInfo timer,
    [Configuration(Key = "ResourceToScale")] string resource,
    [Configuration] ServiceBusSubscriptionConfig config)
```

Note two usages of `Configuration` attribute. The first one defines the
specific configuration key, and binds its value to a string parameter. The
other one binds *multiple* configuration values to a POCO parameter. I defined
the config class as

``` csharp
public class ServiceBusSubscriptionConfig
{
    public ServiceBusSubscriptionConfig(string serviceBusConnection, string topic, string subscription)
    {
        ServiceBusConnection = serviceBusConnection;
        Topic = topic;
        Subscription = subscription;
    }

    public string ServiceBusConnection { get; }
    public string Topic { get; }
    public string Subscription { get; }
}
```

The immutable class is a bit verbose, but I still prefer it over get-set
container in this scenario.

The binding behavior is convention-based in this case: the binding engine
should load configuration values based on the names of class properties.

Motivation
----------

So, why do I need such binding?

As I said, it's a simple use case to play with BYOB feature, and overall,
**understand** the internals of Function Apps a bit better.

But apart from that, I removed 4 lines of garbage from the function body
(at the cost of two extra parameters). **Less noise** means more readable code,
especially when I put this code on a webpage.

As a bonus, the **testability** of the function immediately increased. It's so
much easier for the test just to accept the configuration as input parameter,
instead of fine-tuning the configuration files inside test projects, or
hiding `ConfigurationManager` usage behind a mockable facade.

Such approach does seem to be the strength of Azure Functions code in
general. It's often possible to reduce imperative IO-related code to
attribute-decorated function parameters.

Implementing a Custom Binding
-----------------------------

The actual implementation process of a custom non-trigger binding is quite
simple:

**Create a class library** with the word "Extension" in its name. Import
`Microsoft.Azure.WebJobs` and `Microsoft.Azure.WebJobs.Extensions` NuGet
packages (at the time of writing I used `2.1.0-beta1` version).

**Define** a class for binding attribute:

``` csharp
[AttributeUsage(AttributeTargets.Parameter)]
[Binding]
public class ConfigurationAttribute : Attribute
{
    [AutoResolve]
    public string Key { get; set; }
}
```

The attribute is marked as `Binding` and the `Key` property is marked as
resolvable from `function.json`.

**Implement** `IExtensionConfigProvider` which will tell the function runtime
how to use your binding correctly.

The interface has just one method to implement:

``` csharp
public class ConfigurationExtensionConfigProvider : IExtensionConfigProvider
{
    public void Initialize(ExtensionConfigContext context)
    {
        // ... see below
    }
}

```

The first step of the implementation is to define a rule for our new
`ConfigurationAttribute` and tell this rule how to get a string value out
of any attribute instance:

``` csharp
var rule = context.AddBindingRule<ConfigurationAttribute>();
rule.BindToInput<string>(a => ConfigurationManager.AppSettings[a.Key]);
```

That's really all that needs to happen to bind `string` parameters.

To make our binding work with any POCO, we need a more elaborate construct:

``` csharp
rule.BindToInput<Env>(_ => new Env());
var cm = context.Config.GetService<IConverterManager>();
cm.AddConverter<Env, OpenType, ConfigurationAttribute>(typeof(PocoConverter<>));
```

I instruct the rule to bind to my custom class `Env`, and then I say that
this class `Env` is convertable to any type (denoted by special `OpenType`
type argument) with a generic converter called `PocoConverter`.

The `Env` class is a bit dummy (it exists just because I need *some* class):

``` csharp
private class Env
{
    public string GetValue(string key) => ConfigurationManager.AppSettings[key];
}
```

And `PocoConverter` is a piece of reflection, that loops through property
names and reads configuration values out of them. Then it calls a constructor
which matches the property count:

``` csharp
private class PocoConverter<T> : IConverter<Env, T>
{
    public T Convert(Env env)
    {
        var values = typeof(T)
            .GetProperties()
            .Select(p => p.Name)
            .Select(env.GetValue)
            .Cast<object>()
            .ToArray();

        var constructor = typeof(T).GetConstructor(values.Select(v => v.GetType()).ToArray());
        if (constructor == null)
        {
            throw new Exception("We tried to bind to your C# class, but it looks like there's no constructor which accepts all property values");
        }

        return (T)constructor.Invoke(values);
    }
}
```

This piece of code is not particularly robust, but it is good enough to
illustrate the concept.

And that's it, the binding it ready! You can find the complete example in
[my github repo](https://github.com/mikhailshilkov/mikhailio-samples/tree/master/custom-binding-azure-functions).

Deploying Custom Bindings
-------------------------

Since BYOB feature is in early preview, there is no tooling for automated
deployment, and we need to do everything manually. But the process is not
too sophisticated:

1. Create a folder for custom bindings, e.g. `D:\BindingExtensions`.

2. Set `AzureWebJobs_ExtensionsPath` parameter in your app settings
to that folder's path. For local development add a line to `local.settings.json`:

    ``` json
    "AzureWebJobs_ExtensionsPath": "D:\\BindingExtensions",
    ```

3. Create a subfolder for your extension, e.g.
`D:\BindingExtensions\ConfigurationExtension`.

4. Copy the contents of `bin\Debug\` of your extension's class library
to that folder.

5. Reference your extension library from your Function App.

You are good to go! Decorate your function parameters with the new attribute.

Run the function app locally to try it out. In the console output you should
be able to see something like

```
Loaded custom extension: ConfigurationExtensionConfigProvider from
'D:\BindingExtensions\ConfigurationExtension\MyExtensions.dll'
```

You will be able to debug your extension if needed.

Useful Links
------------

Use the following links to find out more about custom bindings, see more
examples and walkthroughs, and get fresh updates:

- [Extensibility in Azure WebJobs SDK](https://github.com/Azure/azure-webjobs-sdk/wiki/Extensibility)
- [Sample Extension for Azure Functions](https://github.com/Azure/WebJobsExtensionSamples/tree/master/SampleExtension),
[Sample Usage in Precompiled App](https://github.com/Azure/WebJobsExtensionSamples/blob/master/FunctionApp/ReaderFunction.cs) and
[Sample Usage in Script Runtime](https://github.com/Azure/WebJobsExtensionSamples/tree/master/ScriptRuntimeSample/Reader)
- [Custom Bindings of Durable Functions](https://github.com/Azure/azure-functions-durable-extension/tree/master/src/WebJobs.Extensions.DurableTask)
- [Installation Guide for Durable Functions](https://azure.github.io/azure-functions-durable-extension/articles/installation.html)

Have a good binding!