using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Application.Inventory.Commands;

public record RegisterStockCommand(
    string Sku,
    string Name,
    int Quantity,
    decimal Length,
    decimal Width,
    decimal PricePerRoll,
    decimal PricePerMeter,
    int RollsPerBox,
    UnitType UnitType) : IRequest<ProductDto>;
