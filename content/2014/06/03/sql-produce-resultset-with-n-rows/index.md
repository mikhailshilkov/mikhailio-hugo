---
title: "SQL: produce resultset with N rows"
date: 2014-06-03
tags: ["Performance","SQL Server","T-SQL"]
description: Sometimes you need to produce a result set, which would contain N rows with numbers 1...N in each row. For example, I needed to calculate some statistics per week for N weeks starting from today and going back to the past.
---

Let's talk about T-SQL today.

Sometimes you need to produce a result set, which would contain N rows with numbers 1...N in each row. For example, I needed to calculate some statistics per week for N weeks starting from today and going back to the past.

Here is a table funtion which does the enumeration:

    CREATE FUNCTION dbo.fnEnumerateNumbers(@max int)
    RETURNS TABLE
    RETURN
    WITH
     E1(N) AS (SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL
               SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL
               SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL
               SELECT 1),                 --10E1  or 10 rows
     E2(N) AS (SELECT 1 FROM E1 a, E1 b), --10E2  or 100 rows
     E4(N) AS (SELECT 1 FROM E2 a, E2 b), --10E4  or 10000 rows
     E8(N) AS (SELECT 1 FROM E4 a, E4 b)  --10E8  or 100000000 rows
    SELECT TOP (@max) N = ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
      FROM E8

Usage is trivial:

    SELECT N
      FROM dbo.fnEnumerateNumbers(100)

And here is how I solved the task of enumerating weeks:

    SELECT dateadd(week, 1 - N, getutcdate())
      FROM dbo.fnEnumerateNumbers(100)

There are multiple possibilities to implement similar function, but I believe this way is the best one in terms of performance. No temporary tables, no table reads, no dependencies on table existance, and you can define your maximum yourself.

Happy coding!