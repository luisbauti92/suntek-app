namespace Suntek.Application.Common.Models;

public record SaleReportDto(
    DateTime DateUtc,
    string Sku,
    string ProductName,
    decimal Quantity,
    string Unit,
    decimal UnitPriceBs,
    decimal TotalBs);
