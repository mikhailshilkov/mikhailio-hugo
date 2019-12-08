---
title: Google Transit API research
date: 2012-04-10
tags: ["API","Google Maps"]
description: "Recently, Google has launch a Transit service for the biggest cities of Russia: a service to caculate routes with public transport options. As a part of RnD for upcoming project, I need to understand whether there's any feasible way to calculate public transport route programmatically. I.e. I need Google Transit API."
---

Recently, Google has launch a Transit service for the biggest cities of Russia: a service to caculate routes with public transport options. As a part of RnD for upcoming project, I need to understand whether there's any feasible way to calculate public transport route programmatically. I.e. I need Google Transit API.

Here's what I've got so far:

1. There's no official Google Transit API at the momemnt. Transit feeds are provided by third party agencies, and most of those feeds are not public. So, Google is not allowed to open them as API.

2. You may try to consume the "unofficial" API using the following sample link:
[http://maps.google.com/?saddr=St.%20Petersburg%20Shavrova%2015&daddr=St.%20Petersburg%20Sadovaya%2030&dirflg=r&output=json](http://maps.google.com/?saddr=St.%20Petersburg%20Shavrova%2013&daddr=St.%20Petersburg%20Sadovaya%2032&dirflg=r&output=json "Sample Google Transit JSON result")

3. However, the result won't be a valid JSON. Instead, that's something, that can be easily converted to a JavaScript object. (The differences are: there is no quotes around property names, the strings are not properly encoded etc.)

4. Imagine you got this JavaScript object. However, it won't allow you to easily get the structured route details. Object's properties contain the route points coordinates, but no descriptions. The only place where the descriptions may be found is 'panel' property, which contains a chunk of HTML text (sample [here](https://skydrive.live.com/redir.aspx?cid=c010011792a4b538&resid=C010011792A4B538!129&parid=C010011792A4B538!124&authkey=!AEzvBnLErMyVDbo "Sample HTML of ")).

5. So, you'll have to convert this HTML into XML (X-HTML) and then build the parser of this XML to get the essence data of a trip.

Seems like a bit of overkill to me. Having in mind, that "unofficial" API may change in the future, including slight changes in 'panel' HTML structure that will kill your parser.

Also, I'm still not sure whether I can change the language of route directions.

**Update**: language is specified with "hl" request parameter.

**Update 2**: [Google Transit API is now available](https://mikhail.io/2012/08/14/google-adds-public-transit-into-api/)!