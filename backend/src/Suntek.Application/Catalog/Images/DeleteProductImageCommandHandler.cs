using MediatR;
using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Images;

public class DeleteProductImageCommandHandler(
    IProductImageRepository imageRepository,
    IUnitOfWork unitOfWork,
    IImageStorageService storage) : IRequestHandler<DeleteProductImageCommand, ProductImageOperationResult>
{
    public async Task<ProductImageOperationResult> Handle(DeleteProductImageCommand request, CancellationToken ct)
    {
        var image = await imageRepository.GetByIdAsync(request.ImageId, ct);
        if (image is null || image.ProductId != request.ProductId)
            return new ProductImageOperationResult(ProductImageError.ImageNotFound);

        var objectKey = image.ObjectKey;

        await unitOfWork.ExecuteInTransactionAsync(async c =>
        {
            await imageRepository.DeleteAsync(image, c);

            // Keep the "one primary per product" invariant: deleting the primary promotes the
            // next image in display order.
            if (image.IsPrimary)
            {
                var remaining = await imageRepository.GetByProductIdAsync(request.ProductId, c);
                var next = remaining.FirstOrDefault();
                if (next is not null)
                {
                    next.IsPrimary = true;
                    await imageRepository.UpdateAsync(next, c);
                }
            }
        }, ct);

        // The row is already gone, so a failed object delete only leaves an orphaned object,
        // never a dangling database reference.
        try { await storage.DeleteAsync(objectKey, ct); } catch { }

        return new ProductImageOperationResult(ProductImageError.None);
    }
}
