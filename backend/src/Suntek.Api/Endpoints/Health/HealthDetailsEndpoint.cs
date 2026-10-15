using System.Diagnostics;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Enums;
using Suntek.Infrastructure.Persistence;
using Suntek.Infrastructure.Storage;

namespace Suntek.Api.Endpoints.Health;

public class HealthCheckDetail
{
    public string Status { get; set; } = "Healthy";
    public string? Reason { get; set; }
}

public class DatabaseHealthDetail : HealthCheckDetail
{
    public long LatencyMs { get; set; }
    public int PendingMigrations { get; set; }
    public string? LatestAppliedMigration { get; set; }
}

public class StorageHealthDetail : HealthCheckDetail
{
    public bool Configured { get; set; }
    public string? Bucket { get; set; }
    public string? KeyPrefix { get; set; }
    public long MaxFileSizeBytes { get; set; }
    /// <summary>Which read-only call was used to verify the connection.</summary>
    public string? Probe { get; set; }
}

public class ConfigHealthDetail : HealthCheckDetail
{
    public bool Configured { get; set; }
}

public class HealthDetailChecks
{
    public DatabaseHealthDetail Database { get; set; } = new();
    public StorageHealthDetail R2Storage { get; set; } = new();
    public ConfigHealthDetail CatalogApiKey { get; set; } = new();
    public ConfigHealthDetail Jwt { get; set; } = new();
}

public class HealthDetailResponse
{
    public string Status { get; set; } = "Healthy";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Version { get; set; } = "1.0";
    public HealthDetailChecks Checks { get; set; } = new();
}

/// <summary>
/// Detailed connectivity report, meant for diagnosing a deploy without reading the orchestrator
/// logs. Admin only on purpose: it exposes infrastructure state (bucket, storage limits, migration
/// position). It never returns credentials, the S3 endpoint or the account id — only whether each
/// setting is present.
/// </summary>
public class HealthDetailsEndpoint(
    AppDbContext db,
    IConfiguration configuration,
    IImageStorageService storage,
    R2Options r2Options) : EndpointWithoutRequest<HealthDetailResponse>
{
    public override void Configure()
    {
        Get("/api/health/details");
        Roles(AppRoles.Admin);
        Options(x => x.WithTags("Health"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        Response = new HealthDetailResponse
        {
            Timestamp = DateTime.UtcNow,
            Checks =
            {
                Database = await CheckDatabaseAsync(ct),
                R2Storage = await CheckStorageAsync(ct),
                CatalogApiKey = CheckConfig(configuration["Catalog:ApiKey"], "Catalog API key is not set."),
                Jwt = CheckConfig(configuration["Jwt:SecurityKey"], "JWT signing key is not set."),
            },
        };

        Response.Status = Worst(Response.Checks);

        // 503 lets automation consume this too; a human still gets the full body with curl.
        if (Response.Status == "Unhealthy")
        {
            await Send.ResponseAsync(Response, StatusCodes.Status503ServiceUnavailable, ct);
            return;
        }

        await Send.OkAsync(Response, ct);
    }

    private async Task<DatabaseHealthDetail> CheckDatabaseAsync(CancellationToken ct)
    {
        var watch = Stopwatch.StartNew();
        try
        {
            await db.Database.ExecuteSqlRawAsync("SELECT 1", ct);
            var latency = watch.ElapsedMilliseconds;

            var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
            var applied = (await db.Database.GetAppliedMigrationsAsync(ct)).ToList();

            return new DatabaseHealthDetail
            {
                Status = pending.Count == 0 ? "Healthy" : "Degraded",
                Reason = pending.Count == 0 ? null : $"{pending.Count} pending migration(s).",
                LatencyMs = latency,
                PendingMigrations = pending.Count,
                LatestAppliedMigration = applied.LastOrDefault(),
            };
        }
        catch (Exception ex)
        {
            // Type only: provider messages can embed the connection string.
            return new DatabaseHealthDetail
            {
                Status = "Unhealthy",
                Reason = $"Database check failed: {ex.GetType().Name}.",
                LatencyMs = watch.ElapsedMilliseconds,
            };
        }
    }

    private async Task<StorageHealthDetail> CheckStorageAsync(CancellationToken ct)
    {
        var probe = await storage.ProbeAsync(ct);

        return new StorageHealthDetail
        {
            Status = probe.Status switch
            {
                ImageStorageProbeStatus.Healthy => "Healthy",
                ImageStorageProbeStatus.NotConfigured => "Degraded",
                ImageStorageProbeStatus.Degraded => "Degraded",
                _ => "Unhealthy",
            },
            Reason = probe.Reason,
            Configured = probe.Status != ImageStorageProbeStatus.NotConfigured,
            Bucket = string.IsNullOrWhiteSpace(r2Options.BucketName) ? null : r2Options.BucketName,
            KeyPrefix = string.IsNullOrWhiteSpace(r2Options.KeyPrefix) ? null : r2Options.KeyPrefix,
            MaxFileSizeBytes = storage.MaxFileSizeBytes,
            Probe = "ListObjectsV2 (MaxKeys=1)",
        };
    }

    private static ConfigHealthDetail CheckConfig(string? value, string missingReason) =>
        string.IsNullOrWhiteSpace(value)
            ? new ConfigHealthDetail { Status = "Degraded", Configured = false, Reason = missingReason }
            : new ConfigHealthDetail { Status = "Healthy", Configured = true };

    private static string Worst(HealthDetailChecks checks)
    {
        string[] statuses =
        [
            checks.Database.Status,
            checks.R2Storage.Status,
            checks.CatalogApiKey.Status,
            checks.Jwt.Status,
        ];

        if (statuses.Contains("Unhealthy"))
            return "Unhealthy";

        return statuses.Contains("Degraded") ? "Degraded" : "Healthy";
    }
}
