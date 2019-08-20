---
layout: post
title: Getting started with Azure Application Insights in Aurelia
date: 2016-08-21
tags: ["Azure", "Application Insights", "Aurelia", "Javascript", "Typescript"]
thumbnail: teaser.png
---

[Azure Application Insights](https://azure.microsoft.com/en-us/documentation/articles/app-insights-overview/)
is an analytics service to monitor live web applications,
diagnose performance issues, and understand what users actually do with the app. 
[Aurelia](http://aurelia.io) is a modern and slick single-page application framework.
Unfortunately, there's not much guidance on the web about how to use AppInsights and
Aurelia together in a proper manner. The task gets even more challenging in case you are
using TypeScript and want to stay in type-safe land. This post will set you up and
running in no time.

Get Your AppInsights Instrumentation Key
----------------------------------------

If not done yet, go register in Azure Application Insights portal. To start sending
telemetry data from your application you would need a unique identifier of 
your web application, which is called an Instrumentation Key (it's just a guid). 
See [Application Insights for web pages](https://azure.microsoft.com/en-us/documentation/articles/app-insights-javascript/)
walk-through.

Install a JSPM Package
----------------------

I'm using JSPM as a front-end package manager for Aurelia applications. If you use it
as well, run the following command to install AppInsights package:

```
jspm install github:Microsoft/ApplicationInsights-js
```

it will add a line to `config.js` file:

```
map: {
  "Microsoft/ApplicationInsights-js": "github:Microsoft/ApplicationInsights-js@1.0.0",
...
```

To keep the names simple, change the line to 

```
  "ApplicationInsights": "github:Microsoft/ApplicationInsights-js@1.0.0",
```

Do exactly the same change in `project.json` file, `jspm` -> `dependencies` section.

Create an Aurelia Plugin
------------------------

In order to track Aurelia page views, we are going to plug into the routing pipeline
with a custom plugin. Here is how my plugin looks like in JavaScript (see TypeScript
version below):

``` js
// app-insights.js
export class AppInsights {
  client;

  constructor() {
    let snippet = {
      config: {
        instrumentationKey: 'YOUR INSTRUMENTATION KEY GUID'
      }
    };
    let init = new Microsoft.ApplicationInsights.Initialization(snippet);
    this.client = init.loadAppInsights();
  }

  run(routingContext, next) {
    this.client.trackPageView(routingContext.fragment, window.location.href);
    return next();
  }
}
```

The constructor instantiates an AppInsights client. It is used inside a `run` method,
which would be called by Aurelia pipeline during page navigation.

Add the Plugin to Aurelia Pipeline
----------------------------------

Go the the `App` class of your Aurelia application. Import the new plugin

``` js
// app.js
import {AppInsights} from './app-insights';
```

and change the `configureRouter` method to register a new pipeline step:

``` js
configureRouter(config, router): void {
  config.addPipelineStep('modelbind', AppInsights);
  config.map(/*routes are initialized here*/);
}
```

After re-building the application, you should be all set to go. Navigate several pages
and wait for events to appear in Application Insights portal.

TypeScript: Obtain the Definition File
--------------------------------------

If you are using TypeScript, you are not done yet. In order to compile the `AppInsights`
plugin you need the type definitions for `ApplicationInsights` package. Unfortunately,
at the time of writing there is no canonical definition in `typings` registry, so
you will have to provide a custom `.d.ts` file. You can download mine from
[my github](https://github.com/mikhailshilkov/mikhailio-samples/blob/master/aurelia-app-insights/applicationinsights.d.ts). 
I created it based on a file from 
[this NuGet repository](https://www.nuget.org/packages/Microsoft.ApplicationInsights.TypeScript).

I've put it into the `custom_typings` folder and then made the following adjustment
to `build/paths.js` file of Aurelia setup:

```
  dtsSrc: [
    'typings/**/*.d.ts',
    'custom_typings/**/*.d.ts'
  ],
```

For the reference, here is my TypeScript version of the `AppInsights` plugin:

``` ts
import {NavigationInstruction, Next} from 'aurelia-router';
import {Microsoft} from 'ApplicationInsights';

export class AppInsights {
  private client: Microsoft.ApplicationInsights.AppInsights;

  constructor() {
    let snippet = {
      config: {
        instrumentationKey: 'YOUR INSTRUMENTATION KEY GUID'
      },
      queue: []
    };
    let init = new Microsoft.ApplicationInsights.Initialization(snippet);
    this.client = init.loadAppInsights();
  }

  run(routingContext: NavigationInstruction, next: Next): Promise<any> {
    this.client.trackPageView(routingContext.fragment, window.location.href);
    return next();
  }
}
```

Conclusion
----------

This walk-through should get you started with Azure Application Insights in your
Aurelia application. Once you have page view metrics coming into the dashboard,
spend more time to discover all the exciting ways to improve your application
with Application Insights.