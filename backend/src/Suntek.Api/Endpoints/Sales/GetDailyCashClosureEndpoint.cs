using FastEndpoints;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Api.Endpoints.Sales;

public class DailyCashClosureRequest
{
    public string? Date { get; set; } // Format YYYY-MM-DD (defaults to today in UTC-4 / Bolivia)
}

public class DailySaleItemDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? TicketCode { get; set; }
    public string? ClientName { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public SaleType SaleType { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal? CashAmount { get; set; }
    public decimal? QrAmount { get; set; }
}

public class DailyCashClosureResponse
{
    public string Date { get; set; } = string.Empty;
    public decimal TotalAmountBs { get; set; }
    public decimal TotalCashBs { get; set; }
    public decimal TotalQrBs { get; set; }
    public int SalesCount { get; set; }
    public List<DailySaleItemDto> Sales { get; set; } = [];
}

public class GetDailyCashClosureEndpoint(ISaleRepository saleRepository) : Endpoint<DailyCashClosureRequest, DailyCashClosureResponse>
{
    public override void Configure()
    {
        Get("/api/sales/daily-closure");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(DailyCashClosureRequest req, CancellationToken ct)
    {
        // Bolivia is UTC-4 year-round
        var boliviaOffset = TimeSpan.FromHours(-4);
        var nowBolivia = DateTimeOffset.UtcNow.ToOffset(boliviaOffset);

        DateTime targetDate;
        if (!string.IsNullOrWhiteSpace(req.Date) && DateTime.TryParse(req.Date, out var parsed))
        {
            targetDate = parsed.Date;
        }
        else
        {
            targetDate = nowBolivia.Date;
        }

        // Convert Bolivia start & end of day to UTC for DB query
        var startUtc = new DateTimeOffset(targetDate, boliviaOffset).UtcDateTime;
        var endUtc = new DateTimeOffset(targetDate.AddDays(1).AddTicks(-1), boliviaOffset).UtcDateTime;

        var sales = await saleRepository.GetSalesByDateRangeAsync(startUtc, endUtc, ct);

        decimal totalAmount = 0;
        decimal totalCash = 0;
        decimal totalQr = 0;

        var dtos = new List<DailySaleItemDto>();

        foreach (var s in sales)
        {
            totalAmount += s.TotalPrice;

            if (s.PaymentMethod == PaymentMethod.QrBcp)
            {
                totalQr += s.TotalPrice;
            }
            else if (s.PaymentMethod == PaymentMethod.Mixed)
            {
                totalCash += s.CashAmount ?? 0;
                totalQr += s.QrAmount ?? 0;
            }
            else // Cash
            {
                totalCash += s.TotalPrice;
            }

            dtos.Add(new DailySaleItemDto
            {
                Id = s.Id,
                CreatedAt = s.CreatedAt,
                TicketCode = s.TicketCode,
                ClientName = s.ClientName,
                ProductName = s.Product?.Name ?? "Producto",
                ProductSku = s.Product?.Sku ?? "-",
                Quantity = s.Quantity,
                SaleType = s.SaleType,
                UnitPrice = s.UnitPrice,
                TotalPrice = s.TotalPrice,
                PaymentMethod = s.PaymentMethod,
                CashAmount = s.CashAmount,
                QrAmount = s.QrAmount
            });
        }

        Response = new DailyCashClosureResponse
        {
            Date = targetDate.ToString("yyyy-MM-dd"),
            TotalAmountBs = decimal.Round(totalAmount, 2),
            TotalCashBs = decimal.Round(totalCash, 2),
            TotalQrBs = decimal.Round(totalQr, 2),
            SalesCount = sales.Count,
            Sales = dtos
        };

        await Send.OkAsync(Response, ct);
    }
}
