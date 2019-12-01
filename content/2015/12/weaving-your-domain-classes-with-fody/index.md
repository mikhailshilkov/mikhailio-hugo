---
title: Weaving your domain classes with Fody
date: 2015-12-22
tags: ["Fody", "DDD", "Code Generation"]
description: When I model the business domain with C#, the resulting data structures tend to contain a lot of boilerplate code. It's repeated from class to class and it gets more difficult to see the essence of the model behind the repetitive cruft. In this article I show off one trick to reduce this boilerplate code with Fody library.
---
When I model the business domain with C#, the resulting data structures tend to contain a lot of boilerplate code. It's repeated from class to class and it gets more difficult to see the essence of the model behind the repetitive cruft. Here is a simplistic example, which illustrates the problem. Let's say we are modelling Trips, and for each `Trip` we need to keep track of `Origin`, `Destination` and `Vehicle` which executes the `Trip`, nothing else. Here is a code to create an sample trip:
``` csharp
var trip = new Trip(
    origin: new Location("Paris", geoParis),
    destination: new Location("Amsterdam", geoAmsterdam),
    vehicle: new Vehicle("TBL-12-H", Type.HeavyTruck)
```

Let's include these requirements as parts of our trip model:
- It has a constructor which accepts three arguments (see above)
- It has 3 read-only properties which are assigned from constructor parameters
- It should not allow null values to be assigned to these properties via constructor
- It should be a Value object, that is two objects with same properties should be equal

Initial version
---------------

First, let's implement these requirement in a usual way:
``` csharp
public class Trip : IEquatable<Trip>
{
    public Trip(Location origin, Location destination, Vehicle vehicle)
    {
        if (origin == null) throw new ArgumentNullException(nameof(origin));
        if (destination == null) throw new ArgumentNullException(nameof(destination));
        if (vehicle == null) throw new ArgumentNullException(nameof(vehicle));

        this.Origin = origin;
        this.Destination = destination;
        this.Vehicle = vehicle;
    }

    public Location Origin { get; }
    public Location Destination { get; }
    public Vehicle Vehicle { get; }

    public bool Equals(Trip other)
    {
        return Equals(this.Origin, other.Origin)
            && Equals(this.Destination, other.Destination)
            && Equals(this.Vehicle, other.Vehicle);
    }

    public override bool Equals(object obj)
    {
        if (ReferenceEquals(null, obj))
        {
            return false;
        }
        if (ReferenceEquals(this, obj))
        {
            return true;
        }
        if (obj.GetType() != this.GetType())
        {
            return false;
        }
        return Equals((Trip)obj);
    }

    public override int GetHashCode()
    {
        unchecked
        {
            var hashCode = this.Origin.GetHashCode();
            hashCode = (hashCode * 397) ^ this.Destination.GetHashCode();
            hashCode = (hashCode * 397) ^ this.Vehicle.GetHashCode();
            return hashCode;
        }
    }

    public static bool operator ==(Trip tripA, Trip tripB)
    {
        return object.Equals(tripA, tripB);
    }

    public static bool operator !=(Trip tripA, Trip tripB)
    {
        return !object.Equals(tripA, tripB);
    }
}
```

That's a lot of code! It's very repetitive but it's also tricky: you can implement it incorrectly in some slight way that wouldn't be easy to catch until it silently fails one day. So imagine how many tests you need to validate it.

I implemented this code with help of Resharper, which makes it so much easier, but the code is still a heavy luggage to carry on. This class is hard to read and hard to change - every time you add a property you should not forget to update all the corresponding methods.

Are there other options?

Introducing Fody
----------------

