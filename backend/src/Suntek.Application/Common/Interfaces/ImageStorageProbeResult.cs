namespace Suntek.Application.Common.Interfaces;

public enum ImageStorageProbeStatus
{
    Healthy,
    /// <summary>Reachable but not fully verifiable (e.g. the token is object-scoped and cannot list).</summary>
    Degraded,
    Unhealthy,
    NotConfigured
}

/// <summary>
/// Outcome of a read-only storage probe. <see cref="Reason"/> is safe to surface: it never contains
/// credentials, the endpoint or the account id.
/// </summary>
public record ImageStorageProbeResult(ImageStorageProbeStatus Status, string? Reason = null);
