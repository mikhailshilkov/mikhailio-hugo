---
title: Comparing Scala to F#
date: 2016-08-05
tags: ["FSharp", "Scala", "Functional Programming", "Coursera"]
thumbnail: teaser.png
comments: true
---

F# and Scala are quite similar languages from 10.000 feet view. Both are
functional-first languages developed for the virtual machines where imperative
languages dominate. C# for .NET and Java for JVM are still *lingua franca*,
but alternatives are getting stronger.
<!--more-->

My background is in .NET ecosystem, so F# was the first of the two that I started
learning. At the same time, Scala seems to have more traction, largely due to
successful products and frameworks like Spark, Akka and Play. That's why I decided
to broaden my skill set and pick up some Scala knowledge. I've started with
[Functional Programming in Scala Specialization](https://www.coursera.org/specializations/scala) at Coursera.
While following the coursera, I'm doing some notes about which language features
in Scala I find interesting, or vice versa - missing compared to F#.

In no particular order, I want to share my notes of Scala vs F# in this blog post.

*Post updated based on comments by Mark Lewis and Giacomo Citi.*

Implicit Parameters
-------------------

A parameter of a function can be marked as implicit

``` scala
def work(implicit i:Int) = print(i)
```

and that means you can call the function without specifying the value for this parameter
and the compiler will try to figure out that value you (according to
the extensive set of rules), e.g.

``` scala
implicit val v = 2;
// ... somewhere below
work // prints '2'
```

I am not aware of any similar features in other language that I know, so I'm pretty sure
I don't understand it well enough yet :) At the same time, I think implicits are
very characteristic for Scala: they are a powerful tool, which can be used in many
valid scenarios, or can be abused to shoot in one's feet.

Underscore In Lambdas
---------------------

Underscores `_` can be used to represent parameters in lambda expressions
without explicitly naming them:

``` scala
employees.sortBy(_.dateOfBirth)
```

I think that's brilliant - very short and readable. Tuple values are represented
by `_1` and `_2`, so we can sort an array of tuples like

``` scala
profitByYear.sortBy(_._1)
```

This looks a bit hairy and should probably be used only when the meaning is obvious.
(In the example above I'm not sure if we sort by year or by profit...)

In F# underscore is used in a different sense - as "something to ignore". That makes
sense, but I would love to have a shorter way of writing lambda in

``` fsharp
empoyees |> List.sort (fun e -> e.dateOfBirth)
```

Any hint how?

Tail-Recursion Mark
-------------------

Any recursive function in Scala can be marked with `@tailrec` annotation,
which would result in compilation error if the function is not tail-recursive.
This guarantees that you won't get a nasty stack overflow exception.

``` scala
@tailrec
def boom(x: Int): Int = {
  if (x == 0) 0
  else boom(x-1) + 1
}
```

The code above won't compile, as the recursion can't be optimized by the
compiler.

The feature sounds very reasonable, although I must admit that I have
never needed it in *my* F# code yet.

Call By Name
------------

When you call a function in F#, the parameter values are evaluated before
the function body. This style of function substitution model is known as
Call by Value.

Same is the default in Scala. But there is an alternative: you can defer the
evaluation of parameters by marking them with an `=>` symbol:

``` scala
def callByName(x: => Int) = {
  println("x is " + x)
}
```

This style is known as Call by Name, and the evaluation is defered until the
parameter is actually used. So, if parameter is never used, its value
will never be evaluated. This code:

``` scala
val a:Option[Int] = Some(1)
val b = a getOrElse (2/0)
```

will set `b` to `1`, and no error will be thrown, even though we are dividing by zero
in function parameter. This is because the parameter of `getOrElse` is passed
by name.

The F# alternative `defaultArg` doesn't work this way, so the following code
will blow up:

``` fsharp
let a = Some(1)
let b = defaultArg b (2/0) // boom
```

You can get deferred evaluation by passing a function:

``` fsharp
let defaultArgFunc o (f: unit -> 'a) =
  match o with | Some v -> v | None -> f()

let b2 = defaultArgFunc a (fun () -> 2 / 0)
```

That's essentially what happens in Scala too, but the Scala syntax is
arguably cleaner.

Lack of Type Inference
----------------------

Slowly moving towards language design flavours, I'll start with Type Inference.
In Scala, type inference seems to be quite limited. Yes, you don't have to
explicitly define the types of local values or (most of the time) function return
types, but that's about it.

``` scala
def max (a: Int, b:Int) = if (a > b) a else b
```

You have to specify the types of all input parameters, and that's quite a bummer
for people who are used to short type-less code of F# (or Haskell, OCaml and others,
for that matter).

Type inference in F# plays another significant role: automatic type generalization.
F# compiler would make types as generic as possible, based on implementation.

``` fsharp
let max a b = if a > b then a else b
```

The type of the function above is `'a -> 'a -> 'a`. Most people wouldn't make
it generic from get-go, but compiler helps in this case.

Functional vs Object-Oriented Style
-----------------------------------

Both F# and Scala are running on top of managed object-oriented virtual machines,
and at the same time both languages enable developers to write functional code.
Functional programming means operating immutable data structures in pure, free of
side effects operations. Without questioning all this, I find pure functional
Scala code to be written in much more object-oriented *style* compared to F#.

Classes and objects are ubiquitous in Scala: they are in each example given
in Martin Odersky's courses. Most F# examples refrain from classes unless needed.
F# official guidance is to never expose non-abstract classes from F# API!

Scala is really heavy about inheritance. They even introduced quasi-multiple inheritance:
traits. `Stream` inherits from `List`, and `Nothing` is a subtype of every other type,
to be used for some covariance tricks.

Operations are usually defined as class methods instead of separate functions. For
example the following Scala code

``` scala
word filter (c => c.isLetter)
```

would filter a string to letters only. Why is `isLetter` defined as a method of
`Char`? I don't think it's essential for the type itself...

Usage of Operators
------------------

It looks like Scala culture inclines more towards the usage of different
operators, not only for arithmetic operations but also for different classes
from standard library and domain-specific code too. The basic ones are nice,
e.g. list concatenation:

``` scala
List(1, 2) ++ List(3, 4)
```

but others look awkward to me, e.g. stream concatenation:

``` scala
Stream(1) #::: Stream(2)
```

Akka streams sweetness:

``` scala
in ~> f1 ~> bcast ~> f2 ~> merge ~> f3 ~> out
            bcast ~> f4 ~> merge
```

This can go to quite an extreme, similar to what `scalaz` library does.

My default would be not to use operators unless you are sure that every
reader is able to instantly understand what it means.

Partial Application
-------------------

Not a huge difference, but F# functions are curried by default, while Scala
functions aren't. Thus, in F# partial application just works, all the time

``` fsharp
let add a b = a + b
let add3 = add 3
let sum = add3 5 // 8
```

Scala function

``` scala
def add (a: Int, b: Int) = a + b
```

is not curried, but Underscore comes to the rescue

``` scala
val add3: (Int) => Int = add(3, _)
val sum = add3(5) // 8
```

Note how I miss the type inference again.

The parameter order is very important in F#: the short syntax
will partially apply parameters from left to right. In Scala, you can
put `_` at any position, which gives you some flexibility.

Single-Direction Dependency
---------------------------

F# compiler doesn't allow circular dependencies. You can't use a function
before you've defined it. Here is what Expert F# book has to say about
that:

> Managing dependencies and circularity is one of the most difficult
> and fundamental problems in good software design. The files in
> an F# project are presented to the F# compiler in a compilation
> order: constructs in the earlier files can't refer to declarations
> in the later files. This is a mechanism to enforce layered design,
> where software is carefully organized into layers, and where one
> layer doesn't refer to other layers in a cyclic way (...) to help you
> write code that is reusable and organized
> into components that are, where possible, independent and not
> combined into a "tangle" of "spaghetti code".

I think this is huge. F# forces you to structure your code in a way that
avoid mutual dependencies between different functions, types and modules.
This reduces the complexity and coupling, makes the developers avoid some
of the design pitfalls.

There's nothing like that in Scala. You are on your own.

Conclusion
----------

Of course I did not cover all the distinctions, for instance active patterns,
type providers, computation expressions in F# and type classes, higher
kinded types, macros in Scala.

Obviously, both Scala and F# are very capable languages, and I am still
picking up the basics of them. While similar in many aspects, they made
several different choices along the language design trade-offs.

P.S. Overheard on Twitter:

> F# isn't a bad language, it's just attached to a bad platform...
> The opposite of Scala actually.

UPDATE: Thanks everyone for the great comments; please check out
[this reddit](https://redd.it/4whxhj) and [lobste.rs](https://lobste.rs/s/ewhrpt)
to see more of them.