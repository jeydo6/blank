using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Blank.Presentation.Controllers;

[ApiController]
[Route("api/configuration")]
public class ConfigurationController
{
    private readonly IConfiguration _configuration;

    public ConfigurationController(IConfiguration configuration)
        => _configuration = configuration;
    
    [HttpGet]
    public ValueTask<string> Get(string key)
    {
        var result = _configuration.GetSection(key);
        return ValueTask.FromResult(
            JsonSerializer.Serialize(result)
        );
    }
}
