---
title: Visualizing Dependency Tree from DI Container
date: 2017-03-25
tags: ["Dependency Injection", "Visualization", "Clean Code"]
thumbnail: teaser.png
---

So you are a C# developer. And you need to read the code and understand its
structure. Maybe you've just joined the project, or it's your own code you
wrote 1 year ago. In any case, reading code is hard.

Luckily, some good thought was applied to this particular piece of code.
It's all broken down into small classes (they might even be SOLID!), and all
the dependencies are injected via constructors. It looks like it's your
code indeed.

So, you figured out that the entry point for your current use case is the
class called `ThingService`. It's probably doing something with `Thing`'s
and that's what you need. The signature of the class constructor looks
like this:

``` csharp
public ThingService(
    IGetThings readRepository,
    ISaveThing saveRepository,
    IParseAndValidateExcel<Thing, string> fileParser,
    IThingChangeDetector thingChangeDetector,
    IMap<Thing, ThingDTO> thingToDtoMapper,
    IMap<int, ThingDTO, Thing> dtoToThingMapper)
```

OK, so we clearly have 6 dependencies here, and they are all interfaces.
We don't know where those interfaces are implemented, but hey - we've got
the best tooling in the industry, so right click on `IGetThings`, then
`Go To Implementation`.

``` csharp
public DapperThingRepository(
    ICRUDAdapter adapter,
    IDatabaseConnectionFactory connectionFactory,
    IMap<Thing, ThingRow> thingRowMapper,
    IMap<ThingRow, Thing> thingMapper)
```

Now we know that we get `Thing` from Dapper, so probably from a SQL database.
Let's go one level deeper and check where those Mappers are implemented.
Right click, `Go To Implementation`... But instead of navigating to another code
file you see

```
Find Symbol Result - 28 matches found
```

Oh, right, looks like we use `IMap<T, U>` in more places. OK, we'll find the
right one later, let's first check the connection factory...
Right click, `Go To Implementation`. Nah:

```
The symbol has no implementation
```

What? But the application works! Ah, `IDatabaseConnectionFactory` comes
from an internal library, so most probably the implementation is also
inside that library.

Clearly, navigation doesn't go that well so far.

Dependency Graph
----------------

When code reading gets tricky, usually an image can boost the understanding.
The picture below actually shows the graph of class dependencies from our
example:

![Class Dependency Graph](class-dependency-graph.png)

Each node is a class, each arrow is a dependency - an interface injected
into the constructor.

Just by looking at the picture for a minute of two you can start seeing some
structure, and get at least the high-level opinion about the application
complexity and class relationships.

Picture is also a great way of communication. Once you understand the structure,
you can explain it to a colleague much easier with boxes and lines
on the screen in addition to a plain wall of code.

You can enrich such picture with comments at the time of writing and leave
it to your future self or anyone who would read the code in 2 years time.

But now the question is - what's the easiest way to draw such dependency graph?

DI Container
------------

The assumption of this post is that a dependency injection (DI) container
of some kind is used in the project. If so, chances are that you can get such
dependency graph from the container registrations.

My example is based on [Simple Injector](https://simpleinjector.org/) DI
container which is used by ourselves. So, further on I will explain how to
draw a dependency graph from Simple Injector container.

My guess is that any mature DI library will provide you with such possibility,
mostly because the dependency graphs are built internally by any container
during its normal operations.

Implementation
--------------

The implementation idea of dependency graph visualization is quite simple, as
the biggest chunk of work is done by Simple Injector itself. Here are the steps:

1. Run all your DI registrations as you do in the actual application. This will
initialize Container to the desired state.

2. Define which class should be the root of the dependency tree under study.
You can refine later, but you need to start somewhere.

3. Call `GetRegistration` method of DI container for the selected type. An instance
of `InstanceProducer` type is returned.

4. Call `GetRelationships` method of the instance producer to retrieve all
interface/class pairs that the given type depends on. Save each relation into
your output list.

5. Navigate through each dependency recursively to load further layers of the graph.
Basically, do the depth-first search and save all found relations.

6. Convert the list of found relations into [GraphViz](https://en.wikipedia.org/wiki/Graphviz)
textual graph description.

7. Use a tool like [WebGraphviz](http://www.webgraphviz.com/) do the actual
visualization by converting text to picture.

There are several potential pitfalls on the way, like cyclic graphs, decorator
registrations etc. To help you avoid those I've created a small library to automate
steps 3 to 6 from the list above. See my
[SimpleInjector.Visualization github repo](https://github.com/mikhailshilkov/SimpleInjector.Visualization)
and let me know if you find it useful.

Conclusion
----------

People are good at making sense of visual representations - use that skill to
improve understanding and communication within your development team.

Dependency injection practice requires a lot of ceremony to set it up and
running. Leverage this work for the best: check what kind of insights you
can get from that setup. Dependency graph visualization is one example of
such leverage, but there might be other gems in there.

Just keep searching!