using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class RegisterStockRequest
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal PricePerRoll { get; set; }
    public decimal PricePerMeter { get; set; }
    public int RollsPerBox { get; set; }
    public UnitType UnitType { get; set; }
}

public class RegisterStockResponse
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal PricePerRoll { get; set; }
    public decimal PricePerMeter { get; set; }
    public int RollsPerBox { get; set; }
    public UnitType UnitType { get; set; }
    public int WholesaleQuantity { get; set; }
    public decimal RetailQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RegisterStockEndpoint(IMediator mediator) : Endpoint<RegisterStockRequest, RegisterStockResponse>
{
    public override void Configure()
    {
        Post("/api/inventory");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(RegisterStockRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new RegisterStockCommand(
            req.Sku, req.Name, req.Quantity, req.Length, req.Width, req.PricePerRoll, req.PricePerMeter,
            req.RollsPerBox, req.UnitType), ct);
        Response = new RegisterStockResponse
        {
            Id = result.Id,
            Sku = result.Sku,
            Name = result.Name,
            Quantity = result.Quantity,
            Length = result.Length,
            Width = result.Width,
            PricePerRoll = result.PricePerRoll,
            PricePerMeter = result.PricePerMeter,
            RollsPerBox = result.RollsPerBox,
            UnitType = result.UnitType,
            WholesaleQuantity = result.WholesaleQuantity,
            RetailQuantity = result.RetailQuantity,
            CreatedAt = result.CreatedAt
        };
        await Send.OkAsync(Response, ct);
    }
}
