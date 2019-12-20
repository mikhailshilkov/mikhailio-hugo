---
title: Monads explained in C# (again)
date: 2018-07-05
tags: ["Functional Programming", "Monads", "LINQ", "CSharp", "FSharp"]
thumbnail: teaser.png
description: Yet another Monad tutorial, this time for C# OOP developers
---

I love functional programming for the simplicity that it brings.

But at the same time, I realize that learning functional programming is a challenging
process. FP comes with a baggage of unfamiliar vocabulary that can be daunting for
somebody coming from an object-oriented language like C#.

{{< figure src="functional-programming-word-cloud.png" title="Some of functional lingo" >}}

"Monad" is probably the most infamous term from the list above. Monads have reputation of being
something very abstract and very confusing.

The Fallacy of Monad Tutorials
------------------------------

Numerous attempts were made to explain monads in simple definitions; and monad tutorials have become a
genre of its own. And yet, times and times again, they fail to enlighten the readers.

The shortest explanation of monads looks like this:

![A Monad is just a monoid in the category of endofunctors](monoid-endofunctors.png)

It's both mathematically correct and totally useless to anybody learning functional programming. To
understand this statement, one has to know the terms "monoid", "category" and "endofunctors" and be able
to mentally compose them into something meaningful.

The same problem is apparent in most monad tutorials. They assume some pre-existing knowledge in
heads of their readers, and if that assumption fails, the tutorial doesn't click.

Focusing too much on mechanics of monads instead of explaining why they are important is another
common problem.

Douglas Crockford grasped this fallacy very well:

> The monadic curse is that once someone learns what monads are and how to use them, they lose the ability to explain them to other people

The problem here is likely the following. Every person who understands monads had their own path to
this knowledge. It hasn't come all at once, instead there was a series of steps, each giving an insight,
until the last final step made the puzzle complete.

But they don't remember the whole path anymore. They go online and blog about that very last step as
the key to understanding, joining the club of flawed explanations.

