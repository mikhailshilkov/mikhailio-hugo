---
title: "The Emerging Landscape of Edge-Computing"
date: 2020-07-14
thumbnail: teaser.jpg
tags: ["Edge", "Cloud", "Paper Review"]
description: "What is edge computing, and what are the primary use cases in the world today? (a paper review)"
ghissueid: 42
---

While I have a good understanding of what cloud computing is, "edge computing" has remained vague. What *is* edge computing, and what are the primary use cases in the world today?

As with other buzzwords, it's hard to give a single definite answer. Anyway, I found a paper that presents a consistent view of the topic. [The Emerging Landscape of Edge-Computing](https://www.microsoft.com/en-us/research/uploads/prod/2020/02/GetMobile__Edge_BW.pdf) summarizes the advantages, use cases, and challenges of edge computing in 2020.

It turns out, I participated in edge computing projects in the past!

## Consumer Edge: The Vision That Never Happened

The term **Edge Computing** was introduced more than a decade ago. The cloud was still in infancy: a handful of providers were at the start of the global IT crusade.

At the same time, mobile devices were all the rage. Smartphones have changed the world, and wearables were around the corner. Still, mobile devices had minimal computing power, so they were incapable of advanced tasks like fast image processing or machine learning inference.

Cloud has been rapidly increasing its capacity and introducing specialized hardware like tensor-processing units (TPUs). However, the latency between a mobile device and a cloud data center would be too high (100s of milliseconds) for most interactive applications.

The edge computing was born to fix this problem and provide nearby powerful machines accessible from lightweight devices over a low-latency, high-bandwidth network. A stark example would be a wearable device like Google Glass that overlays real-time guidance on a heads-up display by streaming video to a TPU in a nearby edge location.

{{< featured >}}
{{< figure src="cyber-foraging.png" title="Wearable devices migrating between edge locations for real-life experience augmentation" >}}
{{< /featured >}}

This vision has been described as **cyber foraging**. Edge computing research focused on enabling interactive applications on mobile devices. Future technology had to acquire several crucial capabilities:

- **Multi-tenant compute** to serve legions of consumers on the same hardware.
- **Millisecond-level latency** required for interactive applications.
- **Migration** from one edge location to the other as the devices move through a physical environment.

These were the goals five to ten years ago. Meanwhile, mobile devices grew powerful: A13 Bionic was unthinkable during the era of the first smartphones. Besides, cloud regions spread all over the planet and integrated into the global network. Today, sub-100ms consumer-to-cloud latencies are very common.

The authors of "The Emerging Landscape" argue that the cyber foraging vision hasn't been realized en-mass. Instead, the industry picked up edge computing for a different purpose. None of the three goals above are relevant for the actual edge applications, while new challenges arose.

## Industrial Edge: Reality of Today

It turns out that edge computing's ideas found relevance in business and industrial applications, for example:

1. **Industrial plants** deploy numerous sensors that continuously monitor mechanical equipment, worker safety, and production workflows to ensure issues are spotted and mitigated promptly. They use edge computing because the internet connectivity at remote industrial sites may be unreliable and low-bandwidth.

2. **Railway industry** uses high-definition cameras along the track to detect cracks in train wheels.  Cracks can cause the wheel to break and derail the entire train. The bandwidth and compute demand for this case is very dynamic: when a train passes a camera, the system generates GBs of data over several seconds. The analysis must be completed reliably within minutes to avoid severe casualties.

3. **Cities** have deployed millions of cameras and sensors: at intersections, in parking lots, and in construction zones. The same cameras can be used to control the traffic flow across the city and alert drivers to avoid fatal accidents. Since many scenarios are centered around safety, continuous operation is critical and must not depend on the global network.

4. **Restaurants** run prediction platforms to forecast when more food needs to be cooked. They use sensors to predict the number of customers entering the store.

Many of today’s edge deployments are best described as **edge-sites** for long-running applications, such as industrial sensing and video analytics. These sites are single-tenant, and they rarely (if ever) host transient jobs for mobile devices.

{{< featured >}}
{{< figure src="edge-site.png" title="Typical edge-site deployment in enterprise environments" >}}
{{< /featured >}}

Somewhat surprisingly, these data-processing applications are not bound by the strict latency requirements of cyber-foraging applications such as cognitive assistance. The cloud is close enough, but it has other issues.

## Why Not Cloud?

With such relatively high latency tolerance, and the high availability, scalability, and low-cost  computation offered by the cloud, why do these applications run on the edge rather than offloading to the cloud?

It turns out there are two main reasons:

1. **Bandwidth to data centers is insufficient**. The volume of generated data is immense, but the existing uplink internet channels are orders of magnitude slower than required. Furthermore, bandwidth needs may be intermittent and dynamic, causing huge spikes at the peaks.

2. **Connectivity is unreliable**. When coupled with the mission-critical nature of the applications, even brief connectivity outages have a detrimental impact on safety and financial viability, so any downtime is unacceptable.

Therefore, the dominant reasons for adopting edge computing are the need to tolerate cloud outages and the scarcity of network bandwidth.

## Is This Just Plain Old On-Prem?

Why do we call these deployments an edge? Isn't this plain old on-premises hosting?

They are not. The edge-sites are still connected to the cloud for processing outside the critical path.

The  cloud  is a large pool of well-maintained resources with lower management overhead imposed on the user. It provides better resource efficiency by multiplexing across many users, high scalability, high availability, and low cost. Thus, it is preferable to utilize the cloud whenever possible.

Edge sites are a burden. The users happily offload the workloads to the cloud whenever feasible. But many scenarios are blocked because of connectivity issues and the criticality of applications.

## Edge-Cloud Collaboration

As the edge and cloud are bound to coexist, they need to interact smoothly. A framework should enable developers to utilize both edge compute and cloud in multiple dimensions:

1. **Graceful adaptation** would allow applications to function optimally in the presence of disconnections, drops in bandwidth, or workload spikes. Adaptive applications can utilize the cloud when network conditions  permit but remain operational even in the face of network issues.

2. **Collaborative and application-aware orchestration**. It is common for multiple applications of a single enterprise to share the edge cluster, e.g., run both fridge monitoring and customer tracking applications in a retail store. Not all apps have equal priority and criticality, but they share some degree of trust.

3. **Test and verification**.  Debugging and testing an edge-site application is extremely difficult. As edge-site conditions can be challenging to recreate before deployment, incorrect behavior can arise from unanticipated interactions among adaptation strategies.

## Conclusion

[The Emerging Landscape of Edge-Computing](https://www.microsoft.com/en-us/research/uploads/prod/2020/02/GetMobile__Edge_BW.pdf) presents several use cases for today's edge deployments. These applications are not end-user interactive mobile applications opportunistically using the edge as originally envisioned.

Instead, they are geographically constrained, mission-critical, industrial or enterprise applications. They rely primarily on edge computing and opportunistically use the cloud. Across these scenarios, network bandwidth and reliability drive the use of edge computing, especially given the high volume of generated data, limited and intermittent connectivity to the cloud.
