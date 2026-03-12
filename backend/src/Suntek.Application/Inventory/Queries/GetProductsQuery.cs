using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Inventory.Queries;

public record GetProductsQuery : IRequest<IReadOnlyList<ProductDto>>;
