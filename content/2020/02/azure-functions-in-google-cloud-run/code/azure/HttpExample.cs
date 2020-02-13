using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;

namespace LocalFunctionsProject
{
    public static class HttpExample
    {
        [FunctionName("HttpExample")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req)
        {
            var name = (string)req.Query["name"] ?? "World";
            var service = Environment.GetEnvironmentVariable("K_SERVICE") ?? "<unknown>";
            return new OkObjectResult($"Hello from Azure Function in {service}, {name}");
        }
    }
}
