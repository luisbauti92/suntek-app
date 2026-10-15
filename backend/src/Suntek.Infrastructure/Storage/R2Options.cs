namespace Suntek.Infrastructure.Storage;

/// <summary>
/// Cloudflare R2 settings, bound from the <c>CloudflareR2</c> configuration section. Credentials are
/// never committed: they come from environment variables or the deployment secret store.
/// </summary>
public class R2Options
{
    public string BucketName { get; set; } = string.Empty;
    /// <summary>S3-compatible endpoint: the R2 account endpoint, in the form
    /// "https://" + account id + ".r2.cloudflarestorage.com".</summary>
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    /// <summary>Public CDN/custom domain that fronts the bucket (no trailing slash).</summary>
    public string PublicBaseUrl { get; set; } = string.Empty;
    /// <summary>Namespace for catalog objects inside the bucket.</summary>
    public string KeyPrefix { get; set; } = DefaultKeyPrefix;
    public long MaxFileSizeBytes { get; set; } = DefaultMaxFileSizeBytes;

    public const string DefaultKeyPrefix = "catalog/products";
    public const long DefaultMaxFileSizeBytes = 10 * 1024 * 1024;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(BucketName)
        && !string.IsNullOrWhiteSpace(Endpoint)
        && !string.IsNullOrWhiteSpace(AccessKeyId)
        && !string.IsNullOrWhiteSpace(SecretAccessKey);
}
