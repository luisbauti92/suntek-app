using MediatR;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Queries;

public class GetPublicCatalogProductsQueryHandler(IProductRepository productRepository)
    : IRequestHandler<GetPublicCatalogProductsQuery, IReadOnlyList<PublicCatalogProductDto>>
{
    public async Task<IReadOnlyList<PublicCatalogProductDto>> Handle(
        GetPublicCatalogProductsQuery request,
        CancellationToken ct)
    {
        var products = await productRepository.GetAllAsync(ct);
        return products.Select(Map).ToList();
    }

    private static PublicCatalogProductDto Map(Product p)
    {
        var unit = p.UnitType == UnitType.Meters ? "Meters" : "Units";
        return new PublicCatalogProductDto(
            p.Id,
            p.Sku,
            p.Name,
            p.PricePerRoll,
            p.PricePerMeter,
            p.Quantity,
            p.Width,
            p.Length,
            unit,
            p.RollsPerBox,
            p.WholesaleQuantity,
            p.RetailQuantity,
            InferCategory(p),
            "SUNTEK",
            MilThickness: null,
            UvProtection: null,
            ImageUrl: null);
    }

    /// <summary>
    /// La entidad <see cref="Product"/> no tiene categoría de catálogo; se infiere hasta exista columna/API.
    /// </summary>
    private static string InferCategory(Product p)
    {
        if (p.UnitType == UnitType.Meters)
            return "films";

        var sku = p.Sku.ToUpperInvariant();
        var name = p.Name.ToUpperInvariant();
        if (sku.Contains("TOOL", StringComparison.Ordinal) || name.Contains("HERRAMIENTA", StringComparison.Ordinal))
            return "tools";

        return "accessories";
    }
}
