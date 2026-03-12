using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Queries;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class ProductDto
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

public class ListInventoryEndpoint(IMediator mediator) : EndpointWithoutRequest<List<ProductDto>>
{
    public override void Configure()
    {
        Get("/api/inventory");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var products = await mediator.Send(new GetProductsQuery(), ct);
        Response = products
            .Select(p => new ProductDto
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
                CreatedAt = p.CreatedAt
            })
            .ToList();
        await Send.OkAsync(Response, ct);
    }
}
