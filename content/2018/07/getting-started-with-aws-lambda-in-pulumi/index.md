---
title: Getting Started with AWS Lambda in Pulumi
date: 2018-07-12
tags: ["AWS", "AWS Lambda", "Pulumi", "Serverless"]
thumbnail: teaser.jpg
description: Provisioning AWS Lambda and API Gateway with Pulumi, examples in 5 programming languages
---

For a small research project of mine, I needed to create HTTP triggered
AWS Lambda's in all supported programming languages.

I'm not a power AWS user, so I get easily confused about the configuration
of things like IAM roles or API Gateway. Moreover, I wanted my environment to
be reproducible, so manual AWS Console wasn't a good option.

I decided it was a good job for Pulumi. They pay a lot of attention to
serverless and especially AWS Lambda, and I love the power of 
configuration as code.

I created a Pulumi program which provisions Lambda's running on Javascript,
.NET, Python, Java and Go. Pulumi program itself is written in Javascript.

I'm describing the resulting code below in case folks need to do the same thing.
The code itself is on [my github](https://github.com/mikhailshilkov/pulumi-aws-serverless-examples).

Javascript
----------

Probably, the vast majority of Pulumi + AWS Lambda users will be using
Javascript as programming language for their serverless functions.

No wonder that this scenario is the easiest to start with. There is a
high-level package `@pulumi/cloud-aws` which hides all the AWS machinery from
a developer. 

The simplest function will consist of just several lines:

``` js
const cloud = require("@pulumi/cloud-aws");

const api = new cloud.API("aws-hellolambda-js");
api.get("/js", (req, res) => {
    res.status(200).json("Hi from Javascript lambda");
});

exports.endpointJs = api.publish().url;
```

Configure your Pulumi stack, run `pulumi update` and a Lambda 
is up, running and accessible via HTTP.

.NET Core
---------

.NET is my default development environment and AWS Lambda supports .NET Core
as execution runtime.

Pulumi program is still Javascript, so it can't mix C# code in. Thus, the setup
looks like this:

- There is a .NET Core 2.0 application written in C# and utilizing
`Amazon.Lambda.*` NuGet packages
- I build and publish this application with `dotnet` CLI
- Pulumi then utilizes the published binaries to create deployment artifacts

C# function looks like this:

``` csharp
public class Functions
{
    public async Task<APIGatewayProxyResponse> GetAsync(APIGatewayProxyRequest request, ILambdaContext context)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = (int)HttpStatusCode.OK,
            Body = "\"Hi from C# Lambda\"",
            Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
        };
    }
}
```

For non-Javascript lambdas I utilize `@pulumi/aws` package. It's of lower level
than `@pulumi/cloud-aws`, so I had to setup IAM first:

``` js
const aws = require("@pulumi/aws");

const policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        },
    ],
};
const role = new aws.iam.Role("precompiled-lambda-role", {
    assumeRolePolicy: JSON.stringify(policy),
});
```

And then I did a raw definition of AWS Lambda:

``` js
const pulumi = require("@pulumi/pulumi");

const csharpLambda = new aws.lambda.Function("aws-hellolambda-csharp", {
    runtime: aws.lambda.DotnetCore2d0Runtime,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./csharp/bin/Debug/netcoreapp2.0/publish"),
    }),
    timeout: 5,
    handler: "app::app.Functions::GetAsync",
    role: role.arn
});
```

Note the path to `publish` folder, which should match the path created by
`dotnet publish`, and the handler name matching C# class/method.

Finally, I used `@pulumi/aws-serverless` to define API Gateway endpoint for
the lambda:

``` js
const serverless = require("@pulumi/aws-serverless");

const precompiledApi = new serverless.apigateway.API("aws-hellolambda-precompiledapi", {
    routes: [
        { method: "GET", path: "/csharp", handler: csharpLambda },
    ],
});
```

That's definitely more ceremony compared to Javascript version. But hey, it's
code, so if you find yourself repeating the same code, go ahead and make a
higher order component out of it, incapsulating the repetitive logic.

Python
------

Pulumi supports Python as scripting language, but I'm sticking to Javascript
for uniform experience.

In this case, the flow is similar to .NET but simpler: no compilation step
is required. Just define a `handler.py`:

``` python
def handler(event, context): 
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': '"Hi from Python lambda"'
    }
```

and package it into zip in AWS lambda definition:

``` js
const pythonLambda = new aws.lambda.Function("aws-hellolambda-python", {
    runtime: aws.lambda.Python3d6Runtime,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./python"),
    }),
    timeout: 5,
    handler: "handler.handler",
    role: role.arn
});
```

I'm reusing the `role` definition from above. The API definition will also
be the same as for .NET.

Go
--

Golang is a compiled language, so the approach is similar to .NET: write code,
build, reference the built artifact from Pulumi.

My Go function looks like this:

``` go
func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

 return events.APIGatewayProxyResponse{
  Body:       "\"Hi from Golang lambda\"",
  StatusCode: 200,
 }, nil

}
```

Because I'm on Windows but AWS Lambda runs on Linux, I had to use 
[`build-lambda-zip`](https://github.com/aws/aws-lambda-go) 
tool to make the package compatible. Here is the PowerShell build script:

``` powershell
$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -o main main.go
~\Go\bin\build-lambda-zip.exe -o main.zip main
```

and Pulumi function definition:

``` js
const golangLambda = new aws.lambda.Function("aws-hellolambda-golang", {
    runtime: aws.lambda.Go1dxRuntime,
    code: new pulumi.asset.FileArchive("./go/main.zip"),
    timeout: 5,
    handler: "main",
    role: role.arn
});
```

Java
----

Java class implements an interface from AWS SDK:

``` java
public class Hello implements RequestStreamHandler {

    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context) throws IOException {

        JSONObject responseJson = new JSONObject();

        responseJson.put("isBase64Encoded", false);
        responseJson.put("statusCode", "200");
        responseJson.put("body", "\"Hi from Java lambda\"");  

        OutputStreamWriter writer = new OutputStreamWriter(outputStream, "UTF-8");
        writer.write(responseJson.toJSONString());  
        writer.close();
    }
}
```

I compiled this code with Maven (`mvn package`), which produced a `jar` file. AWS Lambda accepts
`jar` directly, but Pulumi's `FileArchive` is unfortunately crashing on trying
to read it.

As a workaround, I had to define a `zip` file with `jar` placed inside `lib`
folder:

``` js
const javaLambda = new aws.lambda.Function("aws-coldstart-java", {
    code: new pulumi.asset.AssetArchive({
        "lib/lambda-java-example-1.0-SNAPSHOT.jar": new pulumi.asset.FileAsset("./java/target/lambda-java-example-1.0-SNAPSHOT.jar"),
    }),
    runtime: aws.lambda.Java8Runtime,
    timeout: 5,
    handler: "example.Hello",
    role: role.arn
});
```

Conclusion
----------

The complete code for 5 lambda functions in 5 different programming languages
can be found in [my github repository](https://github.com/mikhailshilkov/pulumi-aws-serverless-examples).

Running `pulumi update` provisions 25 AWS resources in a matter of 1 minute,
so I can start playing with my test lambdas in no time.

And the best part: when I don't need them anymore, I run `pulumi destroy` and
my AWS Console is clean again!

Happy serverless moments!