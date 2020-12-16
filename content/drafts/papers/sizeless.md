## Sizeless: Predicting the optimal size of serverless functions

https://arxiv.org/pdf/2010.15162v1.pdf

The only resource management taskthat developers are still in charge of is resource sizing, that is, se-lecting how much resources are allocated to each worker instance. However, due to the challenging nature of resource sizing, devel-opers often neglect it despite its significant cost and performancebenefits.

In this paper, we introduceSizeless— an approach to predict theoptimal resource size of a serverless function using monitoring datafrom a single resource size.

As our approach requires only produc-tion monitoring data, developers no longer need to implement andmaintain representative performance tests.

Furthermore, it allowscloud providers, which cannot engage in testing the performanceof user functions, to implement resource sizing on a platform leveland automate the last resource management task associated withserverless functions.

### Introduction

Resource sizing is thetask of selecting how much CPU, memory, I/O bandwidth, etc. areallocated to a worker instance. sizing of serverless functions as a configurablememory size, where other resources such as CPU, network, or I/Oare scaled accordingly. A recent survey revealed that 47% of the serverlessfunctions in production have the default memory size, indicatingthat developers often neglect resource sizing.

memory size optimization of serverless functions are the AWSpower tuning tool [9] 

In this paper, we introduceSizeless— an approach to predict theoptimal memory size of serverless functions based on monitoringdata for a single memory size. Towards this goal, we first build aserverless function generator capable of generating a large numberof synthetic serverless functions by randomly combining repre-sentative function segments. Next, we measure the execution timeand resource consumption metrics of 2 000 synthetic functions for six different memory sizes on a public cloud. Based on the result-ing dataset, we construct a multi-target regression model that canpredict the execution time of a serverless function for previouslyunseen memory sizes based on the execution time and resourceconsumption metrics for a single memory size.

To evaluate if our model — which wastrained on data from synthetic functions — can be transferred torealistic serverless functions, we apply it to the serverless airlineapplication [30,40], a representative production-grade serverlessapplication. Here,Sizelesspredicts the execution time of all func-tions for previously unseen memory sizes with a median predictionaccuracy of93.1%. UsingSizelessto optimize the memory size of theserverless airline booking application results in an average speedupof 16.7% while simultaneously decreasing average costs by 2.5%

### Motivating Example

The relationship between the memory size of a serverless function,the cost per function execution, and the function execution time is quite counter-intuitive. A common assumption is that a higher memory size results in a faster execution at a higher price, since the allocated CPU, I/O, network, etc. capacity scales linearly with the selected memory size [13,42]. However, this is not the case due tothe pricing scheme most cloud providers employ, where the cost ofan execution is calculated based on the consumed GB/s of memory,that is, the execution time multiplied by memory size

Based on these results, we can conclude that: i) the impact ofmemory size configurations on execution time differs from func-tion to function, ii) predicting the execution time for a memorysize is challenging, as even two seemingly CPU-intensive and twonetwork-intensive functions behave differently, and iii) selecting anappropriate memory size is important as it can drastically improveperformance at a similar or reduced cost.

### APPROACH

We propose an approach to predict the optimal memory size ofserverless functions based on monitoring data collected for a singlememory size. During the offline phase, theSynthetic Function Generatorcreatesmany synthetic serverless functions, which are then instrumentedwith ourResource Consumption Monitoring. During theDatasetGeneration, we run performance tests to obtain the resource con-sumption metrics and execution times for all memory sizes of thou-sands of synthetic serverless functions. By applyingMulti-targetRegression Modelingto the resulting dataset, we generate a perfor-mance model that can predict the execution time for memory sizes of a real function based on monitoring data for a single memorysize, which can be obtained during production.

Our implementa-tion of the proposed approach is limited to AWS Lambda and thelanguage Node.js as they are by far the most common platformand programming language for serverless functions

#### Synthetic function generator

Therefore, we propose to generate synthetic server-less functions by randomly combining representative function seg-ments. Each function segment represents the smallest granularity ofcommon tasks in serverless functions.

Weimplemented the following sixteen function segments: FloatingPointOperations, MatrixMultiplications, ImageCompress, ImageResizes, ImageRotate, JSON2YAML, Compression, Decompression, DynamoDBRead, DynamoDBWrite, FileRead, FileWrite, S3Read, S3Write, S3Stream, Sleep.

The function generator randomly combines these func-tion segments and wraps them in a Lambda handler. Forthe dataset generation, we configured the function generator to useup to four function segments.

#### Resource consumption monitoring

Lambdacurrently does not support the monitoring of resource consumptionmetrics out of the box. we implement a custom resource consumption mon-itoring to cover a wide variety of resource consumption metrics.

