---
title: Peer code review Why's, How's and What's
date: 2015-05-27
tags: ["Code Review", "Best Practices"]
description: This post is a short summary on why do code reviews, what the steps are and what should actually be reviewed. The text was created to set some common ground for my team, which was just starting to conduct code reviews in a consistent way.
---
This post is a short summary on why do code reviews, what the steps are and what should actually be reviewed. The text was created to set some common ground for my team, which was just starting to conduct code reviews in a consistent way. By any means, this text is not a complete guide but rather a checklist and a starting point for discussion.

WHY's
-----
So, why spend time on code reviews at all? The most important reasons are listed below:

**To find bugs**, to spot and fix defects early in the process;

**To spread knowledge**, to share understanding of the code base as team members learn from each other and increase team cohesiveness;

**To agree on rules**, to maintain a level of consistency in design and implementation;

**To improve as the team**, to identify common defects across the team thus reduce rework;

**To get second opinion**, to add a different perspective, "another set of eyes" adds objectivity.


HOW's
-----
Which steps should I take during code reviews? This depends a lot on the tools being used, of course. We use the following set of tools: task management tool (_Atlassian JIRA_), IDE (_Visual Studio_), source control log (Git log viewer of taste) and code review tool (_Atlassian Crucible/FishEye_).
You should do the following during your code review process:

**Understand the scope**, read the task description, user story, commit or pull request message;

**Get the code**, pull the latest code to your hard drive and in your IDE, create a review item in code review tool, make sure that all changes are included;

**Read and understand** all the changes by navigating them in your tools;

**Ask the author** if something is unclear;

**Go through the checklist** (below) and make your peer judgement;

**Put your comments** to code review tool, as written comments are usually preferred over verbal;

**Merge the code** into main repository or integration branch, if you agree with the proposed changes;

**Report the result back** to the team by moving the task to rejected or accepted state, according to your team's workflow.


WHAT's
------
Here is the approximate checklist of what should be reviewed during the code review. Start at the top and go down to the bottom.

**Readiness**: Is the change under review submitted correctly, are all tests green?

**Functionality**: Does the code work? Does it perform its intended function, is the logic correct etc. You don't have to test all scenarios, but you should at least think of possible scenarios and whether the code addresses all of them in your opinion.

**Readability**: Is all the code easy to understand? When you read the code, is it easy to understand every detail of it without spending a lot of time and effort?

**Testabity**: Is the code testable? I.e. not too many dependencies, unable to initialize objects with stubs or mocks, test frameworks can use methods etc.

**No duplication**: Is there any redundant or duplicate code? Do you see some possibility to refactor it to reduce duplication?

**Reuse**: Did the author reuse existing classes and libraries for solving common tasks? Is the naming and code structure consistent with similar existing blocks of solution? Can any of the code be replaced with library functions?

**Design**: Do you agree with the design and structure of code blocks? Think of coupling and cohesion, SOLID principles, dependency chains etc.

**Unit tests**: Do tests exist and are they comprehensive? Are all the changes covered by unit tests? Do they conform to unit testing guidelines? Can you think of more tests which are missing?

**Readability of tests**: Are tests short and readable? Do they reveal any design problems?

**Error handling**: Is exception handling and logging consistent? Are they tested?

**Public contracts**: Could the code violate backwards compatibility when we have to keep it?

**No leftovers**: Do you see any code which is commented out or any TODOs? Can any logging or debugging code be removed without loosing functionality?

**Code style**: Does it conform to your agreed programming practices and coding style? Do ReSharper and static code analysis tools give no errors and warnings?

**Documentation**: Was the documentation updated in case the change touches public API?

**Comments**: Are all comments valid? Do you see any dummy comments which are unreadable and were created just to make ReSharper happy?

**Performance**: Do you see any potential performance problems that have to be solved before the first version of this code is accepted? When applicable, measure the CPU load, memory, or traffic consumption caused by new code.

**High level tests**: When applicable, are integration and/or end-to-end tests created?

**Data migration**: When applicable, was database migration script updated?

Am I missing anything important? Probably yes, so please share your suggestions in the comments.
Happy reviews!