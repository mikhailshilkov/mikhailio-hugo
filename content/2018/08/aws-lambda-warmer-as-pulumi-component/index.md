---
title: AWS Lambda Warmer as Pulumi Component
date: 2018-08-02
tags: ["AWS", "AWS Lambda", "Pulumi", "Serverless", "Cold Starts"]
thumbnail: teaser.jpg
description: Preventing cold stats of AWS Lambda during longer periods of inactivity, implemented as a reusable Pulumo component
---

Out of curiosity, I'm currently investigating cold starts of Function-as-a-Service platforms of major cloud providers. Basically,
if a function is not called for several minutes, the cloud instance behind it might be recycled, and then the next request will
take longer because a new instance will need to be provisioned.

Recently, Jeremy Daly [posted](https://www.jeremydaly.com/lambda-warmer-optimize-aws-lambda-function-cold-starts/) a nice
article about the proper way to keep AWS Lambda instances "warm" to (mostly) prevent cold starts with minimal overhead.
Chris Munns [endorsed](https://twitter.com/chrismunns/status/1017777028274294784) the article, so we know it's the right way.

The amount of actions to be taken is quite significant:

- Define a CloudWatch event which would fire every 5 minutes
- Bind this event as another trigger for your Lambda
- Inside the Lambda, detect whether current invocation is triggered by our CloudWatch event
- If so, short-circuit the execution and return immediately; otherwise, run the normal workload
- (Bonus point) If you want to keep multiple instances alive, do some extra dancing with calling itself N times in parallel,
provided by an extra permission to do so.

Pursuing Reusability
--------------------

To simplify this for his readers, Jeremy was so kind to

- Create an NPM package which you can install and then call from a function-to-be-warmed
- Provide SAM and Serverless Framework templates to automate Cloud Watch integration

Those are still two distinct steps: writing the code (JS + NPM) and provisioning the cloud resources (YAML + CLI). There are some
drawbacks to that:

- You need to change two parts, which don't look like each other
- They have to work in sync, e.g. Cloud Watch event must provide the right payload for the handler
- There's still some boilerplate for every new Lambda

Pulumi Components
-----------------

Pulumi takes a different approach. You can blend the application code and infrastructure management code
into one cohesive cloud application.

Related resources can be combined together into reusable components, which hide repetitive stuff behind code abstractions.

One way to define an AWS Lambda with Typescript in Pulumi is the following:

``` typescript
const handler = (event: any, context: any, callback: (error: any, result: any) => void) => {
    const response = {
        statusCode: 200,
        body: "Cheers, how are things?"
      };
    
    callback(null, response);
};

const lambda = new aws.serverless.Function("my-function", { /* options */ }, handler);
```

The processing code `handler` is just passed to infrastructure code as a parameter.

So, if I wanted to make reusable API for an "always warm" function, how would it look like?

From the client code perspective, I just want to be able to do the same thing:

``` typescript
const lambda = new mylibrary.WarmLambda("my-warm-function", { /* options */ }, handler);
```

CloudWatch? Event subscription? Short-circuiting? They are implementation details!

Warm Lambda
-----------

Here is how to implement such component. The declaration starts with a Typescript class:

``` typescript
export class WarmLambda extends pulumi.ComponentResource {
    public lambda: aws.lambda.Function;

    // Implementation goes here...
}
```

We expose the raw Lambda Function object, so that it could be used for further bindings and retrieving outputs.

The constructor accepts the same parameters as `aws.serverless.Function` provided by Pulumi:

``` typescript
constructor(name: string,
        options: aws.serverless.FunctionOptions,
        handler: aws.serverless.Handler,
        opts?: pulumi.ResourceOptions) {

    // Subresources are created here...
}
```

We start resource provisioning by creating the CloudWatch rule to be triggered every 5 minutes:

``` typescript
const eventRule = new aws.cloudwatch.EventRule(`${name}-warming-rule`, 
    { scheduleExpression: "rate(5 minutes)" },
    { parent: this, ...opts }
);
```

Then goes the cool trick. We substitute the user-provided handler with our own "outer" handler. This handler closes
over `eventRule`, so it can use the rule to identify the warm-up event coming from CloudWatch. If such is identified,
the handler short-circuits to the callback. Otherwise, it passes the event over to the original handler:

``` typescript
const outerHandler = (event: any, context: aws.serverless.Context, callback: (error: any, result: any) => void) =>
{
    if (event.resources && event.resources[0] && event.resources[0].includes(eventRule.name.get())) {
        console.log('Warming...');
        callback(null, "warmed!");
    } else {
        console.log('Running the real handler...');
        handler(event, context, callback);
    }
};
```

That's a great example of synergy enabled by doing both application code and application infrastructure in a
single program. I'm free to mix and match objects from both worlds.

It's time to bind both `eventRule` and `outerHandler` to a new serverless function:

``` typescript
const func = new aws.serverless.Function(
    `${name}-warmed`, 
    options, 
    outerHandler, 
    { parent: this, ...opts });
this.lambda = func.lambda;            
```

Finally, I create an event subscription from CloudWatch schedule to Lambda:

``` typescript
this.subscription = new serverless.cloudwatch.CloudwatchEventSubscription(
    `${name}-warming-subscription`, 
    eventRule,
    this.lambda,
    { },
    { parent: this, ...opts });
```

And that's all we need for now! See the full code 
[here](https://github.com/mikhailshilkov/pulumi-serverless-examples/blob/master/WarmedLambda-TypeScript/warmLambda.ts).

Here is the output of `pulumi update` command for my sample "warm" lambda application:

```
     Type                                                      Name                            Plan
 +   pulumi:pulumi:Stack                                       WarmLambda-WarmLambda-dev       create
 +    samples:WarmLambda                                       i-am-warm                       create
 +      aws-serverless:cloudwatch:CloudwatchEventSubscription  i-am-warm-warming-subscription  create
 +        aws:lambda:Permission                                i-am-warm-warming-subscription  create
 +        aws:cloudwatch:EventTarget                           i-am-warm-warming-subscription  create
 +      aws:cloudwatch:EventRule                               i-am-warm-warming-rule          create
 +      aws:serverless:Function                                i-am-warm-warmed                create
 +         aws:lambda:Function                                 i-am-warm-warmed                create
```

7 Pulumi components and 4 AWS cloud resources are provisioned by one `new WarmLambda()` line.

Multi-Instance Warming
----------------------

Jeremy's library supports warming several instances of Lambda by issuing parallel self-calls.

Reproducing the same with Pulumi component should be fairly straightforward:

- Add an extra constructor option to accept the number of instances to keep warm
- Add a permission to call Lambda from itself
- Fire N calls when warming event is triggered
- Short-circuit those calls in each instance

Note that only the first item would be visible to the client code. That's the power of componentization
and code reuse.

I didn't need multi-instance warming, so I'll leave the implementation as exercise for the reader.

Conclusion
----------

Obligatory note: most probably, you don't need to add warming to your AWS Lambdas.

But whatever advanced scenario you might have, it's likely that it is easier to express the scenario
in terms of general-purpose reusable component, rather than a set of guidelines or templates.

Happy hacking!