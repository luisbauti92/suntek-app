using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Sales.Queries;

public class GetMovementHistoryQueryHandler(IInventoryMovementRepository movementRepository)
    : IRequestHandler<GetMovementHistoryQuery, IReadOnlyList<MovementDto>>
{
    public async Task<IReadOnlyList<MovementDto>> Handle(GetMovementHistoryQuery request, CancellationToken ct)
    {
        var movements = await movementRepository.GetAllOrderedByDateDescAsync(ct);
        return movements
            .Select(m => new MovementDto(
                m.Id,
                m.MovementType,
                m.ProductId,
                m.Product.Sku,
                m.Product.Name,
                m.Quantity,
                m.QuantityUnit,
                m.Description,
                m.WholesaleQuantityAfter,
                m.RetailQuantityAfter,
                m.CreatedAt,
                m.SaleId))
            .ToList();
    }
}