There is an actual [academic paper from Tomas Petricek](http://tomasp.net/academic/papers/monads/monads-programming.pdf)
that studies monad tutorials.

I've read that paper and a dozen of monad tutorials online. And of course, now I came up with my own.

I'm probably doomed to fail too, at least for some readers. Yet, I know that many people found the
[previous version](https://mikhail.io/2016/01/monads-explained-in-csharp/) of this article useful.

I based my explanation on examples from C# - the object-oriented language familiar to .NET developers.

Story of Composition
--------------------

The base element of each functional program is Function. In typed languages each function
is just a mapping between the type of its input parameter and output parameter.
Such type can be annotated as `func: TypeA -> TypeB`.

C# is object-oriented language, so we use methods to declare functions. There are two ways
to define a method comparable to `func` function above. I can use static method:

``` csharp
static class Mapper
{
    static ClassB func(ClassA a) { ... }
}
```

... or instance method:

``` csharp
class ClassA
{
    // Instance method
    ClassB func() { ... }
}
```

Static form looks closer to the function annotation, but both ways are actually equivalent
for the purpose of our discussion. I will use instance methods in my examples, however all of
them could be written as static extension methods too.

How do we compose more complex workflows, programs and applications out of such simple
building blocks? A lot of patterns both in OOP and FP worlds revolve around this question.
And monads are one of the answers.

My sample code is going to be about conferences and speakers. The method implementations
aren't really important, just watch the types carefully. There are 4 classes (types) and
3 methods (functions):

``` csharp
class Speaker
{
    Talk NextTalk() { ... }
}

class Talk
{
    Conference GetConference() { ... }
}

class Conference
{
    City GetCity() { ... }
}

class City { ... }
```

These methods are currently very easy to compose into a workflow:

``` csharp
static City NextTalkCity(Speaker speaker)
{
    Talk talk = speaker.NextTalk();
    Conference conf = talk.GetConference();
    City city = conf.GetCity();
    return city;
}
```

Because the return type of the previous step always matches the input type of the next step, we can
write it even shorter:

``` csharp
static City NextTalkCity(Speaker speaker)
{
    return
        speaker
        .NextTalk()
        .GetConference()
        .GetCity();
}
```

This code looks quite readable. It's concise and it flows from top to bottom, from left to right,
similar to how we are used to read any text. There is not much noise too.

That's not what real codebases look like though, because there are multiple complications
along the happy composition path. Let's look at some of them.

NULLs
-----

Any class instance in C# can be `null`. In the example above I might get runtime errors if
one of the methods ever returns `null` back.

Typed functional programming always tries to be explicit about types, so I'll re-write the signatures
of my methods to annotate the return types as nullables:

``` csharp
class Speaker
{
    Nullable<Talk> NextTalk() { ... }
}

class Talk
{
    Nullable<Conference> GetConference() { ... }
}

class Conference
{
    Nullable<City> GetCity() { ... }
}

class City { ... }
```

This is actually invalid syntax in current C# version, because `Nullable<T>` and its short form
`T?` are not applicable to reference types. This [might change in C# 8](https://blogs.msdn.microsoft.com/dotnet/2017/11/15/nullable-reference-types-in-csharp/)
though, so bear with me.

Now, when composing our workflow, we need to take care of `null` results:

``` csharp
static Nullable<City> NextTalkCity(Speaker speaker)
{
    Nullable<Talk> talk = speaker.NextTalk();
    if (talk == null) return null;

    Nullable<Conference> conf = talk.GetConference();
    if (conf == null) return null;

    Nullable<City> city = conf.GetCity();
    return city;
}
```

It's still the same method, but it got more noise now. Even though I used short-circuit returns
and one-liners, it still got harder to read.

To fight that problem, smart language designers came up with the Null Propagation Operator:

``` csharp
static Nullable<City> NextTalkCity(Speaker speaker)
{
    return
        speaker
        ?.NextTalk()
        ?.GetConference()
        ?.GetCity();
}
```

Now we are almost back to our original workflow code: it's clean and concise, we just got
3 extra `?` symbols around.

Let's take another leap.

Collections
-----------

Quite often a function returns a collection of items, not just a single item. To some extent,
that's a generalization of `null` case: with `Nullable<T>` we might get 0 or 1 results back,
while with a collection we can get `0` to any `n` results.

Our sample API could look like this:

``` csharp
class Speaker
{
    List<Talk> GetTalks() { ... }
}

class Talk
{
    List<Conference> GetConferences() { ... }
}

class Conference
{
    List<City> GetCities() { ... }
}
```

I used `List<T>` but it could be any class or plain `IEnumerable<T>` interface.

How would we combine the methods into one workflow? Traditional version would look like this:


``` csharp
static List<City> AllCitiesToVisit(Speaker speaker)
{
    var result = new List<City>();

    foreach (Talk talk in speaker.GetTalks())
        foreach (Conference conf in talk.GetConferences())
            foreach (City city in conf.GetCities())
                result.Add(city);

    return result;
}
```

It reads ok-ish still. But the combination of nested loops and mutation with some conditionals sprinkled
on them can get unreadable pretty soon. The exact workflow might be lost in the mechanics.

As an alternative, C# language designers invented LINQ extension methods. We can write code like this:

``` csharp
static List<City> AllCitiesToVisit(Speaker speaker)
{
    return
        speaker
        .GetTalks()
        .SelectMany(talk => talk.GetConferences())
        .SelectMany(conf => conf.GetCities())
        .ToList();
}
```

Let me do one further trick and format the same code in an unusual way:

``` csharp
static List<City> AllCitiesToVisit(Speaker speaker)
{
    return
        speaker
        .GetTalks()           .SelectMany(x => x
        .GetConferences()    ).SelectMany(x => x
        .GetCities()         ).ToList();
}
```

Now you can see the same original code on the left, combined with just a bit of technical repeatable
clutter on the right. Hold on, I'll show you where I'm going.

Let's discuss another possible complication.

Asynchronous Calls
------------------

What if our methods need to access some remote database or service to produce the results? This
should be shown in type signature, and C# has `Task<T>` for that:

``` csharp
class Speaker
{
    Task<Talk> NextTalk() { ... }
}

class Talk
{
    Task<Conference> GetConference() { ... }
}

class Conference
{
    Task<City> GetCity() { ... }
}
```

This change breaks our nice workflow composition again.

We'll get back to async-await later, but the original way to combine `Task`-based
methods was to use `ContinueWith` and `Unwrap` API:

``` csharp
static Task<City> NextTalkCity(Speaker speaker)
{
    return
        speaker
        .NextTalk()
        .ContinueWith(talk => talk.Result.GetConference())
        .Unwrap()
        .ContinueWith(conf => conf.Result.GetCity())
        .Unwrap();
}
```

Hard to read, but let me apply my formatting trick again:

``` csharp
static Task<City> NextTalkCity(Speaker speaker)
{
    return
        speaker
        .NextTalk()         .ContinueWith(x => x.Result
        .GetConference()   ).Unwrap().ContinueWith(x => x.Result
        .GetCity()         ).Unwrap();
}
```

You can see that, once again, it's our nice readable workflow on the left + some mechanical repeatable
junction code on the right.

Pattern
-------

Can you see a pattern yet?

I'll repeat the `Nullable`-, `List`- and `Task`-based workflows again:

``` csharp
static Nullable<City> NextTalkCity(Speaker speaker)
{
    return
        speaker               ?
        .NextTalk()           ?
        .GetConference()      ?
        .GetCity();
}

static List<City> AllCitiesToVisit(Speaker speaker)
{
    return
        speaker
        .GetTalks()            .SelectMany(x => x
        .GetConferences()     ).SelectMany(x => x
        .GetCities()          ).ToList();
}

static Task<City> NextTalkCity(Speaker speaker)
{
    return
        speaker
        .NextTalk()            .ContinueWith(x => x.Result
        .GetConference()      ).Unwrap().ContinueWith(x => x.Result
        .GetCity()            ).Unwrap();
}
```

In all 3 cases there was a complication which prevented us from sequencing method
calls fluently. In all 3 cases we found the gluing code to get back to fluent composition.

Let's try to generalize this approach. Given some generic container type
`WorkflowThatReturns<T>`, we have a method to combine an instance of such workflow with
a function which accepts the result of that workflow and returns another workflow back:

``` csharp
class WorkflowThatReturns<T>
{
    WorkflowThatReturns<U> AddStep(Func<T, WorkflowThatReturns<U>> step);
}
```

In case this is hard to grasp, have a look at the picture of what is going on:

![Monad Bind Internals](monad-bind.png)

1. An instance of type `T` sits in a generic container.

2. We call `AddStep` with a function, which maps `T` to `U` sitting inside yet another
container.

3. We get an instance of `U` but inside two containers.

4. Two containers are automatically unwrapped into a single container to get back to the
original shape.

5. Now we are ready to add another step!

In the following code, `NextTalk` returns the first instance inside the container:

``` csharp
WorkflowThatReturns<City> Workflow(Speaker speaker)
{
    return
        speaker
        .NextTalk()
        .AddStep(x => x.GetConference())
        .AddStep(x => x.GetCity());
}
```

Subsequently, `AddStep` is called two times to transfer to `Conference` and then
`City` inside the same container:

![Monad Bind Chaining](monad-two-binds.png)

Finally, Monads
---------------

The name of this pattern is **Monad**.

In C# terms, a Monad is a generic class with two operations: constructor and bind.

``` csharp
class Monad<T> {
    Monad(T instance);
    Monad<U> Bind(Func<T, Monad<U>> f);
}
```

Constructor is used to put an object into container, `Bind` is used to replace one
contained object with another contained object.

It's important that `Bind`'s argument returns `Monad<U>` and not just `U`. We can think
of `Bind` as a combination of `Map` and `Unwrap` as defined per following signature:

``` csharp
class Monad<T> {
    Monad(T instance);
    Monad<U> Map(Function<T, U> f);
    static Monad<U> Unwrap(Monad<Monad<U>> nested);
}
```

Even though I spent quite some time with examples, I expect you to be slightly confused
at this point. That's ok.

Keep going and let's have a look at several sample implementations of Monad pattern.

<a name="maybe"></a>
Maybe (Option)
----------------------------

My first motivational example was with `Nullable<T>` and `?.`. The full pattern
containing either 0 or 1 instance of some type is called `Maybe` (it maybe has a value,
or maybe not).

`Maybe` is another approach to dealing with 'no value' value, alternative to the
concept of `null`.

Functional-first language F# typically doesn't allow `null` for its types. Instead, F# has
a maybe implementation built into the language:
it's called `option` type.

Here is a sample implementation in C#:

``` csharp
public class Maybe<T> where T : class
{
    private readonly T value;

    public Maybe(T someValue)
    {
        if (someValue == null)
            throw new ArgumentNullException(nameof(someValue));
        this.value = someValue;
    }

    private Maybe()
    {
    }

    public Maybe<U> Bind<U>(Func<T, Maybe<U>> func) where U : class
    {
        return value != null ? func(value) : Maybe<U>.None();
    }

    public static Maybe<T> None() => new Maybe<T>();
}
```

When `null` is not allowed, any API contract gets more explicit: either you
return type `T` and it's always going to be filled, or you return `Maybe<T>`.
The client will see that `Maybe` type is used, so it will be forced to handle
the case of absent value.

Given an imaginary repository contract (which does something with customers and
orders):

``` csharp
public interface IMaybeAwareRepository
{
    Maybe<Customer> GetCustomer(int id);
    Maybe<Address> GetAddress(int id);
    Maybe<Order> GetOrder(int id);
}
```

The client can be written with `Bind` method composition, without branching,
in fluent style:

``` csharp
Maybe<Shipper> shipperOfLastOrderOnCurrentAddress =
    repo.GetCustomer(customerId)
        .Bind(c => c.Address)
        .Bind(a => repo.GetAddress(a.Id))
        .Bind(a => a.LastOrder)
        .Bind(lo => repo.GetOrder(lo.Id))
        .Bind(o => o.Shipper);
```

As we saw above, this syntax looks very much like a LINQ query with a bunch
of `SelectMany` statements. One of the common
implementations of `Maybe` implements `IEnumerable` interface to enable
a more C#-idiomatic binding composition. Actually:

Enumerable + SelectMany is a Monad
----------------------------------

`IEnumerable` is an interface for enumerable containers.

Enumerable containers can be created - thus the constructor monadic operation.

The `Bind` operation is defined by the standard LINQ extension method, here
is its signature:

``` csharp
public static IEnumerable<U> SelectMany<T, U>(
    this IEnumerable<T> first,
    Func<T, IEnumerable<U>> selector)
```

Direct implementation is quite straightforward:

``` csharp
static class Enumerable
{
    public static IEnumerable<U> SelectMany(
        this IEnumerable<T> values,
        Func<T, IEnumerable<U>> func)
    {
        foreach (var item in values)
            foreach (var subItem in func(item))
                yield return subItem;
    }
}
```

And here is an example of composition:

``` csharp
IEnumerable<Shipper> shippers =
    customers
        .SelectMany(c => c.Addresses)
        .SelectMany(a => a.Orders)
        .SelectMany(o => o.Shippers);
```

The query has no idea about how the collections are stored (encapsulated in
containers). We use functions `T -> IEnumerable<U>` to produce new enumerables
(`Bind` operation).

Task (Future)
-------------------

In C# `Task<T>` type is used to denote asynchronous computation which will eventually
return an instance of `T`. The other names for similar concepts in other languages
are `Promise` and `Future`.

While the typical usage of `Task` in C# is different from the Monad pattern we
discussed, I can still come up with a `Future` class with the familiar structure:

``` csharp
public class Future<T>
{
    private readonly Task<T> instance;

    public Future(T instance)
    {
        this.instance = Task.FromResult(instance);
    }

    private Future(Task<T> instance)
    {
        this.instance = instance;
    }

    public Future<U> Bind<U>(Func<T, Future<U>> func)
    {
        var a = this.instance.ContinueWith(t => func(t.Result).instance).Unwrap();
        return new Future<U>(a);
    }

    public void OnComplete(Action<T> action)
    {
        this.instance.ContinueWith(t => action(t.Result));
    }
}
```

Effectively, it's just a wrapper around the `Task` which doesn't add too much value,
but it's a useful illustration because now we can do:

``` csharp
repository
    .LoadSpeaker()
    .Bind(speaker => speaker.NextTalk())
    .Bind(talk => talk.GetConference())
    .Bind(conference => conference.GetCity())
    .OnComplete(city => reservations.BookFlight(city));
```

We are back to the familiar structure. Time for some more complications.

Non-Sequential Workflows
------------------------

Up until now, all the composed workflows had very liniar, sequential
structure: the output of a previous step was always the input for the next step.
That piece of data could be discarded after the first use because it was never needed
for later steps:

![Linear Workflow](linear-workflow.png)

Quite often though, this might not be the case. A workflow step might need data
from two or more previous steps combined.

In the example above, `BookFlight` method might actually need both `Speaker` and
`City` objects:

![Non Linear Workflow](non-linear-workflow.png)

In this case, we would have to use closure to save `speaker` object until we get
a `talk` too:

``` csharp
repository
    .LoadSpeaker()
    .OnComplete(speaker =>
        speaker
            .NextTalk()
            .Bind(talk => talk.GetConference())
            .Bind(conference => conference.GetCity())
            .OnComplete(city => reservations.BookFlight(speaker, city))
        );
```

Obviously, this gets ugly very soon.

To solve this structural problem, C# language got its `async`-`await` feature,
which is now being reused in more languages including Javascript.

If we move back to using `Task` instead of our custom `Future`, we are able to
write

``` csharp
var speaker = await repository.LoadSpeaker();
var talk = await speaker.NextTalk();
var conference = await talk.GetConference();
var city = await conference.GetCity();
await reservations.BookFlight(speaker, city);
```

Even though we lost the fluent syntax, at least the block has just one level,
which makes it easier to navigate.

Monads in Functional Languages
------------------------------

So far we learned that

- Monad is a workflow composition pattern
- This pattern is used in functional programming
- Special syntax helps simplify the usage

It should come at no surprise that functional languages support monads on syntactic
level.

F# is a functional-first language running on .NET framework. F# had its own way of
doing workflows comparable to `async`-`await` before C# got it. In F#, the above
code would look like this:

``` fsharp
let sendReservation () = async {
    let! speaker = repository.LoadSpeaker()
    let! talk = speaker.nextTalk()
    let! conf = talk.getConference()
    let! city = conf.getCity()
    do! bookFlight(speaker, city)
}
```

Apart from syntax (`!` instead of `await`), the major difference to C# is that
`async` is just one possible monad type to be used this way. There are many
other monads in F# standard library (they are called Computation Expressions).

The best part is that any developer can create their own monads, and then use
all the power of language features.

Say, we want a hand-made `Maybe` computation expressoin in F#:

``` fsharp
let nextTalkCity (speaker: Speaker) = maybe {
    let! talk = speaker.nextTalk()
    let! conf = talk.getConference()
    let! city = conf.getCity(talk)
    return city
}
```

To make this code runnable, we need to define Maybe computation expression
builder:

``` fsharp
type MaybeBuilder() =

    member this.Bind(x, f) =
        match x with
        | None -> None
        | Some a -> f a

    member this.Return(x) =
        Some x

let maybe = new MaybeBuilder()
```

I won't explain the details of what happens here, but you can see that the code is
quite trivial. Note the presence of `Bind` operation (and `Return` operation being
the monad constructor).

The feature is widely used by third-party F# libraries. Here is an actor definition
in Akka.NET F# API:

``` fsharp
let loop () = actor {
    let! message = mailbox.Receive()
    match message with
    | Greet(name) -> printfn "Hello %s" name
    | Hi -> printfn "Hello from F#!"
    return! loop ()
}
```

Monad Laws
----------

There are a couple laws that constructor and `Bind` need to adhere to, so
that they produce a proper monad.

A typical monad tutorial will make a lot of emphasis on the laws, but I find them
less important to explain to a beginner. Nonetheless, here they are for the sake
of completeness.

**Left Identity law** says that Monad constructor is a neutral operation: you can safely
run it before `Bind`, and it won't change the result of the function call:

``` csharp
// Given
T value;
Func<T, Monad<U>> f;

// Then (== means both parts are equivalent)
new Monad<T>(value).Bind(f) == f(value)
```

**Right Identity law** says that given a monadic value, wrapping its contained data
into another monad of same type and then `Bind`ing it, doesn't change the original value:

``` csharp
// Given
Monad<T> monadicValue;

// Then (== means both parts are equivalent)
monadicValue.Bind(x => new Monad<T>(x)) == monadicValue
```

**Associativity law** means that the order in which `Bind` operations
are composed does not matter:

``` csharp
// Given
Monad<T> m;
Func<T, Monad<U>> f;
Func<U, Monad<V>> g;

// Then (== means both parts are equivalent)
m.Bind(f).Bind(g) == m.Bind(a => f(a).Bind(g))
```

The laws may look complicated, but in fact they are very natural
expectations that any developer has when working with monads, so don't
spend too much mental effort on memorizing them.

Conclusion
----------

You should not be afraid of the "M-word" just because you are a C# programmer.

C# does not have a notion of monads as predefined language constructs, but
that doesn't mean we can't borrow some ideas from the functional world. Having
said that, it's also true that C# is lacking some powerful ways to combine
and generalize monads that are available in functional programming
languages.

Go learn some more Functional Programming!