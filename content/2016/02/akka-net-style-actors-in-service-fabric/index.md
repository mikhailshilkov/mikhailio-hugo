---
title: Akka.NET-style actors in Service Fabric
date: 2016-02-08
tags: ["Service Fabric", "Akka.NET", "Actor Model"]
description: Akka.NET and Service Fabric are the two actor frameworks that emerged in .NET world in the last year. The two implementations of actor models are quite different. These differences are multi-faceted but today I want to focus on API to define an actor and to communicate to it.
---

Akka.NET and Service Fabric are the two actor frameworks that emerged in .NET world in the last year.
The two implementations of actor models are quite different. These differences are multi-faceted but
today I want to focus on API to define an actor and to communicate to it.

Service Fabric Actors
---------------------

Every actor in Service Fabric has a public interface which describes its behaviour. For this article
I'm going to use a toy example based on weather reports. Our actor will be able to get whether reports
and then return the maximum temperature for a given period. An instance of actor will be created
for each city (geo partitioning). Here is our interface in Service Fabric:

``` csharp
public interface IWeatherActor : IActor
{
    Task AddWeatherReport(WeatherReport report);

    Task<int?> GetMaxTemperature(Period period);
}
```

We have two operations: a command and a query. They are both async (return `Task`). The data classes
are required to be mutable DTOs based on `DataContract`:

``` csharp
[DataContract]
public class WeatherReport
{
    [DataMember]
    public DateTime Moment { get; set; }
    [DataMember]
    public int Temperature { get; set; }
    [DataMember]
    public int Humidity { get; set; }
}

[DataContract]
public class Period
{
    [DataMember]
    public DateTime From { get; set; }
    [DataMember]
    public DateTime Until { get; set; }
}
```

And here is the implementation of the weather actor:

``` csharp
internal class WeatherActor : StatefulActor<List<WeatherReport>>, IWeatherActor
{
    public Task AddWeatherReport(WeatherReport report)
    {
        this.State = this.State ?? new List<WeatherReport>();
        this.State.Add(report);
        return Task.FromResult(0);
    }

    public Task<int?> GetMaxTemperature(Period period)
    {
        return Task.FromResult(
            (this.State ?? Enumerable.Empty<WeatherReport>())
            .Where(r => r.Moment > period.From && r. Moment <= period.Until)
            .Max(r => (int?)r.Temperature));
    }
}
```

Service Fabric provides reliable storage out of the box, so we are using it to
store our reports. There's no code required to instantiate an actor. Here is the
code to use it:

``` csharp
// Submit a new report
IWeatherActor actor = ActorProxy.Create<IWeatherActor>(new ActorId("Amsterdam"));
actor.AddWeatherReport(
    new WeatherReport { Moment = DateTime.Now, Temperature = 22, Humidity = 55 });

// Make a query somewhere else
IWeatherActor actor = ActorProxy.Create<IWeatherActor>(new ActorId("Amsterdam"));
var result = actor.GetMaxTemperature(new Period { From = monthAgo, Until = now });
```

Akka.NET Actors
---------------

Actors in Akka.NET are message-based. The messages are immutable POCOs, which
is a great design decision. Here are the messages for our scenario:

``` csharp
public class WeatherReport
{
    public WeatherReport(DateTime moment, int temperature, int humidity)
    {
        this.Moment = moment;
        this.Temperature = temperature;
        this.Humidity = humidity;
    }

    public DateTime Moment { get; }
    public int Temperature { get; }
    public int Humidity { get; }
}

public class Period
{
    public Period(DateTime from, DateTime until)
    {
        this.From = from;
        this.Until = until;
    }

    public DateTime From { get; }
    public DateTime Until { get; }
}

```

There's no need to define any interfaces. The basic actor implementation derives from
`ReceiveActor` and calls `Receive` generic method to setup a callback which is called
when a message of specified type is received:

