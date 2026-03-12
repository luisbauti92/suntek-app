using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Application.Sales.Commands;

public record RecordSaleCommand(
    int ProductId,
    decimal Quantity,
    SaleType SaleType,
    decimal UnitPrice) : IRequest<RecordSaleResult>;

public record RecordSaleResult(bool Success, string? ErrorMessage, ProductDto? Product);
