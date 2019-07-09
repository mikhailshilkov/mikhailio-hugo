module Functions.Warmer

open Microsoft.Azure.WebJobs

[<FunctionName("Warmer")>]
let getHeartCount([<TimerTrigger("0 */10 * * * *")>] info: TimerInfo) =
    ()
