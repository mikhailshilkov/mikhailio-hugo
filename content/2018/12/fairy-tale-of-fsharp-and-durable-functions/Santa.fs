namespace samples

open Microsoft.Azure.WebJobs
open DurableFunctions.FSharp

module Santa =

  type Product = ProductMock of int
  type Probability = Value of double   
  type Customer = CustomerMock of string
  
  type WishList = {
    Kid: Customer
    Wishes: string list
  }

  type Match = {
    Product: Product
    Confidence: Probability
  }

  type Reservation = {
    Kid: Customer
    Product: Product
  }

  let findMatchingGift (wish: string) = async {
    do! Async.Sleep 1000
    return [ { Product = ProductMock 1; Confidence = Value 0.9 } ]
  }

  let pickGift (candidates: Match list) =
    candidates
    |> List.sortByDescending (fun x -> x.Confidence)
    |> List.head
    |> (fun x -> x.Product)

  let reserve (reservation: Reservation) = async {
    do! Async.Sleep 1000
  }

  let protoflow (wishlist: WishList) = async {
    let! matches = 
        wishlist.Wishes
        |> List.map findMatchingGift
        |> Async.Parallel

    let gift = pickGift (List.concat matches)
    
    let reservation = { Kid = wishlist.Kid; Product = gift }
    do! reserve reservation
    return reservation
  }
    
  let findMatchingGiftActivity = Activity.defineAsync "FindMatchingGift" findMatchingGift
  let pickGiftActivity = Activity.define "PickGift" pickGift
  let reserveActivity = Activity.defineAsync "Reserve" reserve

  let workflow wishlist = orchestrator {
    let! matches = 
        wishlist.Wishes
        |> List.map (Activity.call findMatchingGiftActivity)
        |> Activity.all

    let! gift = Activity.call pickGiftActivity (List.concat matches)
    
    let reservation = { Kid = wishlist.Kid; Product = gift }
    do! Activity.call reserveActivity reservation
    return reservation
  }

  [<FunctionName("FindMatchingGift")>]
  let FindMatchingGift([<ActivityTrigger>] wish) = 
    Activity.run findMatchingGiftActivity wish

  [<FunctionName("PickGift")>]
  let PickGift([<ActivityTrigger>] matches) = 
    Activity.run pickGiftActivity matches

  [<FunctionName("Reserve")>]
  let Reserve([<ActivityTrigger>] wish) = 
    Activity.run reserveActivity wish

  [<FunctionName("WishlistFulfillment")>]
  let Workflow ([<OrchestrationTrigger>] context: DurableOrchestrationContext) =
    Orchestrator.run (workflow, context)