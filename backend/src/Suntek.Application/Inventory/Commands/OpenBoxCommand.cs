using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Inventory.Commands;

public record OpenBoxCommand(int ProductId) : IRequest<ProductDto?>;
