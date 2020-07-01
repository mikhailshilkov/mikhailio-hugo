## Socrates: The New SQL Server in the Cloud

https://www.microsoft.com/en-us/research/uploads/prod/2019/05/socrates.pdf

the expectation is that a database runs in the cloudat least as well as (if not better) than on premise. Specifically,customers expect a “database-as-a-service” to be highly avail-able (e.g., 99.999% availability), support large databases (e.g.,a 100TB OLTP database), and be highly performant

This issue does not arise in on-premise database deploymentsbecause these deployments typically make use of special, ex-pensive hardware for high availability (such as storage areanetworks or SANs); hardware which is not available in thecloud. Furthermore, on-premise deployments control thesoftware update cycles and carefully plan downtimes; thisplanning is typically not possible in the cloud.

One idea is to decom-pose the functionality of a database management system anddeploy the compute services (e.g., transaction processing)and storage services (e.g., checkpointing and recovery) in-dependently. The first commercial system that adopted thisidea is Amazon Aurora [20].



