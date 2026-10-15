using System.Buffers;

namespace Suntek.Application.Common.Images;

/// <summary>
/// Validates image uploads from their actual bytes rather than from the extension or the
/// client-provided MIME type, which are both trivially spoofable.
/// </summary>
public static class ImageContentValidator
{
    public const string Jpeg = "image/jpeg";
    public const string Png = "image/png";
    public const string Webp = "image/webp";

    /// <summary>Returns the detected content type, or null when the bytes are not a supported image.</summary>
    public static string? DetectContentType(ReadOnlySpan<byte> content)
    {
        if (content.Length >= 3 && content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF)
            return Jpeg;

        if (content.Length >= 8
            && content[0] == 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47
            && content[4] == 0x0D && content[5] == 0x0A && content[6] == 0x1A && content[7] == 0x0A)
            return Png;

        if (content.Length >= 12
            && content[0] == (byte)'R' && content[1] == (byte)'I' && content[2] == (byte)'F' && content[3] == (byte)'F'
            && content[8] == (byte)'W' && content[9] == (byte)'E' && content[10] == (byte)'B' && content[11] == (byte)'P')
            return Webp;

        return null;
    }

    public static string ExtensionFor(string contentType) => contentType switch
    {
        Jpeg => "jpg",
        Png => "png",
        Webp => "webp",
        _ => throw new ArgumentOutOfRangeException(nameof(contentType), contentType, "Unsupported image content type.")
    };

    /// <summary>
    /// Buffers the stream while enforcing the size limit. Returns null when the limit is exceeded,
    /// so an oversized upload never reaches storage.
    /// </summary>
    public static async Task<byte[]?> ReadWithinLimitAsync(Stream source, long maxBytes, CancellationToken ct)
    {
        var buffer = new MemoryStream();
        var chunk = ArrayPool<byte>.Shared.Rent(81920);
        try
        {
            long total = 0;
            int read;
            while ((read = await source.ReadAsync(chunk.AsMemory(0, chunk.Length), ct)) > 0)
            {
                total += read;
                if (total > maxBytes)
                    return null;

                await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
            }

            return buffer.ToArray();
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(chunk);
            await buffer.DisposeAsync();
        }
    }

    /// <summary>Keeps only a plausible file name; the value is metadata and never used to build a path.</summary>
    public static string? SanitizeFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return null;

        // Strip any directory component from both Windows and POSIX-style paths before storing.
        var name = fileName.Trim();
        var lastSeparator = name.LastIndexOfAny(['/', '\\']);
        if (lastSeparator >= 0)
            name = name[(lastSeparator + 1)..];

        if (name.Length > 200)
            name = name[..200];

        return string.IsNullOrWhiteSpace(name) ? null : name;
    }
}
