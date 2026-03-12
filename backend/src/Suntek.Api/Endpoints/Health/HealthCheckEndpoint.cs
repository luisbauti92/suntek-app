using FastEndpoints;

namespace Suntek.Api.Endpoints.Health;

public class HealthCheckResponse
{
    public string Status { get; set; } = "Healthy";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Version { get; set; } = "1.0";
}

public class HealthCheckEndpoint : EndpointWithoutRequest<HealthCheckResponse>
{
    public override void Configure()
    {
        Get("/api/health");
        AllowAnonymous();
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        Response = new HealthCheckResponse
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0"
        };
        return Task.CompletedTask;
    }
}
