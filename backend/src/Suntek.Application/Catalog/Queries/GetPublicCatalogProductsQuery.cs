using MediatR;

namespace Suntek.Application.Catalog.Queries;

/// <summary>DTO público para el catálogo web (sin datos internos sensibles).</summary>
public record PublicCatalogProductDto(
    int Id,
    string Sku,
    string Name,
    decimal PricePerRoll,
    decimal PricePerMeter,
    int Quantity,
    decimal Width,
    decimal Length,
    string UnitType,
    int RollsPerBox,
    int WholesaleQuantity,
    decimal RetailQuantity,
    string Category,
    string Brand,
    string? MilThickness,
    string? UvProtection,
    string? ImageUrl);

public record GetPublicCatalogProductsQuery : IRequest<IReadOnlyList<PublicCatalogProductDto>>;
