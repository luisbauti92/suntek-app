using Suntek.Domain.Enums;

namespace Suntek.Application.Common.Models;

public record MovementDto(
    int Id,
    MovementType MovementType,
    int ProductId,
    string ProductSku,
    string ProductName,
    UnitType UnitType,
    decimal Quantity,
    string QuantityUnit,
    string Description,
    int? WholesaleQuantityAfter,
    decimal? RetailQuantityAfter,
    DateTime CreatedAt,
    int? SaleId,
    decimal? SaleUnitPriceBs,
    decimal? SaleTotalBs);
