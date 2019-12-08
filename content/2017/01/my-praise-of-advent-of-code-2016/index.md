---
title: My Praise of Advent of Code 2016
date: 2017-01-26
thumbnail: teaser.png
tags: ["FSharp", "Programming Puzzles", "Advent of Code", "Programming Puzzles"]
---

During the last days of December I was pleasing my internal need for solving
puzzles and tricky tasks by going through
[Advent of Code 2016](http://adventofcode.com) challenge.

The idea is simple: every day since December 1st to 25th, the site publishes
a new brain teaser. They are all aligned into one story: the Bad Easter Bunny
has stolen all the Chrismas gifts from Santa, and now you are the hero who
should break into the Bunny's headquarters and save the gifts for the kids.

Having said that, each challenge is independent from the others, so you can
solve them in arbitrary order if you want.

![Advent Of Code Levels](/levelmap.png)
*Advent Calendar in dark ASCII*

A puzzle consists of a description and an input data set associated with it.
The solution is typically represented as a number or a short string, so it
can be easily typed into the textbox. However, to get this solution you need to
implement a program: computing it manually is not feasible.

I started a bit late and got just the first 11 puzzles solved. Each puzzle
is doable in one sitting, usually half-an-hour to a couple hours of work,
which is very nice.

Some problems are purely about the correctness of your solution. The most
engaging tasks were also computationally intensive, such that a straightforward
solution took too much time to run to completion. You need to find a
shortcut to make it faster, which is always fun.

![Problem Solved!](/solved.png)
*You collect stars for providing the correct answers*

Apart from generic joy and satisfaction that one gets from solving programming
challenges like these, I also consider it a good opportunity to try a
new programming language or a paradygm.

As I said, the tasks are relatively small, so you can feel the sense of
accomplishment quite often, even being not very familiar with the programming
language of choice.

There are many other people solving the same puzzles and also sharing their
solutions online. You can go and find the other implementations of a task
that you just solved, and compare it to your approach. That's the great way
to learn from other people, broaden your view and expose yourself to new
tricks, data structures and APIs.

I picked F# as my programming language for Advent of Code 2016. I chose to restrict
myself to immutable data structures and pure functions. And it played out really nice,
I am quite happy with speed of development, readability and performance of
the code.

![Day 8 solved](/day8.png)
*Solution to one of the puzzles*

You can find my code for the first 11 puzzles in
[my github account](https://github.com/mikhailshilkov/AdventOfCode2016).
Full sets of F# solutions are available from
[Mark Heath](https://github.com/markheath/advent-of-code-2016/) and
[Yan Cui](https://github.com/theburningmonk/AdventOfCodeFs).

I included one of the solutions into
[The Taste of F# talk](https://mikhail.io/2017/01/functional-programming-fsharp-talks/) that I did
at a user group earlier this month.

Next year I'll pick another language and will start on December 1st. I invite
you to join me in solving Advent of Code 2017.

Kudos to [Eric Wastl](https://twitter.com/ericwastl) for creating and
maintaining the [Advent of Code web site](http://adventofcode.com).