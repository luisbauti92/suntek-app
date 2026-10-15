using Suntek.Domain.Enums;

namespace Suntek.Application.Common.Models;

public record ProductDto(
    int Id,
    string Sku,
    string Name,
    int Quantity,
    decimal Length,
    decimal Width,
    decimal PricePerRoll,
    decimal PricePerMeter,
    int RollsPerBox,
    UnitType UnitType,
    string? Manufacturer,
    decimal? ManufacturerPriceUsd,
    int WholesaleQuantity,
    decimal RetailQuantity,
    ProductStatus Status,
    DateTime CreatedAt,
    CatalogCategory? Category,
    /// <summary>Public URL of the product's primary image, or null when it has none.</summary>
    string? PrimaryImageUrl = null);
