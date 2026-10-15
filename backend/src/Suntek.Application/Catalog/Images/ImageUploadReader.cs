using Suntek.Application.Common.Images;

namespace Suntek.Application.Catalog.Images;

/// <summary>
/// Buffers and validates an upload in one place, so every write path (upload, replace) applies the
/// same size limit and the same content-based detection.
/// </summary>
internal static class ImageUploadReader
{
    public static async Task<(byte[]? Bytes, string? ContentType, ProductImageError Error)> ReadAsync(
        Stream content, long maxBytes, CancellationToken ct)
    {
        var bytes = await ImageContentValidator.ReadWithinLimitAsync(content, maxBytes, ct);
        if (bytes is null)
            return (null, null, ProductImageError.FileTooLarge);

        if (bytes.Length == 0)
            return (null, null, ProductImageError.InvalidFile);

        var contentType = ImageContentValidator.DetectContentType(bytes);
        if (contentType is null)
            return (null, null, ProductImageError.InvalidFile);

        return (bytes, contentType, ProductImageError.None);
    }
}
