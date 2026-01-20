---
title: "Leaving Pulumi"
date: 2026-01-20
thumbnail: pulumi_group.jpg
images: [pulumi_group.jpg]
tags: ["Pulumi", "Career"]
description: "Reflections on six years at Pulumi: the product, the work, the growth, and the people."
ghissueid: 62
---

*This is a condensed version of my farewell email to the Pulumi team. I've removed most individual mentions and some internal details for privacy.*

Today is my last day at Pulumi.

For me, it's a chance to remind myself what kept me a Pulumian for over six years.

## The Product

I learned about Pulumi the day it was publicly announced. I downloaded the CLI that same day, and it was so obviously better than anything I'd used before that I couldn't shut up about it. Ran a demo at my employer at the time. Started showing it to friends. Eventually took it to meetups and conferences.

After one of those early talks, someone DMed me on the Pulumi Community Slack, asking how it went. I didn't recognize the name, so I typed "Eric Rudder" into the search bar. Oh wow. That guy is interested in my little talk?

A few months later, early 2019, I'm at Optimism Brewing Company in Seattle with Luke Hoban. That was the closest to "an interview" I ever had at Pulumi: we compared notes over a beer and agreed to partner on Azure-related work - me as a contractor, Pulumi as this promising startup I had become obsessed with. First of many beers at that place, it turned out.

What hooked me was simple: open-source developer tools where the users are engineers like me. Their problems are my problems. I don't have to imagine what they need - I need it too. After years in industries where understanding the customer required real effort and two product managers, I found this liberating.

In September 2019 I gave a talk at the Pulumi 1.0 launch party. I wasn't even an employee yet. That felt normal somehow - the product had me before the company did. On that trip, Joe suggested I join full-time.

Joe, Eric and Luke with early engineers had built something great. I've always found that kind of environment incredibly energizing - deeply and terminally technical founders who could, and still can, dive into any PR, any design doc, any gnarly problem.

By early 2020 we launched the .NET SDK (my most prominent tech stack) and I'd given 10 meetup talks in January/February. Then COVID hit. Meetups and conferences never fully recovered, and my blogging slowed too. I regret not pushing through: the product has always been worth shouting about. Same goes for the internals: “CrossCode”, the engine, the multi-language architecture - so many insights stayed inside that would be insanely cool to discuss in public.

## The Work

For the first months, I often felt like the dumbest person in the room. That was a great thing! I was humbled and excited to watch fundamentals take shape: CLI UX, language SDKs, the Pulumi schema, universal codegen, the Terraform bridge, CI pipelines.

Eventually I helped ship things too. .NET, Java, and YAML SDKs. Azure Native, AWS Cloud Control, other providers across the clouds. We generated so much code that some PR diffs contained tens of millions of lines, reliably causing GitHub unicorn errors. I'm pretty sure we motivated a few GitHub features with our unique design and scale.

We inspired the industry more than we got credit for. AWS CDK, Terraform CDK, Azure Bicep - they all studied Pulumi. Bicep went in a weird direction, but they definitely did their homework on us.

Last year I was genuinely happy to ship Pulumi Components - the last puzzle piece to the years-long story of multi-language components that started before I joined the company. Our work built on probably dozens of other Pulumi features that all came together to work like magic. Some problems just take that long and require everyone's endurance, conviction, and persistence - traits plentiful at Pulumi.

My last major project was Neo - Pulumi's AI agent for infrastructure. Nobody really knew if AI agents worked well enough for this. I remember watching Neo provision Kubernetes clusters on Google Cloud with PyTorch jobs running, completely from scratch, debugging the issues with kubectl, and thinking: this is black magic. That feeling - building something and then being surprised by what it can do - never gets old.

## The Growth

When I started, the company was very small, almost everyone was an engineer. Being remote was genuinely hard back then - I'd zoom into a Seattle conference room with a bad speaker, watching pixelated faces talk from the back of the room.

Now it's a real business. I grew with it, which still feels like privilege more than anything.

At some point in 2021, I was offered a management role. I didn't see it coming, imposter syndrome hit all over again. It was strange to keep receiving positive feedback from above and from below. Even stranger to find myself managing a sizable team and somehow not ruin it.

Luke stayed my manager, direct or skip-level, for over five years. That kind of consistency is rare, especially in a company growing this fast. I learned so much from him - about product, engineering, leadership, about staying calm when things get complicated.

I leave different than I arrived, and that's more about what Pulumi gave me than anything I did on my own.

## The People

In the end, it's all about The People.

Async-first, technical, to-the-point, writing a document before any meeting, quiet morning hours is the kind of culture I enjoy. I'm comfortable in my own corner, doing work rather than talking about it. But remote work only works if you actively maintain connection. Pulumi has done this well.

No small thing is too small. The #shoutouts channel. TGIF that always starts with recognition. Lego bricks and awards. Hackathons three times a year with real freedom to explore but also some healthy competition (a four-time prize winner here, not that I'm counting). A mix of backgrounds, geographies, languages, experiences, and genuine mutual respect underneath it all. A rare combination of technical brilliance paired with actually caring about each other.

In-person moments matter a lot to me. They remind us we work with real humans. They create shared memories and low-stakes fun. Meeting the person behind the Slack messages changes everything. Helping a fellow human being is different from responding to a notification.

6am surfing in Hawaii, sitting on the beach, listening to conversations drift by. Throwing axes into the target. Mini-golf in the rain (it always rains in Seattle). Wine tasting. Backyard BBQ. EDM party in Vegas. Trying to make any sense of baseball in Chicago. Strolling around Eixample. Did I mention Hawaii?

Thank you to all Pulumians!

Take care of each other. Be kind. Keep shipping.

And if you ever find yourself in Rome, I’m inviting you for coffee or wine.

--
Mikhail
