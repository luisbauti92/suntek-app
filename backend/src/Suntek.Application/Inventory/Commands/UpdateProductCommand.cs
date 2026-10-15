using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Inventory.Commands;

public record UpdateProductCommand(
    int Id,
    string Sku,
    string Name,
    decimal Length,
    decimal Width,
    int RollsPerBox,
    decimal PricePerRoll,
    decimal PricePerMeter,
    CatalogCategoryUpdate? Category = null,
    ManufacturerInfo? Manufacturer = null) : IRequest<UpdateProductResult>;
