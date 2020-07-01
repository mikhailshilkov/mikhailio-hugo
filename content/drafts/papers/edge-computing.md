## The Emerging Landscape of Edge-Computing.

https://www.microsoft.com/en-us/research/uploads/prod/2020/02/GetMobile__Edge_BW.pdf

## Intro

Edge  computing  is  a  trending  notion  introduced  a  decadeago as a new computing paradigm for interactive mobile ap-plications.  The initial vision of the edge was a multi-tenantresource that will be used opportunistically for low-latencymobile applications.  Despite that vision, we see in practicea different set of applications,  driven by large-scale enter-prises,  that  have  emerged  and  are  driving  real-world  edgedeployments  today.   In  these  applications,  the  edge  is  theprimary  place  of  storage  and  computation  and  if  networkconditions allow, the cloud is opportunistically used along-side. We show how these enterprise deployments are drivinginnovation in edge computing.  Enterprise-driven scenarioshave a different motivation for using the edge.   Instead oflatency, theprimary factorsare limited bandwidth and un-reliability of the network link to the cloud.  The enterprisedeployment layout is also unique: on-premise, single-tenantedges  with  shared,  redundant  outbound  links.   These  pre-viously unexplored characteristics of enterprise-driven edgescenarios open up a number of unique and exciting futureresearch challenges for our community.

The original case for edge computing arose from the obser-vation  that  interactive  applications  for  lightweight  devicescan benefit from accessing more powerful machines over alow-latency,  high-bandwidth  network.   Early  advocates  ofedge computing envisioned a world of mobile devices thataugmented their limited local resources by opportunisticallylaunching short-lived, low-latency jobs on nearby edge serv-ers [62].  For example, a cognitive-assistance application ona wearable computer could overlay realtime guidance on aheads-up display by streaming video to an inference modelrunning on a nearby tensor-processing unit (TPU). This vi-sion has been described ascyber foraging[60], and support-ing interactive applications on mobile devices has been thefocus of most academic and industry research on edge com-puting.   In  the  coming  years,  the  edge  will  likely  providecritical infrastructure for emerging wearable and robotic sys-tems.  However, the cyber-foraging metaphor, i.e., that of alightweight  computer  searching  for  nearby  resources  as  itmoves through an environment, does not accurately capturehow most practitioners are using edge computing today.

Many of today’s edge deployments are best described asedge-sitesfor long-running applications, such as industrialsensing and video analytics.  These sites are single tenant,and they rarely (if ever) host transient jobs for mobile de-vices. For example, a restaurant might use the edge to mon-itor  customer  arrivals  and  schedule  meal  preparation  [11],and an oil rig might process live video to identify safety haz-ards [17, 36].  Somewhat surprisingly, these data-processingapplications are not bound by the strict latency requirementsof cyber-foraging applications such as cognitive assistance(which must process video frames in 10ms or less). 

 With such relatively highlatency tolerance, and the high availability, scalability, andlow-cost  computation  offered  by  the  cloud,  why  do  theseapplications  run  on  the  edge  rather  than  offloading  to  thecloud?We observe that the dominant reasons for adopting edgecomputing are the need to tolerate cloud outages and thescarcity of network bandwidth. First, because today’s edgeapplications are mission- and safety-critical, any downtimeis unacceptable.

 ## Use Cases

1) Business Intelligence. They builtan in-restaurant prediction platform that relies on edge com-puting.   They use video analytics and machine learning topredict the number of customers and cars entering the store.In this case, making a reliable prediction was the stated mainmotivation for using the edge. If the prediction fails (due todisconnection) or takes too long (due to a large amount ofdata transferred), the customer is left waiting.

Edge  computing  is  preferred  for  these  business  scenar-ios as it avoids provisioning expensive outlink bandwidthsto  continuously  transfer  large  data  volumes  to  the  cloud.Further, businesses expect their operations to function evenwhen connectivity to the cloud is unavailable.

2) Smart Cities.  have deployed millions of camerasand sensors across the city: at intersections, in parking lots,and in construction zones.  This data is used for improvingefficiency and safety by using a nearby edge cluster. For ex-ample, the City of Bellevue uses cameras at traffic intersec-tions for both controlling the traffic flow across the city andalerting drivers to avoid fatal accidents.

In  city  deployments, there is often sufficient bandwidth for all thesestreams  to  reach  the  edge  (e.g.,  at  the  local  traffic  controlcenter), but not beyond that to reach the cloud.

Also, sincemany scenarios are centered around safety, continuous oper-ation is critical even in the presence of disconnections.

3)  Intelligent  Transportation. Asan example, the railway industry uses high-definition cam-eras in bungalows along the track, to detect cracks in trainwheels.  Cracks can cause the wheel to break and derail theentire train. The bandwidth demand for this case is dynamic.When a train passes a bungalow, it will generate GBs of dataover a small period. At the same time, cracks should be de-tected and reported reliably within minutes to avoid severecasualties (financial and human lives).

