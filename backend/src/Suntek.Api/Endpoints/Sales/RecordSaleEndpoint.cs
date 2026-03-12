using FastEndpoints;
using MediatR;
using Suntek.Application.Sales.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Sales;

public class RecordSaleRequest
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public SaleType SaleType { get; set; }
    public decimal UnitPrice { get; set; }
}

public class RecordSaleResponse
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? Id { get; set; }
    public int? WholesaleQuantity { get; set; }
    public decimal? RetailQuantity { get; set; }
}

public class RecordSaleEndpoint(IMediator mediator) : Endpoint<RecordSaleRequest, RecordSaleResponse>
{
    public override void Configure()
    {
        Post("/api/sales");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(RecordSaleRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new RecordSaleCommand(
            req.ProductId, req.Quantity, req.SaleType, req.UnitPrice), ct);
        if (!result.Success)
        {
            Response = new RecordSaleResponse { Success = false, ErrorMessage = result.ErrorMessage };
            await Send.OkAsync(Response, ct);
            return;
        }
        Response = new RecordSaleResponse
        {
            Success = true,
            WholesaleQuantity = result.Product!.WholesaleQuantity,
            RetailQuantity = result.Product.RetailQuantity
        };
        await Send.OkAsync(Response, ct);
    }
}
