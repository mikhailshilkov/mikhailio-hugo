## Ripple: A Practical Declarative Programming Framework for Serverless Compute (Jan 2020)

https://arxiv.org/pdf/2001.00222.pdf

They create a mini "language" to define computation problems with split, combine, top, match, map, sort, partition, run to describe computations. Examples: visual border identification (k-means), protein sequence analysis, DNA compression. They then exprerementally find an optimal layout of this computation on multiple Lambdas to meet the deadline of the job and minimize cost.

The evaluation shows it performs great.

There is source code available but I miss the tech details in the paper to make it feel tangible and understandable.