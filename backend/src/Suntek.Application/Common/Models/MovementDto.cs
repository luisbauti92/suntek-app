using Suntek.Domain.Enums;

namespace Suntek.Application.Common.Models;

public record MovementDto(
    int Id,
    MovementType MovementType,
    int ProductId,
    string ProductSku,
    string ProductName,
    decimal Quantity,
    string QuantityUnit,
    string Description,
    int? WholesaleQuantityAfter,
    decimal? RetailQuantityAfter,
    DateTime CreatedAt,
    int? SaleId);
