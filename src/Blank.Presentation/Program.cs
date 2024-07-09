using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Blank.Presentation;

// 21:29

internal static class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddCors();
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();

        var app = builder.Build();

        app.UseRouting();
        app.UseCors(b => b
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());

        app.UseDefaultFiles();
        app.UseStaticFiles();

        app.MapControllers();

        await app.RunAsync();
    }
}
