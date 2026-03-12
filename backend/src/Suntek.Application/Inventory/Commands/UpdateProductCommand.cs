using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Inventory.Commands;

public record UpdateProductCommand(int Id, string Name, int Quantity) : IRequest<ProductDto?>;
