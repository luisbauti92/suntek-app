using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Application.Inventory.Queries;

public record GetProductsQuery(ProductStatus? Status = null) : IRequest<IReadOnlyList<ProductDto>>;
