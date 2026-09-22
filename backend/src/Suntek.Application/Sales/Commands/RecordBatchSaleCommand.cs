using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Application.Sales.Commands;

// Unit and EnteredQuantity are optional so clients that predate them keep working: when they
// are absent the handler falls back to the previous behaviour (Quantity * UnitPrice).
public record BatchSaleItemDto(
    int ProductId,
    decimal Quantity,
    SaleType SaleType,
    decimal UnitPrice,
    SoldUnit? Unit = null,
    decimal? EnteredQuantity = null);

public record RecordBatchSaleCommand(
    List<BatchSaleItemDto> Items,
    string? ClientName = null,
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
    decimal? CashAmount = null,
    decimal? QrAmount = null) : IRequest<RecordBatchSaleResult>;

public record RecordBatchSaleResult(
    bool Success,
    string? ErrorMessage,
    string? TicketCode,
    decimal TotalAmount,
    List<ProductDto>? UpdatedProducts);
