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
    int WholesaleQuantity,
    decimal RetailQuantity,
    ProductStatus Status,
    DateTime CreatedAt);
