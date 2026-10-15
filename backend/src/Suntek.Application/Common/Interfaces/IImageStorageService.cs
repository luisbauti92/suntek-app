namespace Suntek.Application.Common.Interfaces;

/// <summary>
/// Object storage for public catalog images. Implemented over the S3-compatible Cloudflare R2 API,
/// so the Application layer stays agnostic of the concrete provider and of its credentials.
/// </summary>
public interface IImageStorageService
{
    /// <summary>Maximum accepted upload size in bytes, from configuration.</summary>
    long MaxFileSizeBytes { get; }
    /// <summary>Builds an unguessable object key inside the storage namespace.</summary>
    string CreateObjectKey(int productId, string extension);
    /// <summary>Public CDN URL for an object key.</summary>
    string BuildPublicUrl(string objectKey);
    Task PutAsync(string objectKey, Stream content, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string objectKey, CancellationToken ct = default);
    /// <summary>
    /// Read-only reachability probe used by the health endpoint. Must never throw: failures are
    /// reported as a status, so a diagnostic call cannot 500.
    /// </summary>
    Task<ImageStorageProbeResult> ProbeAsync(CancellationToken ct = default);
}
