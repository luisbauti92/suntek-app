using MediatR;
using Suntek.Application.Common.Images;
using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Entities;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Images;

public class UploadProductImageCommandHandler(
    IProductRepository productRepository,
    IProductImageRepository imageRepository,
    IImageStorageService storage) : IRequestHandler<UploadProductImageCommand, ProductImageResult>
{
    public async Task<ProductImageResult> Handle(UploadProductImageCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return new ProductImageResult(null, ProductImageError.ProductNotFound);

        var (bytes, contentType, error) = await ImageUploadReader.ReadAsync(request.Content, storage.MaxFileSizeBytes, ct);
        if (bytes is null || contentType is null)
            return new ProductImageResult(null, error);

        var objectKey = storage.CreateObjectKey(product.Id, ImageContentValidator.ExtensionFor(contentType));

        using (var upload = new MemoryStream(bytes, writable: false))
        {
            await storage.PutAsync(objectKey, upload, contentType, ct);
        }

        var existing = await imageRepository.GetByProductIdAsync(product.Id, ct);
        var image = new ProductImage
        {
            ProductId = product.Id,
            ObjectKey = objectKey,
            ContentType = contentType,
            FileSizeBytes = bytes.LongLength,
            OriginalFileName = ImageContentValidator.SanitizeFileName(request.FileName),
            SortOrder = existing.Count == 0 ? 0 : existing.Max(i => i.SortOrder) + 1,
            IsPrimary = existing.Count == 0,
            CreatedAt = DateTime.UtcNow,
        };

        try
        {
            await imageRepository.AddAsync(image, ct);
        }
        catch
        {
            // Compensation: an object must never outlive a row that failed to persist.
            try { await storage.DeleteAsync(objectKey, ct); } catch { }
            throw;
        }

        return new ProductImageResult(image.ToDto(storage), ProductImageError.None);
    }
}
