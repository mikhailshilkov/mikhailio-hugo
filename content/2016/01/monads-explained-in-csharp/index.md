---
title: Monads explained in C#
date: 2016-01-25
tags: ["Functional Programming", "Monads", "LINQ"]
---

*The newer and much longer version of this article is now available:*
[Monads explained in C# (again)](https://mikhail.io/2018/07/monads-explained-in-csharp-again/)

It looks like there is a mandatory post that every blogger who learns functional programming should write:
what a Monad is. Monads have the reputation of being something very abstract and very confusing for every
developer who is not a hipster Haskell programmer. They say that once you understand what a monad is, you
loose the ability to explain it in simple language. Doug Crockford was the first one to lay this rule down, but
it becomes kind of obvious once you read 3 or 5 explanations on the web. Here is my attempt, probably doomed
to fail :)

Monads are container types
--------------------------

Monads represent a class of types which behave in the common way.

Monads are containers which encapsulate some kind of functionality. On top of
that, they provide a way to combine two containers into one. And that's about it.

The goals of monads are similar to generic goals of any encapsulation in
software development practices: hide the implementation details from the client,
but provide a proper way to use the hidden functionality.

It's not because we
want to be able to change the implementation, it's because we want to make the
client as simple as possible and to enforce the best way of code structure.
Quite often monads provide the way to avoid imperative code in favor of
functional style.

Monads are flexible, so in C# we could try to represent a monadic type as
a generic class:

``` csharp
public class Monad<T>
{
}
```

Monad instances can be created
------------------------------

Quite an obvious statement, isn't it. Having a class `Monad<T>`, there should
be a way to create an object of this class out of an instance of type `T`.
In functional world this operation is known as `Return` function. In C# it
can be as simple as a constructor:

``` csharp
public class Monad<T>
{
    public Monad(T instance)
    {
    }
}
```

But usually it makes sense to define an extension method to enable fluent
syntax of monad creation:

``` csharp
public static class MonadExtensions
{
    public static Monad<T> Return<T>(this T instance) => new Monad<T>(instance);
}
```

Monads can be chained to create new monads
------------------------------------------

This is the property which makes monads so useful, but also a bit confusing.
In functional world this operation is expressed with the `Bind` function
(or `>>=` operator). Here is the signature of `Bind` method in C#:

``` csharp
public class Monad<T>
{
    public Monad<TO> Bind<TO>(Func<T, Monad<TO>> func)
    {
    }
}
```

As you can see, the `func` argument is a complicated thing. It accepts an
argument of type `T` (not a monad) and returns an instance of `Monad<TO>`
where `TO` is another type. Now, our first instance of `Monad<T>` knows
how to bind itself to this function to produce another instance of monad
of the new type. The full power of monads comes when we compose several of
them in one chain:

``` csharp
initialValue
    .Return()
    .Bind(v1 => produceV2OutOfV1(v1))
    .Bind(v2 => produceV3OutOfV2(v2))
    .Bind(v3 => produceV4OutOfV3(v3))
    //...
```

Let's have a look at some examples.

