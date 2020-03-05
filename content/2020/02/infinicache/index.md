---
title: "Paper review: InfiniCache&mdash;finding persistent state in ephemeral serverless functions"
date: 2020-02-25
thumbnail: teaser.png
tags: ["Serverless"]
description: ""
ghissueid: 34
---

"InfiniCache: Exploiting Ephemeral Serverless Functions to Build a Cost-Effective Memory Cache" by Ao Wang, et al. is a recently released paper which describe a prototype of a serverless distributed caching system sitting atop AWS Lambda.

While reading through the paper, I got fascinated by several techniques that they employed while implementing the system. Therefore, I decided to review the paper and highlight its most intriguing parts. My review is targeted at software and IT engineers working in the industry of cloud applications. I assume the reader has basic understanding of serverless cloud functions (Function-as-a-Service, FaaS) and their traditional use cases.

Let's start with a problem that InfiniCache aims to solve.

## I. State in Stateless Functions

Serverless functions are designed for stateless workloads. FaaS services use ephemeral compute instances to grow and shrink the capacity to adjust to variable request rate. New virtual machines or containers are assigned or disposed at arbitrary moments by the cloud provider.

Functions are extremely compelling for low-load usage scenarios. Executions are charged per actual duration, at 100 ms granularity. If your development or test environment only needs to run several times per day, it will cost you literally zero.

Cloud providers try to reuse compute instances for multiple subsequent requests. The price of bootstrapping new instances is too high to pay for every request. A warm instance would keep pre-loaded files in memory between requests to minimize the overhead and [cold start](/serverless/coldstarts) duration.

There seems to be a fundamental opportunity to exploit the keep-warm behavior further. Each function instance has up to several gigabytes of memory, while our executable cache might only consume several megabytes. Can we use this memory to persist useful state?

### In-memory Cache

The most straightforward way to use this capacity is to store reusable data between requests. If we need a piece of data from external storage, and that same piece used again and again, we could store it after the first load in a global in-memory hashmap. Think of a simple read-through cache backed by an external persistent data store. 

[Picture of an in-memory cache: cache+compute on the same box]

This approach is still quite limited in several ways:

- The total size of cache is up to 3GB (max size of AWS Lambda), which might not be enough for large number of objects or large objects.
- Any parallel request may be processed by a different instance of the same AWS Lambda. The second instance will have to load the data from the data store once again.

[Picture of two instances: one with cache, one without, handling two requests]

This means that each instance has to store its own copy of cached data, which reduces the overall efficiency. Also, cache invalidation might get tricky in this case, especially because each instance has its own, highly unpredictable lifetime.

### Distributed Cache

The previous scenario described a local cache that is co-located with data processing logic. Can we move the cache out of the currently invoked instance, distribute it among many other instances, and have multiple lambdas caching different portions of the data set? This move would help both with the cache size and duplication issues.

[Picture of an app node doing the app thing talking to distributed set of caches]

The idea is to create a Distributed Cache as a Service, with design goals friendly to the serverless mindset:

- Low management overhead
- Scalability to hundreds or thousands of nodes
- Pay per request

The biggest potential upside is related to the cost structure. The cache capacity is billed only when a request needs an object. Such a pay-per-request model significantly differentiates against conventional cloud storage or cache services, which typically charge for memory capacity on an hourly basis whether the cached objects are accessed or not.

### Challenges

However, once again, serverless functions were not designed for stateful use cases. Utilizing the memory of cloud functions for object caching introduces non-trivial challenges due to the limitations and constraints of serverless computing platforms. The following list is specific to AWS Lambda, but other providers have very similar setups.

- Limited resource capacity: (mostly) 1 CPU, up to several GB of memory, and limited network bandwidth.
- Providers may reclaim a function and its memory at any time, creating a risk of loss of the cached data.
- Each Lambda function can run at most 900 seconds (15 minutes).
- Strict network communication constraints: Lambda only allows outbound TCP network connections and bans inbound connections and UDP traffic, meaning a Lambda function cannot be used to implement a server.
- The lack of quality-of-service control. As a result, functions suffer from straggler issues, when response duration distributions have long tails.
- Lambda functions are hosted at EC2 Virtual Machines (VMs). A single VM can host one or more functions. AWS provisions functions on the smallest possible number of VMs using a greedy binpacking heuristic. This could cause severe network bandwidth contention if multiple network-intensive Lambda functions get allocated on the same host VM.
- Executions are billed per 100 ms, even if a request only takes 5 or 10 ms.
- No concurrent invocations are allowed, so the same instance can't handle multiple requests at the same time.
- There is a non-trivial invocation latency on top of any response processing time.

Honestly, that's a large list of pitfalls. Nonetheless, InfiniCache crafts a careful combination of choosing the best use case, working around some issues, and haching straight through the others.

