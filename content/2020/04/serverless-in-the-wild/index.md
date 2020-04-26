---
title: "Serverless in the Wild"
date: 2020-03-10
thumbnail: teaser.png
tags: ["Serverless", "Azure", "Azure Functions", "Paper review"]
description: "My review of the paper \"TODO\""
ghissueid: 35
---

## Functions and applications

Figure 1 shows the CDF of thenumber of functions per application (top curve). We observethat 54% of the applications only have one function, and 95%of the applications have at most 10 functions. About 0.04% ofthe applications have more than 100 functions, and a coupleof them have in excess of 2,000 functions.

The other two curves show the fraction of invocations, andfunctions corresponding to applications with up to a certainnumber of functions. For example, we see that 50% of theinvocations come from applications with at most 3 functions.


## Triggers and applications.

Figure 2 shows the fraction ofall functions, and all invocations, per type of trigger. HTTPis the most popular in both dimensions. Event triggers cor-respond to only 2.2% of the functions, but to 24.7% of theinvocations, due to their automated, and very high, invocationrates. Queue triggers also have proportionally more invoca-tions than functions (33.5% vs 15.2%). The opposite happenswith timer triggers. There are many functions triggered bytimers (15.6%), but they correspond to only 2% of the invo-cations, due to the relatively low rate they fire in: 95% of thetimer-triggered functions in our dataset were triggered at mostonce per minute, on average.

Figure 3 shows how applications combine functions withdifferent trigger types. In Figure 3(a), we show the applica-tions with at least one trigger of the given type. We find that64% of the applications have at least one HTTP trigger, and29% of the applications have at least one timer trigger. Asapplications can have multiple triggers, the fractions sum tomore than 100%. In Figure 3(b), we partition the applicationsby their combinations of triggers. 43% of the applications haveonlyHTTP triggers, and 13% of the apps haveonlytimer triggers. Combining the two tables, we find that 15.8%of the applications have timers and at least one other triggertype. For predicting invocations, as we discuss later, whiletimers are very predictable, 86% of the applications haveeither no timers or timers combined with other triggers.

## Invocation Patterns

We now look at dynamic function and application invocations.Figure 4 shows the volume of invocations per hour, across theentire platform, relative to the peak hourly load on July 18th.There are clear diurnal and weekly patterns (July 20th, 21st,27th, and 28thare weekend days), and a constant baseline ofroughly 50% of the invocations that does not show variation.Though we did not investigate this specifically, there can beseveral causes,e.g.a combination of human and machine-generated traffic, plain high-volume applications, or the over-lapping of callers in different time zones.Figure 5(a) shows the CDF of the average number of in-vocations per day, for both functions and applications. Theinvocations for an application are the sum of all invocationsof its functions. First, we observe that the number of invoca-tions per day varies by over 8 orders of magnitude for bothfunctions and applications, making the resources the providerhas to dedicate to each application also highly variable.The second observation with strong implications for re-source allocation is that the vast majority of applications andfunctions  are  invoked, on  average, very infrequently.  

The green- and yellow-shaded areas in the graph show, respec-tively, that 45% of the applications are invoked once per houror less on average, and 81% of the applications are invokedonce per minute or less on average. This suggests that thecost of keeping these applications warm, relative to their totalexecution (billable) time, can be prohibitively high.Figure 5(b) shows the other side of the workload skewness,by looking at the cumulative fraction of invocations due to themost popular functions and applications. The shaded areascorrespond to the same applications as in Figure 5(a). Theapplications in the orange-shaded area are the 18.6% mostpopular, those invoked on average at least once per minute.Together, they represent 99.6% of all function invocations.The invocation rates provide information on the averageinter-arrival time (IAT) of function and application invoca-tions, but not on the distribution of these IATs. If the nextinvocation time of a function can be predicted, the platformcan avoid cold starts by pre-warming the application rightbefore it is to be invoked, and save resources by shutting itdown right after execution.

## Function Execution Times

Another aspect of the workload is the function execution time,i.e.the time functions take to executeafter they are ready torun. In other words, these numbers do not include the coldstart times. Cold start times depend on the infrastructure to alarge extent, and have been characterized in other studies [36].

Figure 7 shows the distribution of average, minimum, andmaximum execution times of all function executions on July15th, 2019. The distributions for other days are similar. Thegraph also shows a very good log-normal fit (via MLE) tothe distribution of the averages, with log mean -0.38 andσ2.36. We observe that 50% of the functions execute for lessthan 1s on average, and 50% of the functions have maximumexecution time shorter than∼3s; 90% of the functions take atmost 60s, and 96% of functions take less than 60s on average.

The main implication is that the function execution timesare at the same order of magnitude as the cold start timesreported for major providers [36].This makes avoiding and/oroptimizing cold starts extremely important for the overallperformance of a FaaS offering.

Another interesting observation is that, overall, functions in this FaaS workload are very short compared to other cloudworkloads. For example, data from Azure [10] shows that63% of all VM allocations last longer than 15 minutes, andonly less than 8% of the VMs last less 5 minutes or less. Thisimplies that FaaS imposes much more stringent requirementson the provider to stand-up resources quickly.

## Memory Usage

We finally look at the memory demands of applications. Re-call that the application is the unit of memory allocation inAzure Functions. Figure 8 shows the memory demand dis-tribution, across all applications running on July 15th, 2019.We present three curves drawn from the memory data: 1stpercentile, average, and maximum allocated memory for theapplication. We also plot a reasonably good Burr distributionfit (with parametersc=11.652,k=0.221, andλ=107.083)for the average. Allocated memory is the amount of virtualmemory reserved for the application, and may not necessarilybe all resident in physical memory. Here, we use the 1stper-centile because there was a problem with the measurement ofthe minimum, which made that data not usable. Despite theshort duration of each function execution, applications tendto remain resident for longer. The distributions for other daysin the dataset are very similar.

Looking  at  the  distribution  of  the  maximum  allocatedmemory, 90% of the applications never consume more than400MB, and 50% of the applications allocate at most 170MB.Overall, there is a 4×variation in the first 90% of applica-tions, meaning that memory is an important factor in warmup,allocation, and keep-alive decisions for FaaS.

## Main Takeaways

From the point of view of cold starts and resource allocation,we now reiterate our three main observations. First, the vastmajority of functions execute on the order of a few seconds –75% of them have a maximum execution time of 10 seconds –so execution times are on the same order as the time it takes tostart functions cold. Thus, it is critical to reduce the number ofcold starts or make cold starts substantially faster. Eliminatinga cold start is the same as making it infinitely fast.Second, the vast majority of applications are invoked infre-quently – 81% of them average at most one invocation perminute. At the same time, less than 20% of the applicationsare responsible for 99.6% of all invocations. Thus, it is expen-sive, in terms of memory footprint, to keep the applicationsthat receive infrequent invocations resident at all times.Third, many applications show wide variability in theirIATs – 40% of them have a CV of their IATs higher than 1 – sothe task of predicting the next invocation can be challenging,especially for applications that are invoked infrequently.