Metric IDMetric NameMetric SourceM1Execution timeprocess.hrtime()M2User CPU timeprocess.cpuUsage()M3System CPU timeprocess.cpuUsage()M4Vol Context Switchesprocess.resourceUsage()M5Invol Context Switchesprocess.resourceUsage()M6File system readsprocess.resourceUsage()M7File system writesprocess.resourceUsage()M8Resident set sizeprocess.memoryUsage()M9Max resident set sizeprocess.resourceUsage()M10Total heapprocess.memoryUsage()M11Heap usedprocess.memoryUsage()M12Physical heapv8.getHeapStatistics()M13Available heapv8.getHeapStatistics()M14Heap limitv8.getHeapStatistics()M15Allocated memoryv8.getHeapStatistics()M16External memoryprocess.memoryUsage()M17Bytecode metadatav8.getHeapCodeStatistics()M18Bytes received/proc/net/dev/M19Bytes transmitted/proc/net/dev/M20Packages received/proc/net/dev/M21Packages transmitted/proc/net/dev/M22Min event loop lagperf_hooksM23Max event loop lagperf_hooksM24Mean event loop lagperf_hooksM25Std event loop lagperf_hooks

However, we consider the collected metricssufficient to characterize the resource consumption of serverlessfunctions.

#### Dataset generation

we used the measurement harness to measure the exe-cution time and resource consumption metrics for 2 000 functionsacross six different memory sizes (128MB, 256MB, 512MB, 1024MB,2048MB, 3008MB), including the smallest and largest available mem-ory sizes on AWS for ten minutes each at 30 requests per second.This amounts to 12 000 performance measurements, 120 000 min-utes of experiment time, 360 000 Lambda executions, and roughly$2 000 worth of Lambda compute time. 

The resulting dataset ispublicly available via CodeOcean(https://doi.org/10.24433/CO.9626622.v1)

#### Multi-target regression modeling

ML

### EVALUATION

RQ1:How many and which metrics need to be monitored to accu-rately predict the response time of serverless functions for differentmemory sizes?

The sequential for-ward feature selection added the these six metrics in the followingorder: (1) user CPU time, (2) voluntary context switches, (3) heapused, (4) network packages transmitted, (5) system CPU time.

We can see that initially, it selectsmetrics that describe the CPU usage of the function (user CPU timeand voluntary context switches) and then adds information abouthow much memory the function consumes (heap used). Next, itadds information about the network usage of the function (networkpackages transmitted). Afterwards, adding another CPU-based met-ric, system CPU time (the time spent running code in the operatingsystem kernel on behalf of the function), further increases the pre-diction performance. 

RQ3:Can our model, that was trained on a synthetic dataset, accu-rately predict the execution time of realistic serverless functions?

We evaluate the prediction accuracy of a model,that was trained on the synthetic dataset, for the serverless airlinebooking application, a representative, production-grade serverlessapplication The serverless airline booking application implements the flightbooking aspect of an airline. Customers can search for flights, bookflights, pay using a credit card, and earn loyalty points with eachbooking.

Overall, our approach has a meanprediction accuracy of 89.8%, distorted by the outlier of 68.9% predic-tion error for theCollectPaymentfunction at 128MB, and overalla median prediction accuracy of 93.1% To summarize, after training on a synthetic dataset, our approachwas able to accurately predict the execution time of previously un-seen, realistic serverless functions for all memory sizes based onmonitoring data for a single memory size.

RQ4:Are the execution time predictions provided by our approachsufficient to optimize the memory size of serverless functions?

After the execution time predictions are generated, the predictedexecution cost can be calculated based on the pricing model of thecloud provider. A common approach to determine asingle, optimal solution for multi-objective optimization problems isto define a tradeoff factor that combines the objectives into a singlescore  Our approach isable to select the optimal memory size for six out of eight functions.Using the memory sizes selected by our approach results in anaverage execution time decrease of 16.7% while simultaneouslydecreasing the mean execution cost by 2.5%.

This shows that our approach can be utilized by developers to se-lect a cost and performance optimal memory size. Cloud providerscan build upon this approach to provide memory size recommen-dations for user functions based on passive monitoring data.

### CONCLUSION

Serverless functions automate resource provisioning, deployment,instance management, and auto-scaling. The last resource manage-ment task that developers are still in charge of is resource sizing, i.e.,selecting how much resources are allocated to each worker instance.In this paper, we introducedSizeless, an approach to predict theoptimal resource size of serverless functions using monitoring dataof a single memory size. First, we introduced a synthetic functiongenerator and a resource consumption monitoring approach. Usingthese, we generated a large dataset on how functions with differentresource consumption behavior scale with increasing memory sizes.Based on this dataset, we trained a multi-target regression modelcapable of predicting the execution time of a serverless functionfor all memory sizes based on monitoring data for a single memorysize. These predictions then enable the automated optimization of aserverless function’s memory size. By automating the memory sizeoptimization for serverless functions, our approach removes thelast resource management task that developers still need to dealwith in serverless functions and thus makes serverless functionstruly serverless. In our evaluation,Sizelesswas able to predict theexecution time of the serverless functions of a realistic serverless
application with a median prediction accuracy of 93.1%. UsingSize-lessto optimize the memory size of this application resulted in anaverage speedup of 16.7% while simultaneously decreasing averagecosts by 2.5%.