---
title: What Is a Cold Start?
date: 2019-02-14
thumbnail: dictionary_thumb.jpg
description: Definition, mechanics and the reasons they exist
tags: ["Cold Starts"]
nofeed: true
---

Auto-provisioning and auto-scalability are the killer features of Function-as-a-Service cloud offerings. No management required, cloud providers deliver infrastructure based on the actual incoming load.

One drawback of such dynamic provisioning is a phenomenon called **cold start**. Essentially, applications that haven't been used for a while take longer to startup and to handle the first request.

Cloud providers keep a bunch of generic unspecialized workers in stock. Whenever a serverless application needs to scale up, be it from 0 to 1 instance, or from N to N+1 instances likewise, the runtime picks one of the spare workers and configures it to serve the named application:

{{< figure src="coldstart.png" title="Handling a request while no instances exist yet" >}}

This procedure takes time, so the latency of the application event handling increases. To avoid doing this for every event, the specialized worker is kept intact for some period. When another event comes in, this worker will stay available to process it as soon as possible. This situation is a **warm start**:

{{< figure src="warmstart.png" title="Handling a request by reusing an existing instance" >}}

Thus, the cloud providers are trying to find the right balance between wasting resources to keep idle instances for too long and causing slowing down too many requests. 

Learn about the details: [Comparison of Cold Starts across AWS, Azure, and GCP](/serverless/coldstarts/big3/).