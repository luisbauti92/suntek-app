using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class AdjustStockRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public string? Reason { get; set; }
}

public class AdjustStockResponse
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int WholesaleQuantity { get; set; }
    public decimal RetailQuantity { get; set; }
}

public class AdjustStockEndpoint(IMediator mediator) : Endpoint<AdjustStockRequest, AdjustStockResponse>
{
    public override void Configure()
    {
        Post("/api/inventory/adjust-stock");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(AdjustStockRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new AdjustStockCommand(req.ProductId, req.Quantity, req.Reason), ct);
        if (result == null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        Response = new AdjustStockResponse
        {
            Id = result.Id,
            Sku = result.Sku,
            Name = result.Name,
            Quantity = result.Quantity,
            WholesaleQuantity = result.WholesaleQuantity,
            RetailQuantity = result.RetailQuantity
        };
        await Send.OkAsync(Response, ct);
    }
}

