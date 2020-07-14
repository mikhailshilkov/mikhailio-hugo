## LogPlayer: Fault-tolerant Exactly-once Delivery using gRPCAsynchronous Streaming

https://arxiv.org/pdf/1911.11286.pdf

Tags: Kafka, TLA+, Flink

ABSTRACT

In this paper, we present the design of our LogPlayer that is acomponent responsible for fault-tolerant delivery of transactional mutations recorded on a WAL (write-ahead log) to the backend storage shards. Log-Player relies on gRPC for asynchronous streaming. However, thedesign provided in this paper can be used with other asynchronousstreaming platforms. We model check the correctness of LogPlayerby TLA+. In particular, our TLA+ specification shows that LogPlayerguarantees in-order exactly-once delivery of WAL entries to thestorage shards, even in the presence of shards or LogPlayer failures.Our experiments show LogPlayer is capable of efficient deliverywith sub-millisecond latency, and it is significantly more efficientthan Apache Kafka for designing a WAL system with exactly-onceguarantee

CONCLUSION

In this paper, we presented the design of LogPlayer and our ex-perience in using gRPC asynchronous streaming for deliveringtransactional mutations written to a log to backend storage shards.We model checked the correctness of LogPlayer using TLA+. Specif-ically, we proved LogPlayer is masking fault-tolerant for satisfyingin-order exactly-once delivery of the log entries to the storageshards. TLA+ helped us find several bugs in our initial design thatare fixed in the algorithms provided in this paper. We explained how LogPlayer can be configured with LogStore for a distributeddatabase architecture. Our experimental results with the C++ imple-mentation of the LogPlayer shows our design with gRPC asynchro-nous streaming provides efficient delivery of transactions to thestorage shards. In all of our experiments, the median and averageLogPlayer delay remained less than 1 millisecond. We showed thatour system is significantly more efficient than existing streamingplatforms such as Apache Kafka for designing a WAL system withthe exactly-once guarantee.