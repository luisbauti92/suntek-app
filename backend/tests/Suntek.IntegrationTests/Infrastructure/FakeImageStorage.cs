using Suntek.Application.Common.Interfaces;

namespace Suntek.IntegrationTests.Infrastructure;

/// <summary>
/// In-memory stand-in for Cloudflare R2. Tests must run without network access or credentials, so
/// the API's storage service is replaced by this fake (see <see cref="SuntekApiFactory"/>).
/// </summary>
public sealed class FakeImageStorage : IImageStorageService
{
    public const string PublicBaseUrl = "https://cdn.test.invalid";

    private readonly Dictionary<string, byte[]> _objects = new(StringComparer.Ordinal);

    /// <summary>Small on purpose: it keeps the size-limit test cheap to build.</summary>
    public long MaxFileSizeBytes { get; set; } = 4096;

    /// <summary>When true, the next upload throws, simulating a storage outage.</summary>
    public bool FailNextPut { get; set; }

    public int Count => _objects.Count;

    public bool Contains(string objectKey) => _objects.ContainsKey(objectKey);

    public string CreateObjectKey(int productId, string extension) =>
        $"catalog/products/{productId}/{Guid.NewGuid():N}.{extension}";

    public string BuildPublicUrl(string objectKey) => $"{PublicBaseUrl}/{objectKey}";

    public Task PutAsync(string objectKey, Stream content, string contentType, CancellationToken ct = default)
    {
        if (FailNextPut)
        {
            FailNextPut = false;
            throw new InvalidOperationException("Simulated storage failure.");
        }

        using var buffer = new MemoryStream();
        content.CopyTo(buffer);
        _objects[objectKey] = buffer.ToArray();
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string objectKey, CancellationToken ct = default)
    {
        _objects.Remove(objectKey);
        return Task.CompletedTask;
    }

    /// <summary>Result the health probe reports; tests override it to simulate degraded/unhealthy.</summary>
    public ImageStorageProbeResult ProbeResult { get; set; } = new(ImageStorageProbeStatus.Healthy);

    public Task<ImageStorageProbeResult> ProbeAsync(CancellationToken ct = default) =>
        Task.FromResult(ProbeResult);
}
