using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Sales.Queries;

public class GetMovementHistoryQueryHandler(IInventoryMovementRepository movementRepository)
    : IRequestHandler<GetMovementHistoryQuery, MovementHistoryPageResult>
{
    public async Task<MovementHistoryPageResult> Handle(GetMovementHistoryQuery request, CancellationToken ct)
    {
        var (movements, totalCount, totalSalesBsInRange, resolvedPage) = await movementRepository.GetMovementHistoryPageAsync(
            request.StartDateUtc,
            request.EndDateUtc,
            request.Page,
            request.PageSize,
            ct);

        var items = movements
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
                m.SaleId,
                m.Sale != null ? m.Sale.UnitPrice : null,
                m.Sale != null ? m.Sale.TotalPrice : null))
            .ToList();

        return new MovementHistoryPageResult(
            items,
            totalCount,
            totalSalesBsInRange,
            resolvedPage,
            request.PageSize);
    }
}