---
title: T-SQL MERGE statement is underrated
date: 2016-04-15
tags: ["T-SQL", "SQL Server", "Dapper"]
---

How many times did you write a SQL to **save** a row without knowing whether the same
primary key already exists or not? You just get an object in your data access layer and
you want to save all fields into the database. 

But there is no SAVE statement in SQL, so effectively you need to come up with your 
implementation of "INSERT or UPDATE" command.

Example
-------

Let's take a concrete example. You have a person object with just 3 fields, here is the
type definition:

``` csharp
public class Person
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}
```

Persons are entities, so we chose a GUID for the primary key column. We always generate
the unique identifier at client side and just want to save the `Person`.

Typical Solutions
-----------------

The typical T-SQL developer's toolbox contains `SELECT`, `INSERT`,
`UPDATE` and `DELETE` statements. `DELETE` is of no use here, but the combination of the other
three can be employed to complete the task. The most straightforward option is

``` sql
IF NOT EXISTS(SELECT 1 FROM Person WHERE Id = @Id)
  INSERT Person (Id, Name, Email) VALUES (@Id, @Name, @Email)
ELSE
  UPDATE Person SET Name = @Name AND Email = @Email WHERE Id = @Id
```

It's 4 lines of code instead of one, but it works. Being more fancy, we can reduce the code to
3 lines of code:

``` sql
UPDATE Person SET Name = @Name AND Email = @Email WHERE Id = @Id
IF @@ROWCOUNT = 0 THEN
  INSERT Person (Id, Name, Email) VALUES (@Id, @Name, @Email)
``` 

It should also perform faster if you update more often then insert.

Solved? Not completely...

The problem is that sometimes it doesn't
work. By default, `SELECT` doesn't lock the table, so in race condition scenario there
may be another thread which would insert another row with same Id between the execution of
two statements (or delete the existing row for that matter). Ouch.

If you think that's just a theoretical problem... Well, it might be for our tiny shiny `Person`
table, but it will happen for the tables of decent sizes with complex update patterns.

Transactions
------------

What do we do when the execution of two statements can cause race conditions with
unpredictable results? We use transactions! So, start a transaction before the statement,
then lock the table in `SELECT` and commit after all is done. It works, but quite some downsides
again:

- Lots of boilerplate code
- Easy to make a mistake (Which lock do we need? `updlock`? `holdlock`? `tablockx`?)
- You might get into a deadlock, so need to handle it gracefully

MERGE
-----

Starting with SQL Server 2008, Microsoft introduced the [MERGE](https://msdn.microsoft.com/ru-ru/library/bb510625.aspx)
statement. Generally, it's quite powerful and can be used to save all the different rows of a source
table into a target table. But we can also use it for our simple task of saving a person.

`MERGE` is just one statement, so it's atomic and consistent. It performs very well. 
But the syntax is... oh my god, it's horrible. Your eyes might bleed:

``` sql
MERGE Person AS target
USING (SELECT @Id, @Name, @Email) AS source (Id, Name, Email)
   ON (target.Id = source.Id)
 WHEN MATCHED THEN 
      UPDATE SET Name = source.Name, Email = source.Email
 WHEN NOT MATCHED THEN
      INSERT (Id, Name, Email) VALUES (source.Id, source.Name, source.Email)
```

Yes, we repeat the name of each column 6 times. And we say `source` 7 times. And you can imagine
how the `MERGE` of a table with 50 columns would look like. And how painful it is to add a new column
to an existing statement written 2 years ago.

By the way, the deadlocks are still possible with `MERGE` statement, so you need to handle them
properly.

So the developers, even the ones who know about the `MERGE`, usually choose to use the good old `CRUD`
combination. But when isn't the syntax a problem?

Generate It!
------------

More and more developers shift from writing the stored procedures to using ORMs. With full-blown
ORMs you don't need to care about particular SQL statements, but you get a bunch of other problems
related to [Object-relational impedance mismatch](https://en.wikipedia.org/wiki/Object-relational_impedance_mismatch).

One possible approach is to use a mini-ORM, for instance [Dapper](https://github.com/StackExchange/dapper-dot-net). 
You do your work in your favourite 
general-purpose language, but stay "close to the metal", or rather to SQL engine statements.

Here is how I invoke a `MERGE` statement for a Person object (given a connection from the pool):

``` csharp
var person = new Person(...);
DapperAdapter.Merge(connection, person);
```

Voila! The implementation of generic `Merge` method takes care of the syntax complications.
Write once, use everywhere:

``` csharp
public void Merge<TEntity>(IDbConnection dbConnection, TEntity entity) where TEntity : class
{
    var props = entity.GetType().GetProperties().Select(p => p.Name).ToList();
    var names = string.Join(", ", props);
    var values = string.Join(", ", props.Select(n => "@" + n));
    var updates = string.Join(", ", props.Select(n => $"{n} = @{n}"));
    dbConnection.Execute(
        $@"MERGE {entity.GetType().Name} as target
          USING (VALUES({values}))
          AS SOURCE ({names})
          ON target.Id = @Id
          WHEN matched THEN
            UPDATE SET {updates}
          WHEN not matched THEN
            INSERT({names}) VALUES({values});",
        entity);
}
```

Of course, it will only work if you use the convention of naming the `Person` properties
after the database table. In most cases, there will be a domain class `Person` and a property
bag class `PersonRow`, so you'll have to do the mapping between them. But that might be
easier than writing T-SQL code.

Conclusion
----------

Don't let the bulky syntax scare you away from the `MERGE` T-SQL statement. Extend your 
toolbox, and use the tools wisely.
