using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Blank.Presentation.Controllers;

[ApiController]
[Route("api/random")]
public sealed class RandomController
{
    private readonly ILogger<RandomController> _logger;

    public RandomController(ILogger<RandomController> logger)
        => _logger = logger;

    [HttpGet("number")]
    public ValueTask<int> GetRandomNumber(CancellationToken cancellationToken)
        => ValueTask.FromResult(
            Random.Shared.Next(0, int.MaxValue)
        );
}