Transportation scenarios are usually in remote and ruralareas where broadband is not available.The connectivity islow bandwidth (few Kbps), intermittent, and expensive, whilethe scenarios are typically mission- and safety-critical. Hence,edge computing has played a major role in this industry.

4) Industrial Plants. Industrial plants deploy hundreds ofthousands of sensors that continuously monitor mechanicalequipment, worker safety, and production workflows to en-sure issues are spotted and mitigated promptly. hey use edge computing at each rig to de-tect equipment maintenance needs. The motivation for using the edge is the unreliable andlow-bandwidth satellite connectivity available in such areas.

Summary:Enterprise  driven  scenarios  are  the  dominantreal deployments of edges today.  Their use-cases are long-running jobs that range widely from simple filtering and ag-gregation to complex machine learning inferences and videoprocessing. Across these scenarios,network bandwidth andreliability drive the use of edge computing, especially giventhe high volume of data generated, limited and intermittentconnectivity to the cloud, and the mission- and safety-criticalnature of these applications.  On the other hand, latency isless stringent.  The application’s acceptable latency is typi-cally in the range of a few seconds to minutes,  and in thestricter cases it is always at least hundreds of ms.

## Edge Sites

We call this struc-ture anedge-site deployment, where a dedicated set of edgesare used as a primary place of storage and computation.
Ifthe  network  permits,  the  cloud  is  also  used  alongside  theedge-site. 
The  cloud  is  large  pool  of  well-maintained  re-sources with no management overhead imposed on the user.It provides better resource efficiency (by multiplexing acrossmany usecases/users), high scalability, high availability, andlow cost. Thus, it is preferable to utilize the cloud alongsidethe edge whenever possible, as shown by the growing num-ber of hybrid (edge-cloud) management offerings [4–6, 25].This is a main difference of edge-sites from the traditional“on-premise”  only  clusters  used  (mainly  before  the  emer-gence of the cloud).

However, it is com-mon formultiple applications of a single enterpriseto sharethe  edge  cluster,  e.g,  run  both  fridge  monitoring  and  cus-tomer tracking applications in a retail store. Not all applica-tions have equal priority and criticality, but they share somedegree of trust among each other. 

Connectivity to cloud:The edge-site deployment is con-nected to the cloud (and generally to the outside world) viaa number of network links, which we calloutlinks. However, the amount of datagenerated by the input devices (e.g.,  sensors and cameras)is usually significantly larger than the total capacity of theout-link(s) of an deployment.  

## Driving Factors

1. Latency to DCs has become less of an issue.
 1.1. 1) Wider deployment of DCs. For ex-ample, Azure has 54 regions worldwide, with multiple DCsin each region,  and more coming online soon
 1.2. Deeper peering into ISPs:Cloud providers have sig-nificantly cut network latency between end users and theirDCs by peering more directly with thousands of ISPs, andreducing the number of intermediate networks that packetsuse to traverse.
 1.3. Specialized compute for ML and AI:Some of the end-to-end latency-sensitive applications that were envisioned foredge computing can now run efficiently on mobile devicesthrough hardware specialization.   Apple has built a neuralengine  (an  8  core  dedicated  ML  processor)  into  the  A12Bionic  ARM  SoC  in  the  latest  iPhones  that  is  capable  ofrunning ML apps up to 9 times faster than previously pos-sible [2]. 

2.    Bandwidth to DCs is insufficient
Further, bandwidth needs may be intermittent and dynamic.For example, when a train rolls into a train station its wheelsare inspected using video analytics, causing a spike

3.    Connectivity is unreliable. When coupled with the mission-critical nature ofthe applications we have described, even small amounts ofconnectivity outages can have a major impact on safety andfinancial viability.

## What needs to be done

1) Graceful Adaptation of Applications.  valuable objective is to enable appli-cations toadapt gracefullyin the presence of disconnections,drops in bandwidth, or workload spikes.

2) Collaborative & App-aware Network Orchestration

3) Test and Verification Frameworks

... need: building adaptive applications that can utilize the cloud whennetwork  conditions  permit  it  but  remain  operational  whenconditions do not permit.  Existing edge applications oftenconsist of an ensemble of custom and off-the-shelf contain-ers, with ad-hoc mechanisms for monitoring edge-to-cloudnetwork conditions and primitive mechanisms to adapt theirbehavior.

## Conclusion

We cite numer-ous  examples  of  real-world  deployments  of  edge  comput-ing across several different applications. These applicationsare not end-user interactive mobile applications opportunis-tically using the edge as originally envisioned.  Rather, theyare  geographically  constrained,  mission-critical,  industrialor enterprise applications that primarily rely on the edge andopportunistically use the cloud. These deployments have notbeen  motivated  by  the  need  for  low  latency  access  to  thecloud, but rather by the lack of sufficient and reliable band-width to the cloud. We have outlined a number of interestingresearch challenges that need to be solved in this context.

Finally, debugging and testing anedge-site application is extremely difficult.  Edge-site con-ditions can be difficult to recreate prior to deployment, andincorrect behavior can arise from unanticipated interactionsamong adaptation strategies



## FAQ

Fog computing? Looks like the same thing.