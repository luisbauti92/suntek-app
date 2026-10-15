using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Entities;

namespace Suntek.Application.Catalog.Images;

public record ProductImageDto(
    int Id,
    int ProductId,
    string ObjectKey,
    string Url,
    string ContentType,
    long FileSizeBytes,
    string? OriginalFileName,
    int SortOrder,
    bool IsPrimary,
    DateTime CreatedAt);

public enum ProductImageError
{
    None,
    ProductNotFound,
    ImageNotFound,
    InvalidFile,
    FileTooLarge,
    InvalidOrder
}

public record ProductImageResult(ProductImageDto? Image, ProductImageError Error);
public record ProductImageListResult(IReadOnlyList<ProductImageDto> Images, ProductImageError Error);
public record ProductImageOperationResult(ProductImageError Error);

public static class ProductImageMapping
{
    public static ProductImageDto ToDto(this ProductImage image, IImageStorageService storage) => new(
        image.Id,
        image.ProductId,
        image.ObjectKey,
        storage.BuildPublicUrl(image.ObjectKey),
        image.ContentType,
        image.FileSizeBytes,
        image.OriginalFileName,
        image.SortOrder,
        image.IsPrimary,
        image.CreatedAt);
}
