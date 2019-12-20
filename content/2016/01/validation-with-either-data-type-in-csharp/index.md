---
title: Validation with Either data type in C#
date: 2016-01-06
tags: ["Functional Programming", "Clean Code"]
description: In this article we will employ a functional monadic concept Either to make validation code more expressive and easier to maintain.
---

In this article we will employ a functional monadic concept **Either** to make validation
code more expressive and easier to maintain.

Problem
-------

Let's say we get a request from some client code and we need to check if this
request is actually valid. If it's not valid, we want to make a detailed description
of the problems that we identified. If it is valid, we want to produce a response
about the successful acceptance of the request. Let's define the classes:

``` csharp
public class Request { ... }
public class Response { ... }
public class ValidationError { ... }
```

Now, we need a function which would accept a `Request` and would return `Response`
or `ValidationError`. Let's look at some possible solutions.

Throw an exception
------------------

Validation *error* sounds like it could be an exception:

``` csharp
public Response Validate(Request r)
{
   if (!Valid(r))
       throw new ValidationException(new ValidationError(...));

   return new Response(r);
}
```

This approach is really bad though. You have to declare a special exception
class to hold the validation error. But even worse, exception handling is not
explicit - you don't see the exception type when you look at method signature.
Client processing code is going to be messed up because of exception handling.
Never use exceptions for your business logic flow.

Output parameter
----------------

We could make an output parameter of `ValidationError` type:

``` csharp
public Response Validate(Request r, out ValidationError error)
{
    if (Valid(r))
    {
        error = new ValidationError(...);
        return null;
    }

    error = null;
    return new Response(r);
}
```

Now the interface is more explicit: client won't be able to completely ignore
the fact that an error is possible. But output parameters are not really
easy to use in C#, especially in fluent-style client code. Moreover, we are
using nulls as a way to represent missing object, which is a smell by itself,
because nulls are not explicit. Never use nulls in your business logic.

Return the combined result
--------------------------

We could declare a container class which would keep both `Response` and
`ValidationError`, and then return it from the method.

``` csharp
public class Both<TData, TError>
{
    public TData Data { get; set; }
    public TErrro Error { get; set; }
}
...
public Both<Response, ValidationError> Validate(Request r)
{
    return Valid(r)
        ? new Both<Response, ValidationError> { Data = new Response(r) }
        : new Both<Response, ValidationError> { Error = new ValidationError(...) };
}
```

Looks much nicer, we are getting there. Now it's a pure function with input
and output parameters, but we still use null for result state representation.
Let's see how we can solve it with **Either** data structure.

Introducing Either
------------------
Instead of returning `Both` with nullable properties, let's return `Either`
with just one of them. When constructing an object, you can specify either
a 'left' or a 'right' argument, but not both.

``` csharp
public class Either<TL, TR>
{
    private readonly TL left;
    private readonly TR right;
    private readonly bool isLeft;

    public Either(TL left)
    {
        this.left = left;
        this.isLeft = true;
    }

    public Either(TR right)
    {
        this.right = right;
        this.isLeft = false;
    }
}
```

Now, the main difference is in how the client uses it. There are no properties
to accept `Left` and `Right` parts. Instead we define the following method:

``` csharp
public T Match<T>(Func<TL, T> leftFunc, Func<TR, T> rightFunc)
    => this.isLeft ? leftFunc(this.left) : rightFunc(this.right);
```

That's the concept of pattern matching implemented in C# world. If a left value
is specified, `Match` will return the result of the left function, otherwise the result
of the right function.

Another improvement would be to create explicit operators for easy conversions
from left and right types:

``` csharp
public static implicit operator Either<TL, TR>(TL left) => new Either<TL, TR>(left);

public static implicit operator Either<TL, TR>(TR right) => new Either<TL, TR>(right);
```

Let's have a look at a complete example.

Why it's great
--------------

Here is the service code written with `Either`:

``` csharp
public Either<Response, ValidationError> Validate(Request r)
{
    return Valid(r)
        ? Data = new Response(r)
        : new ValidationError(...);
}
```

Clean and nice! Now a simplistic client:

``` csharp
var validated = service.Validate(request);
Console.WriteLine(
    validated.Match(
        result => $"Success: {result}",
        error => $"Error: {error}")
    );
```

Simple, readable , no conditionals, no null checks, no way to silently ignore the fact that
validation may fail.

Show me the code
----------------

You can find the definition of `Either` class in my [github repo](https://github.com/mikhailshilkov/mikhailio-samples/blob/master/Either%7BTL%2CTR%7D.cs).

**Update.** Here is a link to an awesome talk on this topic:
[Railway oriented programming: Error handling in functional languages by Scott Wlaschin](https://vimeo.com/113707214)