``` csharp
public class WeatherActor : ReceiveActor
{
    private List<WeatherReport> state = new List<WeatherReport>();

    public WeatherActor()
    {
        Receive<WeatherReport>(this.AddWeatherReport);
        Receive<Period>(this.GetMaxTemperature);
    }

    public void AddWeatherReport(WeatherReport report)
    {
        this.state.Add(report);
    }

    public void GetMaxTemperature(Period period)
    {
        var response = this.state
            .Where(r => r.Moment > period.From && r. Moment <= period.Until)
            .Max(r => (int?)r.Temperature);
        Sender.Tell(response, Self);
    }
}
```

Note a couple more differences in this implementation comparing to Fabric style:

- State is stored in a normal class field and is not persistent or replicated
by default. This can be solved by Akka.NET Persistence, which would save all
messages (and potentially snapshots) to the external database. Still, it won't
be the same level of convenience as in-built Service Fabric statefullness.

- `GetMaxTemperature` method does not return anything, because nobody would look
at the returned value. Instead, it sends yet another message to the sender actor.
So, `Request-Response` workflow is supported but is a bit less convenient and
explicit.

Let's have a look at the client code. `ActorSelection` is the closest notion to
Fabric's `ActorProxy`: it does not create an actor, but just gets an endpoint
based on the name. Note that Akka.NET actor needs to be explicitly created by
another actor, but lifetime management is a separate discussion, so we'll skip
it for now. Here is the report sender:

``` csharp
// Submit a new report
var msg = new WeatherReport { Moment = DateTime.Now, Temperature = 22, Humidity = 55 };
Context.ActorSelection("/user/weather/Amsterdam").Tell(msg);
```

Asking `ActorSelection` is not directly possible, we would need to setup an
inbox and receive callback messages. We'll pretend that we have an `ActorRef`
for the sake of simplicity:

``` csharp
// Make a query somewhere else
ActoRef actor = ... ; // we have it
var result = await actor.Ask(new Period { From = monthAgo, Until = now });
```

The Best of Two Worlds
----------------------

Now my goals is to come up with an implementation of Service Fabric actors with
the properties that combine the good parts of both frameworks (without explicitly
using Akka.NET), i.e.

- Use the full power of Service Fabric actors, including lifetime management,
cluster management and reliable state
- Use the simplicity of Request-Response pattern implementation of Service Fabric
- Support immutable POCO messages instead of `DataContract` DTOs
- Use `ReceiveActor`-like API for message processing

Here is the third implementation of our Weather Actor (the definitions of messages
from Akka.NET example are intact):

``` csharp
[ActorService(Name = "WeatherActor")]
public class WeatherActor : StetefulReceiveActor<List<WeatherReport>>
{
    public WeatherActor()
    {
        Receive<WeatherReport>(this.AddWeatherReport);
        Receive<Period, int>(this.GetMaxTemperature);
    }

    public Task<List<WeatherReport>> AddWeatherReport(
        List<WeatherReport> state, WeatherReport report)
    {
        state = state ?? new List<WeatherReport>();
        state.Add(report);
        return Task.FromResult(state);
    }

    public Task<int?> GetMaxTemperature(List<WeatherReport> state, Period period)
    {
        return Task.FromResult(
            (state ?? Enumerable.Empty<WeatherReport>())
            .Where(r => r.Moment > period.From && r. Moment <= period.Until)
            .Max(r => (int?)r.Temperature));
    }
}
```

The base `ReceiveActor` class is not defined yet, we'll do it in the next section. Here is
how it's being used:

- The base class is generic and it accepts the type of the state (similar to normal Fabric actors)
- Constructor registers two `Receive` handlers: message handler and request handler. Note
that the later one accepts two type parameters: request type and response type
- Both handlers get the current state as the first argument instead of pulling it from the property of
the base class
- The both return `Task`'ed data. Message handler is allowed to change the state, while
request handler does  not change the state but just returns the response back
- `ServiceName` attribute is required because there are (may be) multiple classes implementing
the same interface

The client code uses our own `MessageActorProxy` class to create non-generic proxies which
are capable to `Tell` (send a message one way) and `Ask` (do request and wait for response):

``` csharp
// Submit a new report
var actor = MessageActorProxy.Create(new ActorId("Amsterdam"), "WeatherActor");
actor.Tell(new WeatherReport { Moment = DateTime.Now, Temperature = 22, Humidity = 55 });

// Make a query somewhere else
var actor = MessageActorProxy.Create(new ActorId("Amsterdam"), "WeatherActor");
var result = actor.Ask(new Period { From = monthAgo, Until = now });
```

