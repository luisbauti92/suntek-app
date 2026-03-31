using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class UpdateInventoryRequest
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public int RollsPerBox { get; set; }
    public decimal PricePerRoll { get; set; }
    public decimal PricePerMeter { get; set; }
}

public class UpdateInventoryResponse
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

public class UpdateInventoryEndpoint(IMediator mediator) : Endpoint<UpdateInventoryRequest, UpdateInventoryResponse>
{
    public override void Configure()
    {
        Put("/api/inventory/{id}");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(UpdateInventoryRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var result = await mediator.Send(
            new UpdateProductCommand(id, req.Sku, req.Name, req.Length, req.Width, req.RollsPerBox, req.PricePerRoll, req.PricePerMeter),
            ct);

        if (result.Error == UpdateProductError.NotFound)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        if (result.Error == UpdateProductError.DuplicateSku)
            ThrowError("Another product already uses this SKU.", statusCode: StatusCodes.Status409Conflict);

        if (result.Error == UpdateProductError.InvalidInput || result.Error == UpdateProductError.InvalidPrice)
            ThrowError(
                "SKU, name, and prices must be valid (prices cannot be negative).",
                statusCode: StatusCodes.Status400BadRequest);

        var p = result.Product!;
        Response = new UpdateInventoryResponse
        {
            Id = p.Id,
            Sku = p.Sku,
            Name = p.Name,
            Quantity = p.Quantity,
            Length = p.Length,
            Width = p.Width,
            PricePerRoll = p.PricePerRoll,
            PricePerMeter = p.PricePerMeter,
            RollsPerBox = p.RollsPerBox,
            UnitType = p.UnitType,
            WholesaleQuantity = p.WholesaleQuantity,
            RetailQuantity = p.RetailQuantity,
            CreatedAt = p.CreatedAt,
        };
        await Send.OkAsync(Response, ct);
    }
}
