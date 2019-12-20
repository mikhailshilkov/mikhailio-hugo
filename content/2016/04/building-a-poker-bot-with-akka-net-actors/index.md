---
title: Building a Poker Bot with Akka.NET Actors
date: 2016-04-09
tags: ["Poker Bot", "FSharp", "Akka.NET", "Actor Model", "Functional Programming"]
thumbnail: teaser.png
description: "This post lays out the most exciting part of the bot. I'll compose the recognition, flow, decision and mouse clicking parts together into the bot application. The application is a console executable interacting with multiple windows of poker room software."

---

<i>This is the fourth part of **Building a Poker Bot** series where I describe my experience developing bot software to play in online poker rooms. I'm building the bot with .NET framework and F# language which makes the task relatively easy and very enjoyable. Here are the previous parts:</i>

- [*Building a Poker Bot: Card Recognition*](https://mikhail.io/2016/02/building-a-poker-bot-card-recognition/)
- [*Building a Poker Bot: String and Number Recognition*](https://mikhail.io/2016/02/building-a-poker-bot-string-recognition/)
- [*Building a Poker Bot: Mouse Movements*](https://mikhail.io/2016/03/building-a-poker-bot-mouse-movements/)

This post lays out the most exciting part of the bot. I'll compose the recognition, flow, decision and mouse clicking
parts together into the bot application. The application is a console executable interacting with multiple
windows of poker room software.

Flow
----

The following picture shows the outline of the application data flow:

![Actor Diagram](pokeractors.png)

**Find Tables** - Every half a second or so we scan all the windows and search for open poker tables among them.
For each poker table we make a screenshot and send those to recognition.

**Recognize Screen** - Parse the data from the screenshot. Check whether it's our turn to make a play now, what
the [hole cards](https://mikhail.io/2016/02/building-a-poker-bot-card-recognition/) and
[stacks](https://mikhail.io/2016/02/building-a-poker-bot-string-recognition/) are, produce the detailed
screen information and send it to decision maker.

**Make Decision** - Understand if that's a new hand or there was a past history before. See
what the villains did and which new cards we got. Here the secret sauce comes to play and produces
a move to be made. Send the action to the mouse clicker.

**Click Buttons** - Based on the decision made, click the right buttons. It should be done with proper delays
and [human-like movements](https://mikhail.io/2016/03/building-a-poker-bot-mouse-movements/) so that the villain
and poker room don't understand that it's bot who is playing.

---

Let the Actors Play
-------------------

Because of the multi-tabling, the application is intrinsically multi-threaded. At the same time,
the different parts of the flow are executed at different cadence:

- Finding tables is triggered by time and is single-threaded
- Screen recognition, history detection and decision making run in sequence and can be executed in parallel
for multiple tables
- Clicking the buttons is again single-threaded, as it must synchronize the outputs from the previous steps,
put them in sequence with appropriate delays

Here are the other treats of the flow:

- It is reactive and event based
- The flow is unidirectional, the output of one step goes to the input of the next step
- Most steps are stateless, but the history state needs to be preserved and, ideally, isolated from the other
steps

This list of features made me pick the Actor-based [Akka.NET](http://getakka.net) framework to implement the flow.

For sure, the application could be done with a bunch of procedural code instead.
But I found actors to be a useful modeling technique to be employed.
It goes well with reactive nature of the application and builds the nice
foundation for more complicated scenarios in the future.

Also, I was curious how F# and Akka.NET would work together.

Supervision Hierachy
--------------------

In Akka.NET each actor has a supervisor actor who is managing its lifecycle. All actors together form a
supervision tree. Here is the tree shown for the Player application:

![Actor Hierachy](actorhierachy.png)

There is just one copy of both Table Finder and Button Clicker actors and they are supervised by the root
User actor.

For each poker table a Recognizer actor gets created. These actors are managed by Table
Finder.

Each Recognizer actor creates an instance of Decision actor who keeps the hand history
and makes decisions.

Finally, all decisions are sent to one centralized Button Clicker actor whose job is
to click all the tables with proper delays and in order.

---

Implementation Patterns
-----------------------

All actors are implemented with [Functional Actor Patterns](https://mikhail.io/2016/03/functional-actor-patterns-with-akkadotnet-and-fsharp/)
which are described in [my previous post](https://mikhail.io/2016/03/functional-actor-patterns-with-akkadotnet-and-fsharp/).

The basic idea is that each actor is defined in functional style with these
building blocks:

- Type of incoming and, if needed, outgoing messages
- A domain function with business logic
- Actor function which puts those parts together
- Expression to spawn an actor based on actor function

Let's look at the examples to understand this structure better.

Table Finder
------------

Table Finder does not have any meaningful input message. It gets a message from
Akka.NET scheduling system just to be periodically activated.

The domain function is called `findWindows` and has the type `unit -> WindowInfo seq`.
It returns the poker window screenshots and titles.

Actor function of type `int -> seq<string * WindowInfo>` is used by the
[Router-Supervisor](https://mikhail.io/2016/03/functional-actor-patterns-with-akkadotnet-and-fsharp/#RouterSupervisor) pattern to
define the behavior. The ouput tuple defines an ID of an output actor and a
message to send to it:

``` fsharp
let findActor msg =
  findWindows ()
  |> Seq.map (fun x -> ("recognizer-actor-" + x.TableName, x))
```

Here is how I spawn the singleton instance of this actor:

``` fsharp
let tableFinderRef =
  actorOfRouteToChildren findActor (spawnChild recognizer)
  |> spawn system "table-finder-actor"
```

Where `spawnChild` is a helper function - essentially an adapter of standard
`spawn` function with proper parameter order:

``` fsharp
let spawnChild childActor name (mailbox : Actor<'a>) =
  spawn mailbox.Context name childActor
```

We can also extend it to debug messages when new actors get created.

Recognizer
----------

Recognizer receives the `WindowInfo` produced by the Table Finder.

The domain function has the type of `Bitmap -> Screen`. You can read more about table
recognition in [Part 1](https://mikhail.io/2016/02/building-a-poker-bot-card-recognition/) and
[Part 2](https://mikhail.io/2016/02/building-a-poker-bot-string-recognition/)
of these series.

Actor function is an implementation of
[Converter-Supervisor](https://mikhail.io/2016/03/functional-actor-patterns-with-akkadotnet-and-fsharp/#ConverterSupervisor) pattern.
The output is a decision message for Decision Maker actor which is a supervised
child of the Recognizer. Here is the actor function:

``` fsharp
let recognizeActor (window : WindowInfo) =
  let result = recognize window.Bitmap
  { WindowTitle = window.Title
    TableName = window.TableName
    Screen = result
    Bitmap = window.Bitmap }
```

And here is the spawn function:

``` fsharp
let recognizer = actorOfConvertToChild recognizeActor (spawnChild decider "decider")
```

Notice how this expression was used in Table Finder instantiation above.

Decision Maker
--------------

Decision Maker actor function is an implementation of
[Stateful Converter](https://mikhail.io/2016/03/functional-actor-patterns-with-akkadotnet-and-fsharp/#StatefulConverter) pattern. It receives
a decision message from a Recognizer. The output is a click message for a
singleton Clicker actor. It also needs to preserve some state between two calls.
In the minimalistic implementation this state holds the previous screen that
it received, so that if the same message is received twice, the later message is
ignored.

This way the actor function has the type of
`DecisionMessage -> Screen option -> ClickerMessage * Screen option`
and looks like this:

``` fsharp
let decisionActor msg lastScreen =
  let screen = msg.Screen
  match lastScreen with
  | Some s when s = screen -> (None, lastScreen)
  | _ ->
    let action = decide screen
    let outMsg = { WindowTitle = msg.WindowTitle; Clicks = action }
    (Some outMsg, Some screen)
```

Here is the spawn function:

``` fsharp
let decider = actorOfStatefulConvert decisionActor None clickerRef
```

where `None` represents the initial state.

Button Clicker
--------------

Clicker actor has the simplest implementation because it does not send messages to other actors.
Here is the message that it receives from Decision Maker:

``` fsharp
type ClickTarget = (int * int * int * int)
type ClickerMessage = {
  WindowTitle: string
  Clicks: ClickTarget[]
}
```

The domain function has the simple type `ClickerMessage -> unit` with mouse
clicks as side effect. You can read more about the mouse movements in
[Part 3](https://mikhail.io/2016/03/building-a-poker-bot-mouse-movements/)
of these series.

[Message Sink](https://mikhail.io/2016/03/functional-actor-patterns-with-akkadotnet-and-fsharp/#MessageSink)
pattern is used for this actor, so actor function isn't
really needed. We spawn the singleton instance with the following statement:

``` fsharp
let clickerRef = actorOfSink click |> spawn system "clicker-actor"
```
Actor goes under supervision by actor system with `click` as message handler.

Conclusion
----------

The top layer of poker player application is composed of small single-purpose
actors which talk to each other by sending messages.

Thanks to succinct F# language and functional actor patterns this layer is
very thin, and thus easy to understand and maintain.

The business logic is isolated and by itself has no dependency on Akka.NET.

*Proceed to [Part 5 of Building a Poker Bot: Functional Fold as Decision Tree Pattern](/2016/07/building-a-poker-bot-functional-fold-as-decision-tree-pattern/).*