### Large Object Caching

Traditional distributed cache products aren't great when it coming to caching large objects (megabytes and larger):

- They are access less often, while consuming large space in RAM
- Large objects occupy a large amount of memory and would cause evictions of many small objects that might be reused in the near future, thus hurting performance
- Large object requests typically consume significant network bandwidth resources, which mayinevitably affect the latencies of small objects.

Therefore, it's common not to cache large objects and retrieve them from the backing storage like S3 directly.

What is missing is a truly elastic cloud storage service model that charges tenants in a request driven mode instead of capacity usage, which the emerging serverless computing naturally enables.

## II. Infinicache.

The paper [XYZ](todo) presents a prototype of distributed cache running on top of AWS Lambda which is aimed at large object caching. They deploy a large fleet of Lambda functions, each storing a slice of data.

InfiniCache offers a virtually infinite (yet cheap) short-term capacity, which is advantageous for large object caching, since the tenants can invoke many cloud functions but have the provider pay the cost of function caching.

The authors employ several smart techniques to work around the limitations that I described above and make the caching performant and cost-efficient.

### Multiple Lambda functions

InfiniCache creates multiple AWS Lambdas, not instances of the same Lambda. Each Lambda effectively runs as a single instance that holds a slice of data.

Therefore, there is no dynamic scaling: the cache cluster is provisioned to the level of required capacity. This does not incur any significant fixed cost though: each Lambda is still charged per invocation, not for the number of deployments or active Lambdas.

[Picture of the clients and lambdas]

How do the clients know which lambda to invoke? Also, each lambda instance can only handle a single request at a time, how do the clients coordinate not to hit the same instance simultaneously.

That's why there is a proxy.

### Proxy

InfiniCache has a fixed component called Proxy. It's deployed on a large virtual machine and becomes the entry point for all clients. It then talks to lambdas via an internal protocol as I explain later.

[Picture of the clients, proxy, and lambdas]

The proxy is the server accepting requsts from client libraries.

The proxy takes care of remembering the locations in the Lambda pool where the blobs are cached.

There may be multiple proxies for large deployments. INFINICACHE’s client library determines the destination proxy (and therefore its backing Lambda pool) by using a consistent hashing-based load balancing approach.

### Backwards Connections

Making a single Lambda invocation for each cache request proves to be inefficient. Therefore, InfiniCache authors use two channels for proxy-to-lambda communications.

Invocations are used for activation and billed duration control only. The same invocation is potentially reused to serve multiple cache requests via a separate TCP channel.

Since AWS Lambda does  not  allow  inbound  TCP  or  UDP  connections,  each Lambda runtime establishes a TCP connection with its designated proxy server, the first time it is invoked. A Lambda node gets its proxy’s connection information via its invocation parameters.  The Lambda runtime then keeps the TCP connection established until reclaimed by the provider.

Here is a somewhat simplified explanation of the protocol:

1. At first, there is no active invocation of a given Lambda.
2. Whenever the proxy needs to retrieve a blob from a Lambda, it invokes the Lambda with a Ping message, passing the IP of the proxy in the request body.
3. The Lambda invocation is now activated but it does NOT return yet. Instead, it establishes a TCP connection to the proxy IP and sends a Pong message over that second channel.
4. The proxy accepts the TCP connection. Now it can send requests for blob data over that connection. It first the first request immediately.
5. The Lambda instance now serves the requests on the TCP connections.
6. Every billing cycle, the Lambda instance decides whether to keep the invocation alive and keep serving requests over the TCP connection, or to terminate the invocation.

> To maximize the use of each billing cycle and to avoid theoverhead of restarting Lambdas, INFINICACHE’s Lambda runtime uses a timeout scheme to control how long a Lambda function runs. When a Lambda node is invoked by a chunk request, a timer is triggered to limit the function’s executiontime.  The timeout is initially set to expire within the first billing cycle.
>  If no further chunk request arrives within the first billing cycle, the timerexpires and returns 2–10 ms (a short time buffer) before the 100 ms window ends.
> If more than one request can be served within the current billing cycle, the heuristic extends the timeout by onemore billing cycle, anticipating more incoming requests.
> The proxy issues a preflightmessage (PING) each time a chunk request is forwarded to the Lambda node. Upon receiving the preflight message, the Lambda runtime responds with a PONG message, delays thetimeout (by extending the timer long enough to serve theincoming request), and when the request has been served,adjusts the timer to align it with the ending of the currentbilling  cycle.

This clever workaround overcomes two limitations simultaneously: ensuring that parallel requests can be served by the single Lambda instance, both reusing the same memory cache, and adjusting to round-up pricing model.

### Instance sizes

