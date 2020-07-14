## Ripple: A Practical Declarative Programming Framework for Serverless Compute (Jan 2020)

https://arxiv.org/pdf/2001.00222.pdf

They create a mini "language" to define computation problems with split, combine, top, match, map, sort, partition, run to describe computations. Examples: visual border identification (k-means), protein sequence analysis, DNA compression. They then exprerementally find an optimal layout of this computation on multiple Lambdas to meet the deadline of the job and minimize cost.

The evaluation shows it performs great.

There is source code available but I miss the tech details in the paper to make it feel tangible and understandable.

## Starling: A Scalable Query Engine on Cloud Functions

https://arxiv.org/pdf/1911.11727.pdf
https://dlnext.acm.org/doi/pdf/10.1145/3318464.3380609 (a shorter version)

Analytics query on serverless compute. You have a bunch of data in S3 (CSV or other formats) and want to run infrequent queries on them. Instead of Athena or Reshift with static cost, you could use AWS Lambda. Quite well written. 

Potentially, two review topics:

1. Shuffle. How to efficiently implement reduce phase of map-reduce (or sorting) with lambdas and S3, when there is not direct communication, and avoid the cost of N*N complexity. In combination with the other paper: "Shuffling, Fast and Slow: Scalable Analytics  on Serverless Infrastructure" https://www.usenix.org/system/files/nsdi19-pu.pdf

2. Strangler mitigation when reading/writing to/from S3. S3 is sometimes slow, which drives up your high percentile. They have a smart detection of stranglers and they hit a second request. A nice touch: you save money by doing that because you save on AWS Lambda duration.

## Lambada: Interactive Data Analyticson Cold Data using Serverless Cloud Infrastructure

https://arxiv.org/pdf/1912.00937.pdf

Super similar to Starling and released at the same time. Serverless analytics on cold data. Shuffle in S3 with multiple layers.