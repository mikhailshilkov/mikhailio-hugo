---
title: Hacking time
date: 2019-10-07
nofeed: true
aliases:
    - /miaci/
---

So, you've learned the basics of developing and deploying Azure Resource Manager templates, Terraform configuration files, and Pulumi programs.

Now it's time to spend the last hour exploring things on your own. Choose one of the three tools, set a goal for yourself, and go for it.

Pick something that you would enjoy. It's been a long day, and you shouldn't force yourself into boring stuff.

You are free to pick any task that you can imagine. Here are some ideas to get your thinking started.

Hint: working in a group of 2-3 people is an excellent idea. But lone hackers are welcome too!

## Finish the previous labs

Didn't have enough time to complete the tasks from the previous sessions? You may do so now.

## Implement something from your job or hobby project

Have you been recently working on a serverless application? Did it require some infrastructure beyond a simple Function App?

Try to sketch it out using one of the infrastructure tools.

## Simple Web Server

Create a virtual machine which runs nginx and has an open port to server HTTP traffic.

Create an Azure Container Instance which runs nginx and has an open port to server HTTP traffic.

Hint: search for examples on the web.

## Try other Azure services that you are familiar with

Using Azure Virtual Machines, App Service, Azure Kubernetes Service, Azure Container Instances, KeyVault, or Cosmos DB? Try provisioning a simple application that would utilize those services.

Usually, you can easily find online examples for any combination of the mainstream service and the infrastructure tool.

## AWS or GCP

Not an Azure user? Are you developing applications for AWS or GCP? You can give Terraform or Pulumi a try with those cloud providers. Of course, ARM templates won't help you here.

## Pulumi with Python or C#

Enjoyed Pulumi but TypeScript is not your primary language choice? Give a try to another language, e.g. Python or C#. [Get Started](https://www.pulumi.com/docs/get-started/) page will guide you through the required steps.

## URL Shortener

Try to implement a URL Shortener application with infrastructure as code and Azure services. You would need:

- Azure Functions to handle HTTP requests and do the redirects
- Key-Value storage (Table Storage, Cosmos DB, Redis---pick your favorite)
- Bonus: a queue to store the new URLs
- Bonus: Application Insights to capture the usage stats

If you don't feel like writing the code for Azure Functions, you can reuse [this implementation](https://github.com/JeremyLikness/serverless-url-shortener/tree/master/functionApp).

## Geo-distributed Application (advanced)

Create a geographically-distributed serverless web application. Pick one Azure region in Europe and one region in America, and deploy an app to both. You would need:

- Several instances of Azure Functions, one per Azure region
- Azure Traffic Manager as the front-end to route users to the nearest location
- Bonus: A distributed Cosmos DB database replicated to the same regions

You don't have to write code for a real application: any HTTP function will do for now.