<a name="maybe"></a>
Example: Maybe (Option) type
----------------------------
`Maybe` is the 101 monad which is used everywhere. `Maybe` is another approach
to dealing with 'no value' value, alternative to the concept of `null`.
Basically your object should never be null, but it can either have `Some`
value or be `None`. F# has a maybe implementation built into the language:
it's called `option` type. Here is a sample implementation in C#:

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

    public Maybe<TO> Bind<TO>(Func<T, Maybe<TO>> func) where TO : class
    {
        return value != null ? func(value) : Maybe<TO>.None();
    }

    public static Maybe<T> None() => new Maybe<T>();
}
```

``` csharp
public static class MaybeExtensions
{
    public static Maybe<T> Return<T>(this T value) where T : class
    {
        return value != null ? new Maybe<T>(value) : Maybe<T>.None();
    }
}
```

Return function is implemented with a combination of a public constructor
which accepts `Some` value (notice that `null` is not allowed) and a static
`None` method returning an object of 'no value'. `Return` extension method
combines both of them in one call.

`Bind` function is implemented explicitly.

Let's have a look at a use case. Imagine we have a traditional repository
which loads data from an external storage (no monads yet):

``` csharp
public interface ITraditionalRepository
{
    Customer GetCustomer(int id);
    Address GetAddress(int id);
    Order GetOrder(int id);
}
```

Now, we write a client class which loads data one by one and tries to find
a shipper:

``` csharp
Shipper shipperOfLastOrderOnCurrentAddress = null;
var customer = repo.GetCustomer(customerId);
if (customer?.Address != null)
{
    var address = repo.GetAddress(customer.Address.Id);
    if (address?.LastOrder != null)
    {
        var order = repo.GetOrder(address.LastOrder.Id);
        shipperOfLastOrderOnCurrentAddress = order?.Shipper;
    }
}
return shipperOfLastOrderOnCurrentAddress;
```

Note, that the code assumes that repository returns `null` if some entity
is not found, although nothing in the type system shows that. Then, there
is a number of `null` checks (facilitated with elvis operator). The code gets
a bit cluttered and less linear.

Here is an alternative repository which returns `Maybe` type:

``` csharp
public interface IMonadicRepository
{
    Maybe<Customer> GetCustomer(int id);
    Maybe<Address> GetAddress(int id);
    Maybe<Order> GetOrder(int id);
}
```

The contract is more explicit: you see that `Maybe` type is used, so you
will be forced to handle the case of absent value.

And here is how the above example can be rewritten with `Bind` method
composition:

``` csharp
Maybe<Shipper> shipperOfLastOrderOnCurrentAddress =
    repo.GetCustomer(customerId)
        .Bind(c => c.Address)
        .Bind(a => repo.GetAddress(a.Id))
        .Bind(a => a.LastOrder)
        .Bind(lo => repo.GetOrder(lo.Id))
        .Bind(o => o.Shipper);
```

There's no branching anymore, the code is fluent and linear.

If you think that the syntax looks very much like a LINQ query with a bunch
of `Select` statements, you are not the only one ;) One of the common
implementations of `Maybe` implements `IEnumerable` interface which allows
a more C#-idiomatic binding composition. Actually:

IEnumerable + SelectMany is a monad
-----------------------------------

`IEnumerable` is an interface for enumerable containers.

Enumerable containers can be created - thus the `Return` monadic operation.

The `Bind` operation is defined by the standard LINQ extension method, here
is its signature:

``` csharp
public static IEnumerable<B> SelectMany<A, B>(
    this IEnumerable<A> first,
    Func<A, IEnumerable<B>> selector)
```

And here is an example of composition:

``` csharp
IEnumerable<Shipper> someWeirdListOfShippers =
    customers
        .SelectMany(c => c.Addresses)
        .SelectMany(a => a.Orders)
        .SelectMany(o => o.Shippers);
```

The query has no idea about how the collections are stored (encapsulated in
containers). We use functions `A -> IEnumerable<B>` to produce new enumerables
(`Bind` operation).

Monad laws
----------

There are a couple of laws that `Return` and `Bind` need to adhere to, so
that they produce a proper monad.

**Identity law** says that that `Return` is a neutral operation: you can safely
run it before `Bind`, and it won't change the result of the function call:

``` csharp
// Given
T value;
Func<T, M<U>> f;

// == means both parts are equivalent
value.Return().Bind(f) == f(value)
```

**Associativity law** means that the order in which `Bind` operations
are composed does not matter:

``` csharp
// Given
M<T> m;
Func<T, M<U>> f;
Func<U, M<V>> g;

// == means both parts are equivalent
m.Bind(f).Bind(g) == m.Bind(a => f(a).Bind(g))
```

The laws may look complicated, but in fact they are very natural
expectations that any developer has when working with monads, so don't
spend too much mental effort on memorizing them.

Conclusion
----------

You should not be afraid of the "M-word" just because you are a C# programmer.
C# does not have a notion of monads as predefined language constructs, but
it doesn't mean we can't borrow some ideas from the functional world. Having
said that, it's also true that C# is lacking some powerful ways to combine
and generalize monads which are possible in Haskell and other functional
languages.