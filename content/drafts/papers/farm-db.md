## Fast General Distributed Transactions with Opacity using Global Time

https://arxiv.org/pdf/2006.14346v1.pdf

Slides from the previous paper (FaRM v1): https://www.microsoft.com/en-us/research/wp-content/uploads/2014/02/aleksandar-dragojevic.pdf
V1 paper itself: https://www.usenix.org/system/files/conference/nsdi14/nsdi14-paper-dragojevic.pdf
Although it's less fascinating, e.g. because of no harcore clock sync usage.

A fascinating but a very hard to fully understand paper about in-memory distributed database with strong serializable transactions called FaRM. They use it for the A1 graph database in Bing. The idea is to provide a programming model so that a application developer could write code ~as if the whole data set was in local memory of a single large machine.

They use syncronized clocks but much more precise than Spanner and without atomic clock.

If I were to write a review, I should probably focus on Figure 3:  FaRMv2 commit protocol (currently page 8). Start with a single machine with a graph in-memory. How do we make transactions there? Read A, read B, lock A, check that B hasn't changed, write A.

Then start introducing problems. What if the graph doesn't fit into a single machine? A cluster. The same protocol could work but there's no time. Well, FaRM knows how to solve it.

Plug RDMA (remote direct memory access).

What if the machine crashes? Primary-backup model.

And then pile on other problems but don't really explain solutions (they are hard). Give some perf numbers at the end.

### Abstract

Transactions can simplify distributed applications by hiding data distribution, concur-rency, and failures from the application developer. Ideally the developer would see the ab-straction of a single large machine that runs transactions sequentially and never fails. Thisrequires the transactional subsystem to provideopacity(strict serializability for both commit-ted and aborted transactions), as well as transparent fault tolerance with high availability.As even the best abstractions are unlikely to be used if they perform poorly, the system mustalso provide high performance.Existing distributed transactional designs either weaken this abstraction or are not de-signed for the best performance within a data center. This paper extends the design of FaRM— which provides strict serializability only for committed transactions — to provide opac-ity while maintaining FaRM’s high throughput, low latency, and high availability within amodern data center. It uses timestamp ordering based on real time with clocks synchronizedto within tens of microseconds across a cluster, and a failover protocol to ensure correctnessacross clock master failures. FaRM with opacity can commit 5.4 million neworder transactionsper second when running the TPC-C transaction mix on 90 machines with 3-way replication.

## A1: A Distributed In-Memory Graph Database

https://arxiv.org/pdf/2004.05712.pdf

Transactions in a distributed systemfrees up application developers from worrying about com-plex problems like atomicity, consistency and concurrencycontrol, and instead allows them to focus on core businessproblems