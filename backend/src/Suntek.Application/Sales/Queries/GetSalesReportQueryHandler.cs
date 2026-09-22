using MediatR;
using Suntek.Application.Common.Interfaces;
using Suntek.Application.Common.Models;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Sales.Queries;

public class GetSalesReportQueryHandler(
    IInventoryMovementRepository movementRepository,
    IExcelService excelService) : IRequestHandler<GetSalesReportQuery, byte[]>
{
    public async Task<byte[]> Handle(GetSalesReportQuery request, CancellationToken ct)
    {
        var nowUtc = DateTime.UtcNow;
        var endUtc = request.EndDateUtc.HasValue
            ? DateTime.SpecifyKind(request.EndDateUtc.Value, DateTimeKind.Utc)
            : nowUtc;
        var startUtc = request.StartDateUtc.HasValue
            ? DateTime.SpecifyKind(request.StartDateUtc.Value, DateTimeKind.Utc)
            : endUtc.AddDays(-30);

        var movements = await movementRepository.GetSalesMovementsByDateRangeAsync(startUtc, endUtc, ct);

        var dtos = movements
            .Where(m => m.Sale != null)
            .Select(m => new SaleReportDto(
                DateUtc: m.CreatedAt.Kind == DateTimeKind.Utc ? m.CreatedAt : DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                Sku: m.Product.Sku,
                ProductName: m.Product.Name,
                Quantity: m.Sale!.EnteredQuantity ?? m.Sale.Quantity,
                // Prefer the unit recorded on the sale (it can say "Rolls"); older rows fall back
                // to the movement, which only ever knows meters/units/boxes.
                Unit: m.Sale.Unit ?? m.QuantityUnit,
                UnitPriceBs: m.Sale.UnitPrice,
                TotalBs: m.Sale.TotalPrice))
            .ToList();

        return excelService.GenerateSalesReport(dtos, request.Language);
    }
}
