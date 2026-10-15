using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Suntek.Application.Common.Interfaces;

namespace Suntek.Infrastructure.Storage;

/// <summary>
/// Uploads catalog images to Cloudflare R2 through its S3-compatible API. The bucket is dedicated to
/// public catalog assets; the client is built with credentials scoped to that bucket only.
/// </summary>
public sealed class R2ImageStorageService : IImageStorageService, IDisposable
{
    private readonly R2Options _options;
    private readonly IAmazonS3? _client;

    public R2ImageStorageService(R2Options options)
    {
        _options = options;

        // The client is created lazily-ish: when the bucket is not configured (e.g. local dev without
        // secrets) the app still boots and reports a clear error only if an image operation runs.
        if (options.IsConfigured)
        {
            var config = new AmazonS3Config
            {
                ServiceURL = options.Endpoint,
                ForcePathStyle = true,
                AuthenticationRegion = "auto",
            };

            _client = new AmazonS3Client(options.AccessKeyId, options.SecretAccessKey, config);
        }
    }

    public long MaxFileSizeBytes => _options.MaxFileSizeBytes;

    public string CreateObjectKey(int productId, string extension)
    {
        var prefix = string.IsNullOrWhiteSpace(_options.KeyPrefix)
            ? R2Options.DefaultKeyPrefix
            : _options.KeyPrefix.Trim('/');

        // The key is fully server-generated: a random, unguessable name under the product's folder.
        // No part of the client-supplied file name ever reaches the key.
        return $"{prefix}/{productId}/{Guid.NewGuid():N}.{extension}";
    }

    public string BuildPublicUrl(string objectKey) => $"{_options.PublicBaseUrl.TrimEnd('/')}/{objectKey}";

    public async Task PutAsync(string objectKey, Stream content, string contentType, CancellationToken ct = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            InputStream = content,
            ContentType = contentType,
            AutoCloseStream = false,
            // R2 does not implement streaming SigV4 payload signing. The SDK enables chunked
            // signing by default, which makes R2 answer
            // "STREAMING-AWS4-HMAC-SHA256-PAYLOAD not implemented" (verified live). The stream is
            // a seekable MemoryStream, so the length is known and a normal signed payload works.
            UseChunkEncoding = false,
            // R2 also rejects the checksum header the AWS SDK v4 adds by default.
            DisableDefaultChecksumValidation = true,
        };

        await Client.PutObjectAsync(request, ct);
    }

    public async Task DeleteAsync(string objectKey, CancellationToken ct = default)
    {
        await Client.DeleteObjectAsync(
            new DeleteObjectRequest { BucketName = _options.BucketName, Key = objectKey }, ct);
    }

    /// <summary>
    /// Read-only probe: lists a single key to verify endpoint, bucket and credentials together.
    /// </summary>
    public async Task<ImageStorageProbeResult> ProbeAsync(CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
            return new ImageStorageProbeResult(ImageStorageProbeStatus.NotConfigured, "Cloudflare R2 settings are incomplete.");

        try
        {
            await Client.ListObjectsV2Async(
                new ListObjectsV2Request { BucketName = _options.BucketName, MaxKeys = 1 }, ct);

            return new ImageStorageProbeResult(ImageStorageProbeStatus.Healthy);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.Forbidden)
        {
            // A token scoped to object read/write may legitimately lack s3:ListBucket. The
            // credentials still work, so this is not a failure.
            return new ImageStorageProbeResult(
                ImageStorageProbeStatus.Degraded,
                "Credentials lack s3:ListBucket, so the bucket could not be listed.");
        }
        catch (AmazonS3Exception ex)
        {
            return new ImageStorageProbeResult(
                ImageStorageProbeStatus.Unhealthy,
                $"R2 rejected the request: {ex.StatusCode} ({ex.ErrorCode}).");
        }
        catch (Exception ex)
        {
            // The exception type only: messages from the SDK may embed the endpoint URL.
            return new ImageStorageProbeResult(
                ImageStorageProbeStatus.Unhealthy,
                $"Could not reach R2: {ex.GetType().Name}.");
        }
    }

    private IAmazonS3 Client => _client ?? throw new InvalidOperationException(
        "Cloudflare R2 is not configured. Set CloudflareR2:BucketName, CloudflareR2:Endpoint, " +
        "CloudflareR2:AccessKeyId and CloudflareR2:SecretAccessKey.");

    public void Dispose() => _client?.Dispose();
}
