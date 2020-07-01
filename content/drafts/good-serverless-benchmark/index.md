---
title: "Good Serverless Benchmark"
date: 2020-06-15
thumbnail: teaser.jpg
draft: true
tags: ["Serverless", "Paper review"]
description: 
ghissueid: 
---

### Beyond Microbenchmarks: The SPEC-RG Vision forA Comprehensive Serverless Benchmark

https://dl.acm.org/doi/pdf/10.1145/3375555.3384381

The performance trade-offs of these systems are not well-understood. Moreover, it is exactly the highlevel of abstraction and the opaqueness of the operational-side thatmake performance evaluation studies of serverless platforms challenging.

The core aim of serverless computing is to abstract away theoperational complexity of distributed systems. 

The lack of insight in the operational parts that enable lifecycle management by the cloud operator—further make it challenging to understand the key performance trade-offs of current platforms. 

Challenges specific to benchmarking the performance of these platforms:

1. Performance requirements. Instead of overheads of minutes, for user-facingfunctions in FaaS, the deployment, and execution overheadsare measured in milliseconds. The workloads are far more fine-grained in nature—leading tomore pressure on the scheduler’s performance.

2. System opaqueness. Serverless platforms are opaque bydesign, attempting to abstract away from the cloud user asmuch of the operational logic as possible. Despite the benefitsof this model, the higher level of abstraction impedes ourunderstanding of what and how internal and external factorsinfluence the performance and other characteristics.

3. System heterogeneity. The ecosystem consists of widelyheterogeneous systems, which have different approaches tohow functions are built, deployed, scaled, upgraded, and ex-ecuted.

4. Complex ecosystems. Serverless platforms are, in mostcases, not intended as standalone systems. Instead, they pro-vide deep integrations with other cloud services, such asintegrations with event sources. To comprehensively evalu-ate a serverless platform, the performance and implicationsof these integrations need to be taken into account.

5. Multi-tenancy and dynamic deployments. The performance ofserverless platforms varies due to co-located workloadsand overall resource demands. These time- and location-related variances need to be considered by a sound serverlessbenchmarking methodology.

Existing FaaS-specificbenchmarks primarily focus on:

(1)Hardware resource microbenchmarking.
(2)Startup latency.
(3)Concurrency and elasticity.
(4)Trigger latency.

Scope of the serverless benchmark:

(1) Function runtime. The runtime performance of functions.

(2) Event propagation. The propagation time of events from their source to the FaaS platform can vary widely. The performance of the event propagation affects the overall function execution overhead.

(3) Cost. Serverless computing is inherently about balancing the cost-performance trade-off. For this reason, a comprehensive serverless benchmark should not only take performanceinto account, but also the associated cost.

(4) Software flow. A consequence of the granular nature of serverless functions is that larger numbers of functions are needed  to represent  a traditional  monolithic application. Each of these must be deployed, upgraded, and scaled on a regular basis, which requires the function code to be transferred in and across data centers. With serverless, the performance of orchestrating this software flow can significantly impact the overall performance of the function execution.

(5)Realistic Applications. It is non-trivial for cloud users to extrapolatethe results of microbenchmarks to the performance of their full applications. There is a need to go beyond microbenchmarks and evaluate realistic applications.

Design

Based on the observation that each FaaS platform and each cloud require mostly similar components but use significantly differentlogic for their inter-operation, the design starts from the principleofa small core to contain the main benchmark workflow, augmentedwith drivers for each platform.

Each benchmark is represented by a benchmark description, which consists of a workload, function deployment, and infrastructure description. Based on this description, first the infrastructure deployer uses the infrastructure description and the function definitions to configure the cloud infrastructure. Once the infrastructure is ready, the workload generator and driver pushes workload to the system according to the workload description. After the benchmark has been completed, the benchmark GC will ensure that the benchmark resources are pruned from the cloud environment. The monitoring & logging component collects metrics during a benchmark run. This component is also platform-specific, as the way monitoring data is stored and retrieved differs widely between platforms. Alongside, thecost calculatorretrieves and calculatesthe cost that has been incurred during the benchmark execution.Together the monitoring and cost data are post-processed by aresult processorand stored as the finalbenchmark results.

The field of serverless computing evolves rapidly, so—withoutupdates—benchmark results become outdated quickly. For this rea-son, we focus on the implementation of reproducibility and work-flow automation. This will allow us to routinely rerun the bench-mark and maintain an overview of up-to-date results.

Our goal is to make the benchmark, experiments, and results open-source.

As serverless computing becomes increasingly relevantfor data-intensive workloads—e.g., in graph processing and ob-ject storage—additional experiments targeting these kinds workloads will be needed. A benchmark will need to evaluate the interplay between the storage and execution platforms, andexplore how data-intensive serverless applications are designed.

=====================================================================

### FaaSdom: A Benchmark Suitefor Serverless Computing

https://arxiv.org/pdf/2006.03271.pdf

Despite its increasing popularity, not much is known re-garding the actual system performance achievable on thecurrently available serverless platforms.

ypical FaaS architecture. The main aspectsto benchmark are: performance of a worker (i.e., execu-tion speed of a function) and quality of the auto-scalingmechanism (e.g., allocation of new VMs, how to handleflash-crowds).

Despite the convenience of the approach, it is currently hardto decide on a specific FaaS provider based on criteria suchas performance, workload adaptability or costs.

Evaluation:

6.1  Call Latency. Measure  the  latency  (round-trip)  for all cloud  providers  and  corresponding  regions,  using  thefaas-netlatency benchmark. Note that this benchmark wasperformed from Bern, Switzerland, hence different resultsmight be achieved from different locations.

6.2  Cold Start

6.3  CPU-bound Benchmarks. This  benchmark  evaluates  how  CPU-bound  workloadsbehave  across  the  different  cloud  providers. 

Asexpected, every doubling of the allocated memory results inhalving the execution time,i.e., performance scales linearlywith allocated memory.

6.4  Throughput/Latency. To understand the saturation point of the deployed services,we rely onwrk2[54], a constant throughput/exact latencyHTTP-based benchmarking tool. We configure this bench-mark to issue function call invocations at increasingly highrates, from 10 up to 1,000 requests per second.

6.5  Pricing

Every cloud is different: compute model, supported runtime, billing, triggers.


TODO: describe their actual findings in a separate blog post, maybe.