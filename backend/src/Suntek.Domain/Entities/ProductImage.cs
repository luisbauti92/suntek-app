namespace Suntek.Domain.Entities;

/// <summary>
/// Public catalog photograph for a product. The R2 object key is the source of truth: the CDN
/// URL is derived at read time, so the bucket or public domain can change without migrating rows.
/// </summary>
public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    /// <summary>R2 object key, unique per image. Generated server-side, never from user input.</summary>
    public string ObjectKey { get; set; } = string.Empty;
    /// <summary>Content type detected from the file bytes (image/jpeg, image/png, image/webp).</summary>
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? OriginalFileName { get; set; }
    /// <summary>Deterministic display order within a product; the lowest value is shown first.</summary>
    public int SortOrder { get; set; }
    /// <summary>At most one image per product is primary; it is the one shown on catalog cards.</summary>
    public bool IsPrimary { get; set; }
    public DateTime CreatedAt { get; set; }
}
