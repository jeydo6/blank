using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Blank.Presentation.Controllers;

[ApiController]
[Route("api/random")]
public sealed class RandomController
{
    [HttpGet("number")]
    public ValueTask<int> GetRandomNumber(CancellationToken cancellationToken)
        => ValueTask.FromResult(
            Random.Shared.Next(0, int.MaxValue)
        );

    [HttpGet("delay")]
    public Task GetRandomDelay(CancellationToken cancellationToken)
        => Task.Delay(
            Random.Shared.Next(50, 500), cancellationToken
        );
}
