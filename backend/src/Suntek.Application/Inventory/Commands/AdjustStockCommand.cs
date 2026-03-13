using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Inventory.Commands;

public record AdjustStockCommand(
    int ProductId,
    int Quantity,
    string? Reason) : IRequest<ProductDto?>;

