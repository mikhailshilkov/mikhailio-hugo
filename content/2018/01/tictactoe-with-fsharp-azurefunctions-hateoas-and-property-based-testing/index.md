---
title: Tic-Tac-Toe with F#, Azure Functions, HATEOAS and Property-Based Testing
date: 2018-01-23
tags: ["FSharp", "Azure Functions", "HATEOAS", "Property-Based Testing"]
thumbnail: thumb.jpg
description: "A toy application built with F# and Azure Functions: a simple end-to-end implementation from domain design to property-based tests."
---

This post describes a toy application that I've built with F# and Azure Functions
in about 1 day of work. It shows a simple end-to-end implementation with some
useful techniques applied, and can be used as a reference point for anyone interested in
one of the topics mentioned in the title.

The requirements for my application are quite simple:
- Implement the game of Tic-Tac-Toe for a human player to play against the computer
- The field is 3x3, the player to have three-in-a-row wins
- After the game, the score is calculated based on the number of moves combined
with the duration of the game
- The history of players' scores is persisted and presented as the leaderboard

Below I go through the code step by step. Feel free to jump to the part which interests
you the most:
[Domain Modelling](#DomainModelling),
[Azure Functions](#AzureFunctions),
[HATEOAS](#HATEOAS),
[Property-Based Testing](#PropertyBasedTesting).

The game is online, so you can play it [here](https://tictactoefs.azurewebsites.net/home).

The full source code can be found in [my github](https://github.com/mikhailshilkov/tictactoe).

<a name="DomainModelling"></a>
Modeling the Game with Types
----------------------------

I start with a domain model. The model is composed of immutable F# types (records and discriminated
unions) and pure functions.

We have two players, so we need a type for them:

``` fsharp
type Player = X | O
```

In addition, there is a useful function to return the other player based on the given one.
Simple pattern-matching will do:

``` fsharp
module Player =
  let other = function | X -> O | O -> X
```

The domain code is the most important part of the application, so I want it to be covered
by unit tests. Of course, the above function doesn't really warrant testing, but it's a nice
and simple way to try out [Property-Based Testing](https://fsharpforfunandprofit.com/posts/property-based-testing/).
That is, instead of defining specific tests, we define properties which hold for any valid input.

For `other` function, I came up with two properties:

- Other player is not equal to original player
- Other player of other player is the player itself

Here is the code with [Expecto](https://github.com/haf/expecto) and [FsCheck](https://github.com/fscheck/FsCheck):

``` fsharp
testProperty "Other player is not equal to player" <| fun x ->
  Expect.notEqual x (Player.other x) "Other should be different from original"

testProperty "Other player of other player is the player itself" <| fun x ->
  Expect.equal x (Player.other (Player.other x)) "Other other should be equal to original"
```

Let's move on to modelling the game. I decided to define a union type to be used for
horizontal and vertical positions of the cells:

``` fsharp
type Position = One | Two | Three
```

I could use the normal integers instead, but I don't want to be worried about validating
the ranges all the time.

My first record type models the move, or action done by a player: it has `X` and `Y`
positions of the chosen cell, plus the player information:

``` fsharp
type Move = {
  X: Position
  Y: Position
  By: Player
}
```

The following type `RunningGame` has just two properties, but its shape defines the
design of the whole application:

``` fsharp
type RunningGame = {
  MovesDone: Move list
  PossibleMoves: Move list
}
```

This type models any state of the game which is not finished yet.

`MovesDone` represents the ordered log of all moves, so we have the complete history
of actions at any time. Event Sourcing in small.

Equally importantly, there is a list of all possible moves at this point of the game.
I could get away without this property: in the end, it can always be derived from
the history of done moves and 3x3 size of the field.

However, having the list of possible moves simplifies the design of all the decision
maker (client) code:

- Clients don't have to search for remaining cells based on move log
- Validation of a move received from clients gets trivial: just check that it's in
the list of possible moves
- Bot implementation gets easy: it just needs to pick one of the valid moves. The
most trivial bot is a one-liner: it picks a random move from the collection
- Tests take advantage of this in a similar way, see [Game Tests](#PropertyBasedTesting) below
- We build a nice bridge into HATEOAS-style API, where links provided in the response
correspond to possible moves, see [REST API](#HATEOAS) below

Now, we can model a game which is already finished:

``` fsharp
type GameOutcome = Won of Player | Tie

type FinishedGame = {
  MovesDone: Move list
  Outcome: GameOutcome
}
```

Each finished game has a list of moves and the outcome: either one player won, or there
was a tie.

Each state of a game can be described by the union of the previous two states:

``` fsharp
type GameState =
  | Finished of FinishedGame
  | InProgress of RunningGame
```

Modeling Game Flow
------------------

Now, when all the types are in place, we can model the game flow. The flow is a sequence
of transitions between game states, implemented with pure functions.

First, each game starts at the same state, which is an empty field, and X turn. Here
is the value which represents this initial state:

``` fsharp
module Game =
  let initialState =
    let positions = [One; Two; Three]
    let cells = seq {
      for x in positions do
         for y in positions do
            yield { X = x; Y = y; By = X }
      }
    { MovesDone = []; PossibleMoves = List.ofSeq cells }
```

After each move is made, we need a function to evaluate move outcome: whether current
game is finished or is still in progress. I defined a function `evaluate` for that:

``` fsharp
let private evaluate (history: Move list): GameOutcome option = ...
```

I don't show the full body here, since it's quite boring in evaluating rows, columns
and diagonals for three-in-a-row. See the [full code](https://github.com/mikhailshilkov/tictactoe/blob/master/TicTacToe/Game.fs#L42-L56)
if you want to.

The following function is even more important: that's the main domain function called
`makeMove`. Its type is `RunningGame -> Move -> GameState` which perfectly communicates
its intent: given a running game and a move, it returns the game state after the move.
Note that

- You can't pass a finished game as an argument, because making a move on finished game
doesn't make sense
- The result *can* be a finished game

Here is the function implementation:

``` fsharp
let makeMove (game: RunningGame) (move: Move): GameState =
  let movesDone = move :: game.MovesDone
  match evaluate movesDone with
  | Some result -> Finished { MovesDone = movesDone; Outcome = result }
  | None ->
    let possibleMoves =
      List.except [move] game.PossibleMoves
      |> List.map (fun m -> { m with By = Player.other m.By })
    InProgress { MovesDone = movesDone; PossibleMoves = possibleMoves }
```

It works like this:

- Prepend the new move to moves done
- Evaluate the game result of these combined moves
- If the result is known, return a `Finished` game with calculated outcome
- If the result is not clear yet, return `InProgress` game with possible
moves same as before, but excluding the move and assigned to the other player

Tic-Tic-Toe is two-player game, so I defined another function which runs
a turn of 2 moves by 2 players, given the decision making functions of both
players (so it's a higher-order function):

``` fsharp
let makeRound player1 player2 gameState =
  let newGameState = player1 gameState |> makeMove gameState
  match newGameState with
  | Finished _ -> newGameState
  | InProgress p -> player2 p |> makeMove p
```

Looks almost like monadic `bind` operation...

<a name="PropertyBasedTesting"></a>
Property-Based Testing
----------------------

I've already shown two simplistic properties for `other` function.

It's a bit more challenging to come up with invariant properties when it
comes to testing the game itself. After some brainstorming, I've made the
following list:

- The game is never finished after 4 moves
- The game is always finished after 9 moves
- X and 0 have to make moves in turns
- Player wins by filling one column
- Player wins by filling one row
- Player wins by filling diagonal
- Evaluate a known tie

Each property-based test should accept some input from the testing framework.
It should then evaluate the test against this input and assert the invariants.
If the property holds for any possible valid input, the test is green.

I decided to structure my property tests in the following way:

- Each test accepts a list of non-negative integers
- Each integer is interpreted as an index of a possible move to select at turn `i`.
That means that the test receives a sequence which uniquely identifies the moves
to be made
- We can restrict this sequence to a scenario under test, e.g. make it less
than 4 moves, or exactly 9 moves, or pick moves from a limited subset of all
possible moves
- We apply the moves to calculate the end result
- We assert that the result confirms the property under test

Now, it's the responsibility of property based testing framework to generate
all kinds of input lists to try to break our property. If it succeeds, it will
print the exact input which causes the test to fail.

Here is how one such test is implemented.

A helper function plays a sequence of indexes as moves:

``` fsharp
let playSequence moves =
  let playOne s i =
    match s with
    | InProgress p -> Game.makeMove p (p.PossibleMoves.[i % p.PossibleMoves.Length])
    | _ -> s
  List.fold playOne (InProgress Game.initialState) moves
```

Then the property "The game is always finished after 9 moves" is simply:

``` fsharp
testProp "The game is always finished after 9 moves" <| fun (Gen.ListOf9 xs) ->
  let result = playSequence xs
  Expect.isTrue (Game.isFinished result) "Game should be finished"
```

Note the restriction `Gen.ListOf9 xs` that we put on the input sequence. It's a
generator that I [defined](https://github.com/mikhailshilkov/tictactoe/blob/master/TicTacToe.Tests/Gen.fs#L31-L32),
so that the list always contains exactly 9 elements.

Other property tests follow a similar pattern, you can see them
[here](https://github.com/mikhailshilkov/tictactoe/blob/master/TicTacToe.Tests/GameTests.fs).

<a name="HATEOAS"></a>
REST API
--------

Now, when I'm done with Game domain model, I want to define API that our HTTP
service will expose to the clients. I define my API in REST model.

The main resource is `/game` resource. To start a new game, a client has to send
`POST` command:

```
POST /game
Content-Type: application/json

{ "name": "Mikhail" }
```

And the response body is JSON which denotes a new game created:

``` json
{
    "id": "5d7b2261",
    "busyCells": [],
    "links": [
        {
            "rel": "x1y1",
            "href": "/game/5d7b2261/move/0"
        },
        {
            "rel": "x1y2",
            "href": "/game/5d7b2261/move/1"
        },
        // ... 7 more links follow
    ]
}
```

The response contains a game ID and the list of occupied cells, empty for now,
because no moves have been made.

More importantly, it contains a list of links, each one of which has a `rel`
field representing a cell, and a link. The client should `POST` to this link
if it wants to make a move on the corresponding cell:

```
POST /game/5d7b2261/move/1
```

And the response is:

``` json
{
    "id": "5d7b2261",
    "result": null,
    "busyCells": [
        {
            "name": "x2y3",
            "value": "O"
        },
        {
            "name": "x1y2",
            "value": "X"
        }
    ],
    "links": [
        {
            "rel": "x1y1",
            "href": "/game/5d7b2261/move/0"
        },
        {
            "rel": "x1y3",
            "href": "/game/5d7b2261/move/1"
        },
        // ... 5 more links follow
    ]
}
```

It has the same structure as before, but now two cells are occupied: one `X` and one `O`. The
list of links now has only 7 links, based on the count of free cells.

The client keeps navigating the links until it gets non-empty `result` field:

``` json
{
    "id": "5d7b2261",
    "result": "You Win!",
    "busyCells": [
        {
            "name": "x3y1",
            "value": "X"
        },
        {
            "name": "x3y2",
            "value": "O"
        },
        // ... more cells here
    ],
    "links": [],
    "score": 401
}
```

This denotes the end of the game. There's no more links to navigate, so the client knows it
has to stop playing.

This API is designed in HATEOAS-style (Hypermedia as the Engine of Application State). The
clients only need to know the initial URL, while all the other URLs are received from the
previous responses. It resembles the way a human navigates websites.

<a name="AzureFunctions"></a>
Azure Functions
---------------

I implemented the above API with Azure Functions. I used .NET Standard based v2 runtime
with precompiled F# functions.

The initial `POST /game` request is handled by `Start` function:

``` fsharp
type GameRequest = { Name: string }

type Cell = { Name: string; Value: string }
type Link = { Rel:  string; Href:  string }

type GameDTO = {
  Id: string
  Result: string
  BusyCells: Cell list
  Links: Link list
  Score: int
}

[<FunctionName("Start")>]
let start([<HttpTrigger(AuthorizationLevel.Anonymous, "POST", Route = "game")>] req: GameRequest,
          [<Table("TicTacToe")>] store: ICollector<GameEntity>) =
  let gameid = Guid.NewGuid().ToString()
  let state = InProgress Game.initialState
  let serializedState = JsonConvert.SerializeObject state
  store.Add(GameEntity(PartitionKey = "default", RowKey = gameid, Name = req.Name, State = serializedState))
  ObjectResult(Api.serialize gameid state 0)
```

The outline of this function:

- It's triggered by HTTP POST request, as configured for `req` parameter
- The request body is parsed to `GameRequest` type containing player name
- It generates a new game ID
- It creates initial game state of empty field
- It serializes the state and saves it to Table Storage with `store` output binding
- It returns HTTP body with
[serialized](https://github.com/mikhailshilkov/tictactoe/blob/master/TicTacToe.Functions/Api.fs#L30-L51) game response of type `GameDTO`

The second Function `Play` handles the moves:

``` fsharp
[<FunctionName("Play")>]
let play([<HttpTrigger(AuthorizationLevel.Anonymous, "POST", Route = "game/{gameid}/move/{index}")>]
         req: HttpRequest, gameid: string, index: int,
         [<Table("TicTacToe", "default", "{gameid}")>] entity: GameEntity) =
  let state = JsonConvert.DeserializeObject<GameState> entity.State
  match state with
  | Finished _ -> BadRequestResult() :> IActionResult
  | InProgress p when index < 0 || index >= p.PossibleMoves.Length -> BadRequestResult() :> IActionResult
  | InProgress p ->
    let result = Game.makeRound (fun _ -> p.PossibleMoves.[index]) Bot.pickMove p
    entity.State <- JsonConvert.SerializeObject result
    entity.Score <- Scoring.calculateScore (DateTime.UtcNow - entity.StartedAt).TotalMilliseconds result
    ObjectResult(Api.serialize gameid result entity.Score) :> IActionResult
```

The outline is very similar:

- It's triggered by a `POST` request with a URL template containing game ID and move index
- It has an in/out Table Storage binding which reads the serialized state saved after previous
game and move requests
- It validates the state: if the game is already finished, or if the move index is not in the valid range,
`Bad Request` HTTP status is returned
- If the move is valid, it runs the round, including bot play
- It also calculates the score, which is going to be non-zero only for finished games
- The game state and the score are saved to Table Storage entity (that's the only mutation in the whole
application)

Bot
---

Azure Function above used a `Bot.pickMove` function which I haven't described yet.

This function has the type `RunningGame -> Move`, exactly what is expected by `makeRound` game
function. Its goal is to pick the `O` move for any given game-in-progress.

Obviously, 3x3 Tic-Tac-Toe is a very simple game and it's quite easy to make a perfectly
playing bot. This wasn't the goal though: it's more fun for a human to win.

So, actually, the only property test that I ended up implementing is the following:

``` fsharp
testProp "Bot is able to play O at any possible position" <| fun (Gen.ListOfNonNegative xs) ->
  let human i p _ = p.PossibleMoves.[i % p.PossibleMoves.Length]
  let round s i =
    match s with
    | InProgress p -> Game.makeRound (human i p) Bot.pickMove p
    | _ -> s
  List.fold round (InProgress Game.initialState) xs |> ignore
```

It makes sure that for any possible sequence of human moves, bot is actually able to make
*any* move of its own. Bot just shouldn't crash :)

My very first implementation of the bot was just picking a random move. Such bot is fine,
but it's too boring to play against.

So, my current bot implementation has 3 rules:

- If there is a move that immediately wins the game, do that move
- If possible, don't pick a move which leads to immediate loss after the next human move
- Otherwise, pick a random move

I implemented the bot using the approach described in my
[Functional Fold as Decision Tree Pattern](https://mikhail.io/2016/07/building-a-poker-bot-functional-fold-as-decision-tree-pattern/)
post:

``` fsharp
let pickMove (game: RunningGame) =
  [winNow O; notLoseNow; pickRandom]
  |> Seq.ofList
  |> Seq.choose (fun x -> x game)
  |> Seq.head
```

So, there is a prioritized list of decision functions. The first one returning `Some`
decision will be promoted to final decision.

And here are those functions:

``` fsharp
let winNow player (game: RunningGame) =
  let isWin = function | Finished { Outcome = Won x } when x = player -> true | _ -> false
  game.PossibleMoves
  |> List.tryFind (fun move -> Game.makeMove game move |> isWin)

let notLoseNow (game: RunningGame) =
  let canLose = function
    | InProgress p -> match winNow X p with | Some _ -> true | None -> false
    | _ -> false
  let notLosingMoves =
    game.PossibleMoves
    |> List.filter (fun move -> Game.makeMove game move |> canLose |> not)
  if List.isEmpty notLosingMoves && notLosingMoves.Length < game.PossibleMoves.Length then None
  else Some (notLosingMoves.[random.Next notLosingMoves.Length])

let pickRandom (game: RunningGame) =
  Some (game.PossibleMoves.[random.Next game.PossibleMoves.Length])
```

Such rule-based setup is easy to extend, and also to test when it becomes needed.

Score Calculation
-----------------

Last twist to the application is the scoring system. If a human player wins or gets a tie,
they are assigned a numeric score, which can be then compared to the historic leaderboard
of all players.

The score is calculated based on two principles: the less moves you make, and the faster
you play, the higher the score is. Move count is more important than timing.

These principles are nicely expressed as property tests:

``` fsharp
testProp "The score of faster game is not lower than slower game"
  <| fun (Gen.Positive duration1) (Gen.Positive duration2) game ->
  let (slower, faster) = maxmin id duration1 duration2
  let scoreFaster = Scoring.calculateScore faster game
  let scoreSlower = Scoring.calculateScore slower game
  Expect.isGreaterThanOrEqual scoreFaster scoreSlower "Bigger duration has lower score (or same)"

testProp "The score of won game in less moves is greater than game with more moves"
  <| fun (Gen.Positive duration1) (Gen.Positive duration2) game1 game2 ->
  let (slower, faster) = maxmin id duration1 duration2
  let (moreMoves, lessMoves) = maxmin List.length game1 game2
  let score1 = Scoring.calculateScore slower (Finished { Outcome = Won X; MovesDone = lessMoves })
  let score2 = Scoring.calculateScore faster (Finished { Outcome = Won X; MovesDone = moreMoves })
  if moreMoves.Length = lessMoves.Length then
    Expect.isGreaterThanOrEqual score1 score2 "Bigger duration has lower score (or same)"
  else
    Expect.isGreaterThan score1 score2 "More moves have lower score"
```

Note that tests are parameterized for durations and game states. We don't have to come up with specific
scenarios: the framework should take care of those.

One of the possible implementations for scoring is:

``` fsharp
let calculateScore duration (state: GameState) =
  let durationScore = (100.0 * (1.0 - duration / (duration + 10000.0))) |> int
  match state with
  | Finished { Outcome = Won X; MovesDone = ms } -> (11 - ms.Length) * 100 + durationScore
  | Finished { Outcome = Tie } -> durationScore
  | _ -> 0
```

Now, the leaderboard piece. You've already seen the bits of this functionality in Azure Functions:
they store the game state into Azure Table Storage.

There is another Azure Function which handles `GET` requests to `/leaderboard` resource. It
loads all the past games from Table Storage, and then passes them to leaderboard calculation
function below:

``` fsharp
let calculateLeaderboard top ns =
  ns
  |> Seq.filter (fun entity -> snd entity > 0 && not (String.IsNullOrEmpty (fst entity)))
  |> Seq.sortByDescending snd
  |> Seq.truncate top
  |> Seq.mapi (fun index entity -> { Index = index + 1; Name = fst entity; Score = snd entity })
```

Wrapping Up
-----------

Ok, the application is simple, but the blog post ended up being quite long. Thank you if you
made it so far.

I touched base on several important concepts and tools, which can be useful apart or in
combination.

Please leave a comment if such kind of articles is useful, and which part you found most
inspirational or boring.

The full source code can be found in [my github](https://github.com/mikhailshilkov/tictactoe).

Happy coding!