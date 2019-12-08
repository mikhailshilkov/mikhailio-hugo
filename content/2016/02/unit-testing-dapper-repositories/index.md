---
title: Unit testing Dapper repositories
date: 2016-02-23
tags: ["Unit Testing", "Dapper", "ORM", "TDD"]
description: Dapper is a micro-ORM library which is very simple and super fast. Quite often the data access code is difficult to be unit tested. In this post, I present some ideas of testing Dapper-based database access.
---

[Dapper](https://github.com/StackExchange/dapper-dot-net) is a micro-ORM library which is
very simple and super fast. In our projects we use Dapper for the tasks where something like
EntityFramework or NHibernate would be an overkill.

Quite often the data access code is difficult to be unit tested. Objects like
database connections, commands, transactions and contexts are hard to mock, and
thus the data access code is not easily isolated. Dapper relies heavily on SQL
statements inside C# code, which gives an extra complication. Some people would
argue that unit tests are not warranted for data access layer, and integration
tests should be used instead. Let's have a look at another possibility.

An Example of a Repository
--------------------------

Let's say we have a simple class and we want to populate instances of this class
from the database:

``` csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
}
```

To be able to use Dapper for data access, we need an instance of `IDbConnection`.
As we want to be able to mock the connection for unit tests, we need to create
a factory interface to abstract it away:

``` csharp
public interface IDatabaseConnectionFactory
{
    IDbConnection GetConnection();
}
```

Now the repository would get a connection from this factory and execute
Dapper queries on it:

``` csharp
public class ProductRepository
{
    private readonly IDatabaseConnectionFactory connectionFactory;

    public ProductRepository(IDatabaseConnectionFactory connectionFactory)
    {
        this.connectionFactory = connectionFactory;
    }

    public Task<IEnumerable<Product>> GetAll()
    {
        return this.connectionFactory.GetConnection().QueryAsync<Product>(
            "select * from Product");
    }
}
```

Testing Without a real Database
-------------------------------

Here is my approach to testing the repository:

1. Use an in-memory [SQLite3](https://www.sqlite.org/) database.
2. Create a table there and put some data in.
3. Run the repository against this database.
4. Compare the result to the expected values.

Here is a helper class which uses another micro-ORM library [OrmLite](http://ormlite.com/) to talk
to SQLite database:

``` csharp
public class InMemoryDatabase
{
    private readonly OrmLiteConnectionFactory dbFactory =
        new OrmLiteConnectionFactory(":memory:", SqliteOrmLiteDialectProvider.Instance);

    public IDbConnection OpenConnection() => this.dbFactory.OpenDbConnection();

    public void Insert<T>(IEnumerable<T> items)
    {
        using (var db = this.OpenConnection())
        {
            db.CreateTableIfNotExists<T>();
            foreach (var item in items)
            {
                db.Insert(item);
            }
        }
    }
}
```

And here is the test for our `ProductRepository` class:

``` csharp
[Test]
public async Task QueryTest()
{
    // Arrange
    var products = new List<Product>
    {
        new Product { ... },
        new Product { ... }
    };
    var db = new InMemoryDatabase();
    db.Insert(products);
    connectionFactoryMock.Setup(c => c.GetConnection()).Returns(db.OpenConnection());

    // Act
    var result = await new ProductRepository(connectionFactoryMock.Object).GetAll();

    // Assert
    result.ShouldBeEquivalentTo(products);
}
```

Is It a Unit Test?
------------------

Well, not completely. This approach does not mock the database, but instead puts
an in-memory database in place of the normal one. The problem is that we don't
control all the details how it works, so it might not be as flexible as we need.
For instance, SQLite type system is quite simplistic, so while `INT` and `BIGINT`
are different column types in SQL Server, they are the same `INTEGER` type in
SQLite. This can lead to false positive or false negative tests in edge cases.

Nevertheless, the concept is simple and requires very little amount of code,
so it's useful to have it in the toolbox anyway. The resulting tests are fast,
have no external dependencies and are always consistent between multiple runs.
That makes them better than real integration tests for the simple scenarios
during TDD development.