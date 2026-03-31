using MediatR;

namespace Suntek.Application.Inventory.Commands;

public record UpdateProductCommand(
    int Id,
    string Sku,
    string Name,
    decimal Length,
    decimal Width,
    int RollsPerBox,
    decimal PricePerRoll,
    decimal PricePerMeter) : IRequest<UpdateProductResult>;
