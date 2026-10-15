using MediatR;
using Suntek.Application.Common.Interfaces;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Queries;

public class GetProductsQueryHandler(
    IProductRepository productRepository,
    IProductImageRepository productImageRepository,
    IImageStorageService imageStorage) : IRequestHandler<GetProductsQuery, IReadOnlyList<ProductDto>>
{
    public async Task<IReadOnlyList<ProductDto>> Handle(GetProductsQuery request, CancellationToken ct)
    {
        var products = await productRepository.GetAllAsync(request.Status, ct);
        var primaryImageUrls = await LoadPrimaryImageUrlsAsync(products, ct);

        return products
            .Select(p => new ProductDto(p.Id, p.Sku, p.Name, p.Quantity, p.Length, p.Width, p.PricePerRoll, p.PricePerMeter,
                p.RollsPerBox, p.UnitType, p.Manufacturer, p.ManufacturerPriceUsd, p.WholesaleQuantity, p.RetailQuantity,
                p.Status, p.CreatedAt, p.Category, primaryImageUrls.GetValueOrDefault(p.Id)))
            .ToList();
    }

    private async Task<Dictionary<int, string>> LoadPrimaryImageUrlsAsync(
        IReadOnlyList<Product> products, CancellationToken ct)
    {
        if (products.Count == 0)
            return [];

        var images = await productImageRepository.GetByProductIdsAsync(products.Select(p => p.Id).ToList(), ct);

        return images
            .GroupBy(i => i.ProductId)
            .ToDictionary(group => group.Key, group => imageStorage.BuildPublicUrl(PickPrimary(group).ObjectKey));
    }

    private static ProductImage PickPrimary(IEnumerable<ProductImage> images)
    {
        var ordered = images as IReadOnlyList<ProductImage> ?? images.ToList();
        return ordered.FirstOrDefault(i => i.IsPrimary) ?? ordered[0];
    }
}
