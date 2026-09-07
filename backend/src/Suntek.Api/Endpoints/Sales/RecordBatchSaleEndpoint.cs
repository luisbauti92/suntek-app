using FastEndpoints;
using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Application.Sales.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Sales;

public class RecordBatchSaleRequest
{
    public List<BatchSaleItemDto> Items { get; set; } = [];
    public string? ClientName { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal? CashAmount { get; set; }
    public decimal? QrAmount { get; set; }
}

public class RecordBatchSaleResponse
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? TicketCode { get; set; }
    public decimal TotalAmount { get; set; }
    public List<ProductDto>? UpdatedProducts { get; set; }
}

public class RecordBatchSaleEndpoint(IMediator mediator) : Endpoint<RecordBatchSaleRequest, RecordBatchSaleResponse>
{
    public override void Configure()
    {
        Post("/api/sales/batch");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(RecordBatchSaleRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new RecordBatchSaleCommand(
            req.Items,
            req.ClientName,
            req.PaymentMethod,
            req.CashAmount,
            req.QrAmount), ct);

        if (!result.Success)
        {
            Response = new RecordBatchSaleResponse
            {
                Success = false,
                ErrorMessage = result.ErrorMessage
            };
            await Send.OkAsync(Response, ct);
            return;
        }

        Response = new RecordBatchSaleResponse
        {
            Success = true,
            TicketCode = result.TicketCode,
            TotalAmount = result.TotalAmount,
            UpdatedProducts = result.UpdatedProducts
        };
        await Send.OkAsync(Response, ct);
    }
}
