module Functions.Heart

open System
open Microsoft.AspNetCore.Mvc
open Microsoft.Azure.WebJobs
open Microsoft.Azure.WebJobs.Extensions.Http

type Heart(partitionKey, rowKey, session, count) =
    new() = Heart("default", "default", "default", 0)
    member val PartitionKey = partitionKey with get, set
    member val RowKey = rowKey with get, set
    member val Session = session with get, set
    member val Count = count with get, set

[<CLIMutable>]
type Request = {
    path: string
    session: string
}

let inline isNull x = x = Unchecked.defaultof<_>

[<FunctionName("GetHeartCount")>]
let getHeartCount([<HttpTrigger(AuthorizationLevel.Anonymous, "post")>] req: Request,
                  [<Table("Heart", "{path}", "Total")>] total: Heart) =
    let count = if isNull total then 0 else total.Count
    let result = {| count = count |}
    OkObjectResult result

[<FunctionName("AddHeart")>]
let addHeart([<HttpTrigger(AuthorizationLevel.Anonymous, "post")>] req: Request,
             [<Table("Heart", "{path}", "Total")>] current: Heart,
             [<Table("Heart")>] inserted: ICollector<Heart>) =
    let count =
        if isNull current then
            inserted.Add (Heart(req.path, "Total", req.session, 1))
            1
        else
            let count = current.Count + 1
            current.Count <- count
            count
    inserted.Add (Heart(req.path, Guid.NewGuid().ToString(), req.session, 1))
    let result = {| count = count |}
    OkObjectResult result
