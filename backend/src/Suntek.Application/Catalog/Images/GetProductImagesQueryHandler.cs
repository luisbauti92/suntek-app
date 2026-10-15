using MediatR;
using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Images;

public class GetProductImagesQueryHandler(
    IProductRepository productRepository,
    IProductImageRepository imageRepository,
    IImageStorageService storage) : IRequestHandler<GetProductImagesQuery, ProductImageListResult>
{
    public async Task<ProductImageListResult> Handle(GetProductImagesQuery request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return new ProductImageListResult([], ProductImageError.ProductNotFound);

        var images = await imageRepository.GetByProductIdAsync(request.ProductId, ct);
        return new ProductImageListResult(images.Select(i => i.ToDto(storage)).ToList(), ProductImageError.None);
    }
}