Implementation of ReceiveActor
------------------------------

Let's start with the interface definition:

``` csharp
public interface IReceiveActor : IActor
{
    Task Tell(string typeName, byte[] message);

    [Readonly]
    Task<byte[]> Ask(string typeName, byte[] message);
}
```

The two methods for `Tell` and `Ask` accept serializes data together with fully qualified
type name. This will allow passing any kind of objects which can be handled by a serializer
of choice (I used Newtonsoft JSON serializer).

Actor implementation derives from `StatefulActor` and uses another type/bytes pair to store
the serialized state:

``` csharp
    public abstract class StatefulReceiveActor : StatefulActor<StateContainer>,
                                                 IReceiveActor
    {
        // ...
    }

    [DataContract]
    public class StateContainer
    {
        [DataMember]
        public string TypeName { get; set; }

        [DataMember]
        public byte[] Data { get; set; }
    }
```

The simplistic implementation of `Receive` generic methods uses two dictionaries
to store the handlers:

``` csharp
private Dictionary<Type, Func<object, object, Task<object>>> handlers;
private Dictionary<Type, Func<object, object, Task<object>>> askers;

public ReceiveActor()
{
    this.handlers = new Dictionary<Type, Func<object, object, Task<object>>>();
    this.askers = new Dictionary<Type, Func<object, object, Task<object>>>();
}

protected void Receive<T>(Func<object, T, Task<object>> handler)
    => this.handlers.Add(typeof(T), async (s, m) => await handler(s, (T)m));

protected void Receive<TI, TO>(Func<object, TI, Task<TO>> asker)
    => this.askers.Add(typeof(TI), async (s, m) => await asker(s, (TI)m));

```

The `Tell` method deserializes the message and state, then picks a handler based on
the message type, executes it and serializes the produced state back:

``` csharp
public async Task Tell(string typeName, byte[] message)
{
    var type = Type.GetType(typeName);
    var typedMessage = this.serializer.Deserialize(message, type);

    var typedState = this.State != null
        ? this.serializer.Deserialize(this.State.Data, Type.GetType(this.State.TypeName))
        : null;
    var handler = this.handlers.FirstOrDefault(t => t.Key.IsAssignableFrom(type)).Value;
    if (handler != null)
    {
        var newState = await handler(typedState, typedMessage);
        this.State =
            newState != null
            ? new StateContainer
              {
                  Data = this.serializer.Serialize(newState),
                  TypeName = newState.GetType().AssemblyQualifiedName
              }
            : null;
    }
}
```

The implementation of `Ask` is almost identical, so I'll skip it. `MessageActorProxy`
encapsulates the serialization around passing data to normal `ActorProxy` class:

``` csharp
public class MessageActorProxy
{
    private readonly IStatefulMessageActor proxy;
    private readonly ISerializer serializer = new JsonByteSerializer();

    private MessageActorProxy(ActorId actorId, string serviceName)
    {
        this.proxy = ActorProxy.Create<IReceiveActor>(actorId, serviceName: serviceName);
    }

    public async Task Tell(object message)
    {
        var serialized = this.serializer.Serialize(message);
        await this.proxy.Send(message.GetType().AssemblyQualifiedName, serialized);
    }

    public async Task<T> Ask<T>(object message)
    {
        var serialized = this.serializer.Serialize(message);
        var fullName = message.GetType().AssemblyQualifiedName;
        var response = await this.proxy.Ask(fullName, serialized);
        return (T)this.serializer.Deserialize(response, typeof(T));
    }

    public static MessageActorProxy Create(ActorId actorId, string serviceType)
    {
        return new MessageActorProxy(actorId, serviceType);
    }
}
```

Let's briefly wrap it up.

Conclusion
----------

At this stage Azure Service Fabric lacks support of some actor model best practices
like message-based API and immutable POCO classes. At the same time, it provides
super powerful setup regarding cluster resource management, state replication, fault
tolerance and reliable communication. We can borrow some approaches that are used in Akka.NET
framework to improve the developer experience who wants to leverage the power
of Service Fabric.