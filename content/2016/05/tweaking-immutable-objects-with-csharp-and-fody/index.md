---
title: Tweaking immutable objects with C# and Fody
date: 2016-05-13
tags: ["Fody","Functional Programming","Immutability","Code Generation"]
---

Immutable data structures provide a lot of benefits
to programmers, especially when representing domain 
[value objects](https://lostechies.com/joeocampo/2007/04/23/a-discussion-on-domain-driven-design-value-objects/). 
Immutability is an essential part of functional programming paradigm.
The concept is useful in object-oriented languages too, but you have
to pay some price to get this advantage.

In C# immutable classes are usually implemented with read-only
properties which are populated from constructor parameters. One of the 
disadvantages of this approach is the verbosity of creating a copy of an object
with one property value modified.

Example
-------

Let's have a look at an illustration of this problem. Let's say we have a value
type representing poker player statistics:

``` csharp
public class PlayerStats
{
    public PlayerStats(
        int hands, 
        int daysOnline,
        Money won, 
        Money expectedValue)
    {
        this.Hands = hands;
        this.DaysOnline = daysOnline;
        this.Won = won;
        this.ExpectedValue = expectedValue;
    }

    public int Hands { get; }
    public int DaysOnline { get; }
    public Money Won { get; }
    public Money ExpectedValue { get; }
}
```

We already see that it's quite verbose: basically we repeat each property name
five times. But the issue I'm discussing today is related to how we create 
a new object based on another object. Let's say we need to make a copy of 
a given statistics, but with `Hands` property increased by 1:

``` csharp
var increasedHands = new PlayerStats(
    existing.Hands + 1,
    existing.DaysOnline,
    existing.Won,
    existing.ExpectedValue);
```

Not as simple as we could hope. Also, there is some room for mistakes here. For 
instance, we could swap `Won` and `ExpectedValue` property calls
and compiler won't let us know because the types are the same. So we probably
want to use explicit constructor parameter names:

``` csharp
var increasedHands = new PlayerStats(
    hands: existing.Hands + 1,
    daysOnline: existing.DaysOnline,
    won: existing.Won,
    expectedValue: existing.ExpectedValue);
```

But that leads to even more typing and repetition...

Inspiration
-----------

F# is a functional-first language with immutability as first-class concept.
In F# value objects are usually modelled with Records, here is our example
reimplemented:

``` fsharp
type PlayerStats = {
    Hands: int
    DaysOnline: int
    Won: Money
    ExpectedValue: Money
}
```

Creation of new objects based on other objects is also solved properly in F#,
thanks to the **`with`** keyword :

``` fsharp
let increasedHands = { existing with Hands = existing.Hands + 1 }
```

All the properties are copied from the source record except for the ones
explicitly mentioned in the expression.

Defining With in C#
-------------------

There's no **`with`** operator in C#, but we can try to come up with an
alternative. We can define some fluent methods which would change
property values one by one (they don't change the original object, but
return a copy with changed value):

``` csharp
public PlayerStats WithHands(int hands) 
{
    return new PlayerStats(
        hands: hands,
        daysOnline: existing.DaysOnline,
        won: existing.Won,
        expectedValue: existing.ExpectedValue);
}

public PlayerStats WithDaysOnline(int daysOnline) { ... }
public PlayerStats WithWon(Money won) { ... }
public PlayerStats WithExpectedValue (Money expectedValue) { ... }
```

The method implementation is very tedious but the usage gets much cleaner:

``` csharp
var increasedHands = existing.WithHands(existing.Hands + 1);
```

One way to avoid repetitive code is to generate it.

With.Fody Plugin
----------------

In [one of my previous posts](https://mikhail.io/2015/12/weaving-your-domain-classes-with-fody/)
I described how C# value objects can be made less painful with 
[Fody](https://github.com/Fody/Fody) - a tool which changes your assembly at
compilation time to provide some desired properties in automated and reliable
fashion.

Please welcome the new Fody plugin [**With.Fody**](https://github.com/mikhailshilkov/With.Fody) 
which auto-implements `With` method bodies for C# immutable classes.

Here is how to use this plugin for our imaginary example.

First, add a reference to NuGet pakages `Fody` and `With.Fody`.

Then, keep the `PlayerStats` class definition, but get rid of the bodies
of `WithXyz` methods. Keep the signature but return something trivial like
`null` or `this`:

``` csharp
public PlayerStats WithHands(int hands) => this;
public PlayerStats WithDaysOnline(int daysOnline) => this;
public PlayerStats WithWon(Money won) => this;
public PlayerStats WithExpectedValue (Money expectedValue) => this;
```

Compile the project and you will see the following line in Build Output:

```
>      Fody/With:   Added method 'With' to type 'PlayerStats'.
```

It means that the method bodies were re-implemented with calls to 
class constructor with proper parameter values.

The method stubs are needed to satisfy code completion tools like 
IntelliSense and Resharper, otherwise we could skip them altogether.

Single With() for Multiple Properties
-------------------------------------

In case you avoid [Primitive Obsession](https://mikhail.io/2015/08/units-of-measurement-in-domain-design/)
antipattern, you will often end up with classes which have unique types of 
properties, e.g.

``` csharp
public class TripProfile
{
    public TripProfile(
        Distance totalDistance,
        Speed averageSpeed,
        Volume fuelConsumed)
    {
        this.TotalDistance = totalDistance;
        this.AverageSpeed = averageSpeed;
        this.FuelConsumed = fuelConsumed;
    }

    public Distance TotalDistance { get; }
    public Speed AverageSpeed { get; }
    public Volume FuelConsumed { get; }
}
```

In this case, the plugin can be smart enough to figure out which property
you want to modify just by looking at the type of the argument. The single stub
method can look like this:

``` csharp
public TripProfile With<T>(T value) => this;
```

This would get compiled into 3 strongly typed `With` methods with `Distance`,
`Speed` and `Volume` arguments respectively. Resharper is still happy. And
if you make a mistake and try to call the generic `With` method with an
argument of wrong type (say `int`), the compiler will give you an error.

It is safe to call `With` methods in the same assembly where the class is defined:
the calls get adapted to the real implementation automatically.

How to Get Started with Your Classes
------------------------------------

Here are the requirements for the classes to be picked up by **`Fody.With`**:

1. Have a single constructor.
2. The constructor should have more than one argument.
3. For each constructor agrument, there must be a gettable property with
same name (case insensitive).
4. At least one `With` stub must be defined as described above.

You can check out more examples, look at the source code or raise an issue in
[With.Fody github repository](https://github.com/mikhailshilkov/With.Fody).

Give it a try and let me know what your think!