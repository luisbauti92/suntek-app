using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Images;

public class ReorderProductImagesCommandHandler(IProductImageRepository imageRepository)
    : IRequestHandler<ReorderProductImagesCommand, ProductImageOperationResult>
{
    public async Task<ProductImageOperationResult> Handle(ReorderProductImagesCommand request, CancellationToken ct)
    {
        var images = await imageRepository.GetByProductIdAsync(request.ProductId, ct);
        if (images.Count == 0)
            return new ProductImageOperationResult(ProductImageError.ProductNotFound);

        var orderedIds = request.OrderedIds ?? [];
        var isCompleteAndUnique = orderedIds.Count == images.Count
            && orderedIds.Distinct().Count() == images.Count
            && images.All(i => orderedIds.Contains(i.Id));

        if (!isCompleteAndUnique)
            return new ProductImageOperationResult(ProductImageError.InvalidOrder);

        var byId = images.ToDictionary(i => i.Id);
        for (var index = 0; index < orderedIds.Count; index++)
            byId[orderedIds[index]].SortOrder = index;

        await imageRepository.UpdateRangeAsync(images, ct);
        return new ProductImageOperationResult(ProductImageError.None);
    }
}