[Fody](https://github.com/Fody/Fody) is an extensible tool for weaving .NET assemblies. It means that you can use it to improve your code automatically at the time of compilation. Fody itself doesn't do much to the code, but it has a collection of plugins to actually change it. For this example I will use two of them:
- [**NullGuard**](https://github.com/Fody/NullGuard) - guards all the input parameters, output parameters and return values of all types in a current assembly not to be null. If null value is passed or returned, the weaved code with throw an exception.
- [**Equals**](https://github.com/Fody/Equals) - you can mark a class with `[Equals]` attribute and Fody will implement `Equals()` and `GetHashCode()` methods and `==` operator for you by comparing all public properties of the annotated class.

To install them just execute
``` ps
PM> Install-Package NullGuard.Fody
PM> Install-Package Equals.Fody
```

The root of your project will now contain the following configuration file:
``` xml
<?xml version="1.0" encoding="utf-8"?>
<Weavers>
  <NullGuard IncludeDebugAssert="false" />
  <Equals />
</Weavers>
```
(I've added `IncludeDebugAssert` attribute manually to disable assert statements in debug mode)

Let's adjust our class to make use of the plugins:
``` csharp
[Equals]
public class Trip
{
    public Trip(Location origin, Location destination, Vehicle vehicle)
    {
        this.Origin = origin;
        this.Destination = destination;
        this.Vehicle = vehicle;
    }

    public Location Origin { get; }
    public Location Destination { get; }
    public Vehicle Vehicle { get; }
}
```

And that's it! We still get the same functionality but the code is just trivial. Let's see how it works:
- `Equals` attribute means that we want Fody plugin to implement all the equality-related boilerplate code for this class, including operators and `IEquatable<T>` implementation. So this plugin is in *opt-in* mode.
- I used no attributes from `NullGuard` plugin. This plugin works in *opt-out* mode, i.e. it changes all the classes by default, and if you don't want it for some piece of code - you can always opt out. This default makes a lot of sense to me: I don't want any nulls in my code unless I really need them due to some external contracts.

Let's open the resulting assembly in [ILSpy](http://ilspy.net/) to see what it compiles to. Here is the constructor:
``` csharp
public Trip(Location origin, Location destination, Vehicle vehicle)
{
    bool flag = origin == null;
    if (flag)
    {
        throw new ArgumentNullException("origin");
    }
    bool flag2 = destination == null;
    if (flag2)
    {
        throw new ArgumentNullException("destination");
    }
    bool flag3 = vehicle == null;
    if (flag3)
    {
        throw new ArgumentNullException("vehicle");
    }
    this.<Origin>k__BackingField = origin;
    this.<Destination>k__BackingField = destination;
    this.<Vehicle>k__BackingField = vehicle;
}
```

It's bit more verbose but essentially equivalent to what I did manually before. By default null guard will be very strict, so you will see that even auto-property's return values are checked:
``` csharp
public Location Origin
{
    [CompilerGenerated]
    get
    {
        Location expr_06 = this.<Origin>k__BackingField;
        if (expr_06 == null)
        {
            throw new InvalidOperationException("[NullGuard] Return value of property 'ETA.Domain.Location ETA.Domain.Trip::Origin()' is null.");
        }
        return expr_06;
    }
}
```

It doesn't make much sense to me, so I configured Fody on assembly level to check only arguments and return values:
``` csharp
[assembly: NullGuard(ValidationFlags.Arguments | ValidationFlags.ReturnValues)]
```

Here is a set of operations related to equality (I'll skip the body in sake of brevity):
``` csharp
public class Trip : IEquatable<Trip>
{
    [GeneratedCode("Equals.Fody", "1.4.6.0"), DebuggerNonUserCode]
    private static bool EqualsInternal(Trip left, Trip right) { ... }
    [GeneratedCode("Equals.Fody", "1.4.6.0"), DebuggerNonUserCode]
    public override bool Equals(Trip other) { ... }
    [GeneratedCode("Equals.Fody", "1.4.6.0"), DebuggerNonUserCode]
    public override bool Equals(object obj) { ... }
    [GeneratedCode("Equals.Fody", "1.4.6.0"), DebuggerNonUserCode]
    public override int GetHashCode() { ... }
    [GeneratedCode("Equals.Fody", "1.4.6.0"), DebuggerNonUserCode]
    public static bool operator ==(Trip left, Trip right) { ... }
    [GeneratedCode("Equals.Fody", "1.4.6.0"), DebuggerNonUserCode]
    public static bool operator !=(Trip left, Trip right) { ... }
}
```

There is a catch (at least at the time of writing): the auto-generated `==` and `!=` operators won't work properly if you use them inside the same assembly where the type is defined. That's because the C# compiler will only use these operators properly if they are defined at compile time, and they only get defined after the compilation (weaving takes place after IL is produced). See [the issue on GitHub](https://github.com/Fody/Equals/issues/10) for details.

Bonus - a proper solution
------------------------

Here is how you actually should define similar types:

``` fsharp
type Trip =
  { Origin : Location
    Destination : Location
    Vehicle : Vehicle }
```

No nulls are possible here and equality works out of the box. There's just one major detail: it's F#...