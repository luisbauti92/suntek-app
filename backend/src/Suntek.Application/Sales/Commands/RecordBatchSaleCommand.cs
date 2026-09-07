using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Application.Sales.Commands;

public record BatchSaleItemDto(
    int ProductId,
    decimal Quantity,
    SaleType SaleType,
    decimal UnitPrice);

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
