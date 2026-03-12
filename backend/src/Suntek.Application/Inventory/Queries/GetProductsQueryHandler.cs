using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Queries;

public class GetProductsQueryHandler(IProductRepository productRepository) : IRequestHandler<GetProductsQuery, IReadOnlyList<ProductDto>>
{
    public async Task<IReadOnlyList<ProductDto>> Handle(GetProductsQuery request, CancellationToken ct)
    {
        var products = await productRepository.GetAllAsync(ct);
        return products
            .Select(p => new ProductDto(p.Id, p.Sku, p.Name, p.Quantity, p.Length, p.Width, p.PricePerRoll, p.PricePerMeter,
                p.RollsPerBox, p.UnitType, p.WholesaleQuantity, p.RetailQuantity, p.CreatedAt))
            .ToList();
    }
}
