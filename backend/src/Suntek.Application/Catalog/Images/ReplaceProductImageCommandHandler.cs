using MediatR;
using Suntek.Application.Common.Images;
using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Images;

public class ReplaceProductImageCommandHandler(
    IProductImageRepository imageRepository,
    IImageStorageService storage) : IRequestHandler<ReplaceProductImageCommand, ProductImageResult>
{
    public async Task<ProductImageResult> Handle(ReplaceProductImageCommand request, CancellationToken ct)
    {
        var image = await imageRepository.GetByIdAsync(request.ImageId, ct);
        if (image is null || image.ProductId != request.ProductId)
            return new ProductImageResult(null, ProductImageError.ImageNotFound);

        var (bytes, contentType, error) = await ImageUploadReader.ReadAsync(request.Content, storage.MaxFileSizeBytes, ct);
        if (bytes is null || contentType is null)
            return new ProductImageResult(null, error);

        var previousKey = image.ObjectKey;
        var objectKey = storage.CreateObjectKey(request.ProductId, ImageContentValidator.ExtensionFor(contentType));

        // The replacement is uploaded under a new key first: a failure at any point leaves the
        // original object and row untouched.
        using (var upload = new MemoryStream(bytes, writable: false))
        {
            await storage.PutAsync(objectKey, upload, contentType, ct);
        }

        image.ObjectKey = objectKey;
        image.ContentType = contentType;
        image.FileSizeBytes = bytes.LongLength;
        image.OriginalFileName = ImageContentValidator.SanitizeFileName(request.FileName);

        try
        {
            await imageRepository.UpdateAsync(image, ct);
        }
        catch
        {
            try { await storage.DeleteAsync(objectKey, ct); } catch { }
            throw;
        }

        if (!string.Equals(previousKey, objectKey, StringComparison.Ordinal))
        {
            try { await storage.DeleteAsync(previousKey, ct); } catch { }
        }

        return new ProductImageResult(image.ToDto(storage), ProductImageError.None);
    }
}
