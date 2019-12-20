---
title: Unit testing null parameter checks
date: 2015-04-08
tags: ["Unit Testing","Dependency Injection","Best Practices","Reflection","CSharp","TDD"]
description: "We use constructor dependency injection throughout our application. Most service classes have constructors, which accept all dependencies in form of interfaces. We also use TDD, which means we must write unit tests for every aspect of our code. So I want to discuss one specific aspect: guarding the constructor parameters from null values and testing this guard."
---
We use constructor dependency injection throughout our application. This means that most service classes have constructors, which accept all dependencies in form of interfaces. They are then saved to private fields to be used while class methods are executed. Here is an example (all examples below are in C#):

``` csharp
public class VeryUsefulClass : IVeryUsefulClass
{
    private readonly ISomething something;
    private readonly ISomethingElse somethingElse;

    public VeryUsefulClass(ISomething something, ISomethingElse somethingElse)
    {
        this.something = something;
        this.somethingElse = somethingElse;
    }

    public AwesomeResponse DoUsefullStaff(ImportantRequest request)
    {
        this.something.DoSomething();
        this.somethingElse.DoSomethingElse();
        return ...;
    }
}
```

We also use TDD, which means we must write unit tests for every aspect of our code. So I want to discuss one specific aspect: guarding the constructor parameters from null values and testing this guard. Here is one possible way to write such tests (with NUnit and Moq):

``` csharp
[TestFixture]
public class VeryUsefulClassTests
{
    [Test]
    public void WhenSomethingIsNullConstructorThrowsNullException()
    {
        Assert.ThrowsException<ArgumentNullException>(() =>
            new VeryUsefulClass(null, new Mock<ISomethingElse>.Object));
    }

    [Test]
    public void WhenSomethingElseIsNullConstructorThrowsNullException()
    {
        Assert.ThrowsException<ArgumentNullException>(() =>
            new VeryUsefulClass(new Mock<ISomething>.Object, null));
    }

    [Test]
    public void ImportantRequestProducesAwesomeResponse()
    {
        var target = new VeryUsefulClass(new Mock<ISomething>.Object,
            new Mock<ISomethingElse>.Object);
        ...
    }

    ...
}
```

The tests are small and each one tests just one thing. But it looks like we have a bit too much duplication and "noise": too much service code around real code under test.

Make it better
--------------

Now let's say we need to introduce another dependency into our useful class: ISomethingNew. The constructor signature will change to

``` csharp
public VeryUsefulClass(ISomething something,
    ISomethingElse somethingElse,
    ISomethingNew somethingNew)
{
    ...
}
```

So, how many places do we have to change in our test class? One per each test, which includes one per each constructor parameter. Quite a lot! If we have a class with many dependencies, we are in trouble. So, before introducing the new dependency, let's refactor the tests. First, let's declare all mocks as private fields and create them in set-up method:

``` csharp
[TestFixture]
public class VeryUsefulClassTests
{
    private Mock<ISomething> something;
    private Mock<ISomethingElse> somethingElse;

    [SetUp]
    public void SetUp()
    {
        this.something = new Mock<ISomething>();
        this.somethingElse = new Mock<ISomethingElse>();
    }
...
```

This way the same clean mocks will be available for each and every test. To make use of them, let's create GetTarget method which will create an instance of class under test

``` csharp
private VeryUsefulClass GetTarget()
{
    return new VeryUsefulClass(this.something.Object, this.somethingElse.Object);
}
```

Now we are ready to rewrite our test methods with less duplication

``` csharp
[Test]
public void WhenSomethingIsNullConstructorThrowsNullException()
{
    this.something = null;
    Assert.ThrowsException<ArgumentNullException>(() => this.GetTarget());
}

[Test]
public void WhenSomethingElseIsNullConstructorThrowsNullException()
{
    this.somethingElse = null;
    Assert.ThrowsException<ArgumentNullException>(() => this.GetTarget());
}

[Test]
public void ImportantRequestProducesAwesomeResponse()
{
    var target = this.GetTarget();
    ...
}
```

So, how many constructor calls do we have to change when we introduce a new dependency now? Just one for the complete test class!

I strongly believe that readability of your test classes is very important. If you make your tests short, expressive and easy to read, your tests will have much higher value: not only the safety net for classes, but also nice documentation which is easy to use and support.

Make it shine
-------------

I'm still not quite satisfied with the amount of code we have to write for such a simple thing as the validation of ArgumentNullException being thrown from constructors. Imagine this: we have hundreds or thousands of classes which follow this same pattern, and we end up writing thousands tests which look almost exactly the same...

I solved it with a simple helper method:

``` csharp
public void ConstructorMustThrowArgumentNullException(Type type)
{
    foreach (var constructor in type.GetConstructors())
    {
        var parameters = constructor.GetParameters();
        var mocks = parameters.Select(
            p =>
                {
                    Type mockType = typeof(Mock<>).MakeGenericType(
                        new[] { p.ParameterType });
                    return (Mock)Activator.CreateInstance(mockType);
                }).ToArray();

        for (int i = 0; i < parameters.Length; i++)
        {
            var mocksCopy = mocks.Select(m => m.Object).ToArray();
            mocksCopy[i] = null;
            try
            {
                constructor.Invoke(mocksCopy);
                Assert.Fail("ArgumentNullException expected for parameter {0} of
                             constructor, but no exception was thrown",
                             parameters[i].Name);
            }
            catch (TargetInvocationException ex)
            {
                Assert.AreEqual(typeof(ArgumentNullException),
                    ex.InnerException.GetType(),
                    string.Format("ArgumentNullException expected for parameter {0} of
                        constructor, but exception of type {1} was thrown",
                        parameters[i].Name, ex.InnerException.GetType()));
            }
        }
    }
}
```

It accepts a type as its only input parameter (obviously, it's easy to make it generic or an extension method). Then, using the reflection, it iterates through the input parameters of a constructor, and passes one null value and mocks all other parameters. It expects ArgumentNullException to be thrown on each call.

You could write one test for all classes in a namespace or in assembly, if the pattern is applied consistently there! And it will let you know when one of your new classes violates the common rule, with zero extra effort.

Does anyone know the library which would do that without me inventing the bicycle myself?

Happy coding!