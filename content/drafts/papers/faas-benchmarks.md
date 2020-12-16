## The State of Research on Function-as-a-Service Performance Evaluation:A Multivocal Literature Review (2020)

https://arxiv.org/pdf/2004.03276.pdf

A multivocal literature review (MLR) covering 112 studies from academic (51) and grey literature (61) that report performance measurements of FaaS offerings of different platforms. We also provide methodological recommendations aimed at future FaaS performance evaluation studies.

Benchmark types:
- Micro-Benchmarks (an artificial thing focused on one aspect)
- Application-Benchmarks (multi-component, closer to real life)

Study design: a great detailed description of how they were searching for literature sources.

### Study results

#### Studied Platforms 

88% of all our selectedstudies perform experiments on AWS Lambda, followed byAzure (26%), Google (23%), self-hosted platforms (14%),IBM (13%), and CloudFlare (4%).  In comparison to other surveys, our overall results for percentage by provider closely (±5%) match theself-reported experience per cloud provider in a 2018 FaaS survey.

#### Evaluated Benchmark Types

More focused on microbenchmarks, but quite some are application studies. App studies are mostly focused on a single platform.

#### Evaluated Micro-Benchmarks

CPU is by far the most evaluated micro-benchmark characteristic, used by 40% of all studies. TheOtherscategory mainly consists of platform overhead and work-load concurrency evaluated through micro-benchmarks.

####  Evaluated General Characteristics

General performance characteristics focus onparticularly relevant aspects of FaaS and only few studiesaim towards reverse-engineering hosted platforms. Elas-ticity and automatic scalability have been identified asthe most significant advantage of using FaaS in a previ-ous survey [2], which justifies the widespread evaluation ofconcurrency behavior. Given the importance of this char-acteristic, we argue that concurrent workloads should bean inherent part of all FaaS performance evaluations goingforward (going beyond the 50% of studies observed in ourcorpus).  Container start-up latency has been identifiedas one of the major challenges for using FaaS services inprior work [2] and motivates a large body of work relatedto quantifying platform overheads.

#### Used Platform Configurations

Language: mostly Node and Python.
Triggers: HTTP triggers are by farthe most commonly evaluated type of trigger, and are usedby 57% of all studies. 
Used External Services: Almost none (beyong API Gateway)

#### Reproducibility (great topic!)

see the  "Methodological principles for reproducible perfor-mance evaluation in cloud computing" paper

- Repeated Experiments
- Workload and Configuration Coverage
- Experimental Setup Description
- Open Access Artifact
- Probabilistic Result Description
- Statistical Evaluation
- Measurement Units
- Cost

Basically, most studies suck on all of them (except measurement units)

### Implications and Gaps in Literature

They give ideas for future studies.




## Benchmarking Elasticity of FaaS Platforms as a Foundation forObjective-driven Design of Serverless Applications (2020)

https://dl.acm.org/doi/pdf/10.1145/3341105.3373948

They create a CPU-bound Function (checking if a number is prime based on theSieve of Eratosthenesalgorithm.)

The workload has 3 phases: P0 warmup (stable), P1 linear scaleup, P2 stable cooldown. Five variations (rps):
      P0    P1         P2
WL0    0    0+0.5∗t    15
WL1    0    0+1.0∗t     60
WL2    0    0+2.0∗t    120
WL3   60    60+0.5∗t   75
WL4   60    60+1.0∗t   120

They measure success rate, latency, throughput, cost, and host number and distribution. They deploy to AWS Lambda, Azure Functions, Google Cloud Functions, IBM Cloud Functions.

They then try to generalize the applicability of FaaS services to three real-world scenarios: web serving, exploratory data analysis, periodical batch processing.



## A lightweight design for serverless Function-as-a-Service

https://arxiv.org/ftp/arxiv/papers/2010/2010.07115.pdf

The paper "A lightweight design for serverless Function-as-a-Service" sounded ambitious but it wasn't exactly what I expected. 1/4

My summary:
- FaaS relies on Docker-like tech for isolation
- Let's benchmark Docker vs. WebAssembly
- WASM looks faster than Docker => FaaS should use WASM (when it's ready) 2/4

Well, maybe, except none of FaaS in AWS, Azure, GCP actually uses Docker. So, I don't quite buy the conclusion "We evaluated the use of WebAssembly runtimes in serverless FaaS". 3/4

Anyway, if you are curious about WASM runtimes, have a look at the benchmark results /fin
https://arxiv.org/ftp/arxiv/papers/2010/2010.07115.pdf

## Benchmarking parallelism in FaaS platforms

https://arxiv.org/pdf/2010.15032v2.pdf

Great paper comparing AWS Lambda, Azure Functions, and others in terms of scalabiliy. Need to review! A good further reading: https://d1.awsstatic.com/whitepapers/Overview-AWS-Lambda-Security.pdf