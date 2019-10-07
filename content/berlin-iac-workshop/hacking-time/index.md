---
title: Hacking time
date: 2019-10-07
nofeed: true
aliases:
    - /biaci/
---

So, you've learned the basics of developing and deploying Azure Resource Manager templates, Terraform configuration files, and Pulumi programs.

Now it's time to spend the last hour exploring things on your own. Choose one of the three tools, set a goal for yourself, and go for it.

Pick something that you would enjoy. It's been a long day, and you shouldn't force yourself into boring stuff.

You are free to pick any task that you can imagine. Here are some ideas to get your thinking started.

Hint: working in a group of 2-4 people is an excellent idea. But lone hackers are welcome too!

## Implement something from your job or hobby project

Have you been recently working on a serverless application? Did it require some infrastructure beyond a simple Function App?

Try to sketch it out using one of the infrastructure tools.

## URL Shortener

Try to implement a URL Shortener application with infrastructure as code and Azure services. You would need:

- Azure Functions to handle HTTP requests and do the redirects
- Key-Value storage (Table Storage, Cosmos DB, Redis---pick your favorite)
- Bonus: a queue to store the new URLs
- Bonus: Application Insights to capture the usage stats

If you don't feel like writing the code for Azure Functions, you can reuse [this implementation](https://github.com/JeremyLikness/serverless-url-shortener/tree/master/functionApp).

## Geo-distributed Application

Create a geographically-distributed serverless web application. Pick one Azure region in Europe and one region in America, and deploy an app to both. You would need:

- Several instances of Azure Functions, one per Azure region
- Azure Traffic Manager as the front-end to route users to the nearest location
- Bonus: A distributed Cosmos DB database replicated to the same regions

You don't have to write code for a real application: any HTTP function will do for now.

## Serverless stream processing

Serverless is not only about HTTP! It works even better for messaging workloads. Pick one of the messaging services in Azure: Storage Queues, Service Bus, Event Hubs. Implement a queue processing pipeline:

- The first queue get messages with sentences (e.g., tweets)
- The first processor splits then into words and sends to the second queue
- The second processor find all hashtags, sends them forward, and throws away all the rest
- The fourth processor saves them to the storage

Bonus point: if you are familiar with Azure Stream Analytics, add it to the mix.

## Play with Logic Apps

Serverless Azure is not only about Functions! Logic Apps is another excellent service with numerous connectors to other services. If you ever used a Logic App, try re-implementing it with infrastructure as code.

Note: the level of support for Logic Apps varies between the tools. Be ready for some bumps: but that's another way to learn.

## Finish the previous labs

Didn't have enough time to complete the tasks from the previous sessions? You may do so now.
