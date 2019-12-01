---
title: Units of measurement in domain design
date: 2015-08-11
tags: ["Units of Measurement", "Domain Design", "DDD", "Clean Code"]
description: "If you have business application of any decent size, your most important code probably resides in domain logic. When working with 3rd party code, you can always find an answer on stack overflow or official documentation, but your domain is all yours. Try to make it as simple and readable as possible, and it will always pay you back. Today I want to discuss one aspect of writing clean domain code: units of measurement. It is important for any domain (or sub-domain) where you operate some physical measurements."
---
If you have business application of any decent size, your most important code probably resides in domain logic.
When working with 3rd party code, you can always find an answer on stack overflow or official documentation, but your domain is all yours. Try to make it as simple and readable as possible, and it will always pay you back.

Today I want to discuss one aspect of writing clean domain code: units of measurement. It is important for any domain (or sub-domain) where you operate some physical measurements.

Problem statement
-----------------

Our toy example will be about cars and fuel consumption. You receive some data about the trip of your car, e.g. an instance of

``` csharp
public interface ITrip
{
    double FuelUsed { get; }
    double Distance { get; }
}
```

Now you want to calculate the fuel consumption rate of your trip. You write
``` csharp
var fuelRate = trip.FuelUsed / trip.Distance;
```

You get the value, but what is it? Let's say you want a value of liters per 100 kilometers. You can assume that `FuelUsed` is in liters, and `Distance` is in kilometers. To be more explicit you refactor your code
``` csharp
public interface ITrip
{
    double FuelUsedInLiters { get; }
    double DistanceInKilometers { get; }
}

var fuelRateLitersPer100Kilometers = trip.FuelUsedInLiters * 100.0 / trip.DistanceInKilometers;
```

Now it's much more explicit, and probably good enough for such a small code example. For larger code bases, you will inevitably get into more problems:

1. You will start measuring same things in different units. E.g. you will store the distance in meters in the database, so you'll have to multiply by 1000 somewhere in persistence layer.

2. If you need to convert metric to imperial and back, you will get lots of constants here and there.

3. String formatting will become a tedious task. Be sure to call a right formatter for each implicit unit.

This does not work well. The code smell is called [Primitive Obsession](http://blog.ploeh.dk/2011/05/25/DesignSmellPrimitiveObsession/) and we should avoid this in production-grade code. Instead, we want the succinctness of first example in combination with strong compile-time checks and well-defined operations.

Defining the units
------------------

I tried several options like generic classes for units, but I ended up having a struct per measurement. The code is very boring and repetitive, but it provides me with the strongest compile-time checks and nice readability. If you are too bored with typing, you can do some code generation or just use 3rd party that suits you.
So, my end result looks like
``` csharp
public interface ITrip
{
    Volume FuelUsed { get; }
    Distance Distance { get; }
}
```

Let's see how Distance is defined (Volume will be almost exactly same):
``` csharp
public struct Distance
{
    private Distance(double kilometers)
    {
        this.Kilometers = kilometers;
    }

    public double Kilometers { get; }

    public double Meters => this.Kilometers / 1000.0;

    public static readonly Distance Zero = new Distance(0.0);

    ...
}
```

Several important things to notice here:

1. It's a struct.

2. It's immutable. Once an instance is created, its properties can't be changed anymore.

3. Constructor is private. I don't actually want people to create instances directly: `new Distance(123)` reads pretty horribly, keep reading to see better options.
   Of course, default constructor is still public, but you can only create a zero value with it.

4. Better way of creating zero distance is to call Zero static field.


Instantiation
-------------

So, how do we create measurement objects?

### Factory method

The classic way is a set of static factory methods:
```cs
public static Distance FromKilometers(double kilometers)
{
    return new Distance(kilometers);
}

public static Distance FromMeters(double meters)
{
    return new Distance(meters / 1000.0);
}
```

Usage is as simple as `var distance = Distance.FromMeters(234);`

### Extension method

Imagine you have the following code which converts an integer value of a database result into our units
```cs
trip.Distance = Distance.FromMeters(database.ReadInt32("TotalDistance")
                        .GetDefaultOrEmpty());
```

Such a long expression reads better with a fluent interface like
```cs
trip.Distance = database.ReadInt32("TotalDistance")
                        .GetDefaultOrEmpty()
                        .MetersToDistance();
```

`MetersToDistance` in this case is an extension method:

```cs
public static class DistanceExtensions
{
    public static Distance MetersToDistance(this double meters)
    {
        return Distance.FromMeters(meters);
    }
}
```

### Operator with static class using

C# 6 brings us a new language construct. Now we can import a static helper class
```cs
using static Units.Constants;
```

And then we can write something like
```
var distance = 10.0 * km;
```

where `km` is defined in that static class:

```cs
public static class Constants
{
    public static readonly Distance km = Distance.FromKilometers(1.0);
}
```

This may not look like idiomatic C#, but I think it's very good at least for writing unit tests:
```cs
var target = new Trip
{
    DistanceOnFoot = 5 * km,
    DistanceOnBicycle = 10 * km,
    DistanceOnCar = 30 * km
};
target.TotalDistance.Should().Be((30 + 10 + 5) * km);
```

For this to compile you just need to define the operator overload:
```cs
public static Distance operator*(int value, Distance distance)
{
    return Distance.FromKilometers(value * distance.Kilometers);
}
```

Conversion and printing
-----------------------

More advanced unit conversions are easy with unit classes. A common use case would be to convert metric units to imperial system. All you need to do is to add another calculated property

```cs
// Distance class
private const double MilesInKilometer = 0.621371192;
private const double FeetInMeter = = 3.2808399;

public double Miles => this.Kilometers * MilesInKilometer;

public double Feet => this.Meters * FeetInMeter;
```

Another common task is printing (formatting) unit values into string. While you can (and should) implement some basic version of it in `ToString()` method, I advise against doing all the formatting inside the unit class. The formatting scenarios can be quite complex:
* Format based on user preferences (metric/imperial)
* Pick units based on the value (e.g. 30 m but 1.2 km, not 1200 m)
* Localization to different languages
* Rounding to some closest value

If you do all that in the unit class, it's going to violate the single responsibility principle. Just create a separate class for formatting and put all those rules there.

Unit derivation
---------------
Once you write more unit classes, you will definitely want to derive the calculation result of two units into the third one. In our example, we want to divide `Volume` of fuel used by `Distance` to get fuel `ConsumptionRate`.

There's no magic that you could do here. You will have to define `ConsumptionRate` class the same way you defined the other two, and then just overload the operation
```cs
public static ConsumptionRate operator/(Volume volume, Distance distance)
{
    return ConsumptionRate
        .FromLitersPer100Kilometers(volume.Liters * 100.0 / distance.Kilometers);
}
```

Of course, you'll have to define all the required combinations explicitly.

If you defined Constants as described above, you'll be able to instantiate values in your tests in the following way:
```cs
var fuelRate = 7.5 * lit / (100 * km);
```

Should I use 3rd party libraries for that?
------------------------------------------

It depends. Of course, people implemented all this functionality about 1 million times before you, so there are numerous libraries on GitHub.

I would say, if you start a new project and you don't have a strong opinion about the unit code, just go grab the library and try to use it.

At the same time, for existing code base, it might be easier to introduce your own implementation which would resemble something that you already use.

Also, I have another reason for my own implementation. I'm using units all over the code base of domain logic, the very heart of the software, the exact place where I want full control. I find it a bit awkward to introduce a 3rd party dependency in domain layer.