AWS Lambda functions can be provisioned at a memory limit between 128 MB and 3 GB. The CPU cycles are proportional to the provisioned RAM size.

InfiniCache authors find larger instances beneficial. Even though they end up paying more for each invocation, they greatly benefit from improved performance, reduced latency variation, and lack of network contention.

> We find that using relatively bigger Lambda functions largely eliminates Lambda co-location. Lambda’s VM hosts have approximately 3 GB memory.  As such, if we use Lambda functions with ≥ 1.5GB memory, every VM host is occupied exclusively by a single Lambda function.

### Chunks and Erasure Coding

To serve large files with minimal latency, InfiniCache breaks each file down into several chunks. The proxy stores each chunk on a separate AWS Lambda and requests them in parallel. This allows to improve performance by utilizing the aggregated network bandwidth of multiple cloud functions in parallel.

On top of that, they use an approach called Erasure Coding. Some redundancy is introduced into each chunk, so that the full file could be recovered from a smaller subset of chunks. E.g. 10+2 coding means that the file is broken down into 12 chunks, but any 10 chunks are enough to restore the complete file. This helps fight high tail latencies: the slowest responses have less effect on the overall latency of the system. InfiniCache uses redundancy to handle tail latencies caused by straggling functions.

They compare several erasure coding schemes (10+0, 10+1, 10+2, etc.) and find that 10+1&mdash;requiring 10 chunks out of 11&mdash;looks like the best trade-off between latency and encoding overhead.

The non-redundant 10+0 encoding suffers from Lambda straggler issues, which outweighs the performance gained by fully eliminating the decoding overhead.

Interestingly, breaking down a file into chunks is moved out to the client library. Doing so in the proxy turns out to be too computation-heavy.

### Warm-ups and Backup

Any inactive instance of an AWS Lambda can be reclaimed by Amazon at any time. It's not possible to avoid this completely, but InfiniCache does two things to mitigate the issue and keep the data around for longer:

- They issue periodic warm-up requests to each Lambda to prolongue the instance lifespan;

- They duplicate data by creating a "backup" instance and a lightweight data backup mechanism i nwhich a cloud function periodically performs delta synchronization with a clone of itself to minimizethe chances that a reclaimed function causes a data loss.

Both warm-ups and backups largely contribute to the total cost of the solution, but the authors find this cost justified.

## III. Practical Evaluation

The authors implemented the prototype of InfiniCache and benchmarked it against several syntetic tests and a real-life workload of a production Docker registry. Below are some key numbers from their real-life workload comparison against an ElastiCache instance. Mind that the workload was selected to be a good match for InfiniCache properties (large objects with infrequent access).

### Cost

> By the end of hour 50, ElastiCache costs$518.4, whileINFINICACHEwithall objectscosts$20.52.Caching only large objects bigger than 10 MB leads to a costof$16.51forINFINICACHE.  INFINICACHE’s pay-per-useserverless substrate effectively brings down the total cost by96.8%with a cost effectiveness improvement of31×.  Bydisabling the backup option,INFINICACHEfurther lowersdown the cost to$5.41, which is96×cheaper than Elasti-Cache.

> Frequent small-object caching. Serverless computing platforms are not cost-effective under such workloads, because the high data trafficwill significantly increase the per-invocation cost and com-pletely outweigh the pay-per-use benefit. Figure 17 comparesthe hourly cost ofINFINICACHEwith ElastiCache, assumingthe cost models in §4.3 and configurations in §5.2. The hourlycost increases monotonically with the access rate, and even-tually overshoots ElastiCache when the access rate exceeds312 K requests per hour (86 requests per second).

### Availability

### Latency


## IV. Future Directions

### Service  Provider’s  Policy  Changes

The bevaior of Lambda instances is black box and changes over time. Service  providers may change their internal implementations and policies in response to systems like INFINICACHE. Systems like InfiniCache can be sensitive to this kind of changes. 

### Explicit Provisioning

The new feature recently launched by AWS Lambda, provisioned concurrency, pins warm Lambda functions in memory but without any availability guarantee (provisioned Lambdas may get reclaimed, and re-initialized periodically. But the reclamation frequency is low compared to non-provisioned Lambdas), and charges tenants hourly ($0.015 per GB per hour, no mat-ter whether the provisioned functions get invoked), which is similar to EC2 VMs' pricing model.  Nonetheless, it open sup research opportunities for new serverless-oriented cloud economics.

### Internal Implementation

Our findings also imply that modern datacenter management systems could potentially leverage such techniques to provide short-term (e.g., intermediate data) caching for data-intensive applications such as big data analytics. Serving as a white-box solution, datacenter operators can use global knowledge to optimize data availability and locality. We hope future work will build on ours to develop new storage frameworks that can more efficiently utilize ephemeral datacenter resources.