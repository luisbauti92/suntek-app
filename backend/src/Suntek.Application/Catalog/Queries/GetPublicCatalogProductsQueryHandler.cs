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
        // El catálogo público solo expone productos activos. Discontinued y Archived quedan
        // fuera; el filtro global (Status != Archived) se mantiene en el DbContext.
        var products = await productRepository.GetAllAsync(ProductStatus.Active, ct);
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
            ResolveCategory(p),
            "SUNTEK",
            MilThickness: null,
            UvProtection: null,
            ImageUrl: null);
    }

    /// <summary>
    /// Una categoría explícita manda. Para productos legacy (Category nula) se mantiene la
    /// inferencia por tipo de unidad/SKU.
    /// </summary>
    private static string ResolveCategory(Product p) => p.Category switch
    {
        CatalogCategory.Films => "films",
        CatalogCategory.Tools => "tools",
        CatalogCategory.Accessories => "accessories",
        CatalogCategory.Materials => "materials",
        _ => InferCategory(p)
    };

    /// <summary>Heurística legacy para productos sin categoría explícita.</summary>
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
