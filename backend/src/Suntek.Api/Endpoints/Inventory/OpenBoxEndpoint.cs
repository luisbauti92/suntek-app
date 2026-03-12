using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class OpenBoxResponse
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int WholesaleQuantity { get; set; }
    public decimal RetailQuantity { get; set; }
    public int RollsPerBox { get; set; }
    public UnitType UnitType { get; set; }
}

public class OpenBoxEndpoint(IMediator mediator) : EndpointWithoutRequest<OpenBoxResponse>
{
    public override void Configure()
    {
        Post("/api/inventory/{id}/open-box");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<int>("id");
        var result = await mediator.Send(new OpenBoxCommand(id), ct);
        if (result == null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }
        Response = new OpenBoxResponse
        {
            Id = result.Id,
            Sku = result.Sku,
            Name = result.Name,
            WholesaleQuantity = result.WholesaleQuantity,
            RetailQuantity = result.RetailQuantity,
            RollsPerBox = result.RollsPerBox,
            UnitType = result.UnitType
        };
        await Send.OkAsync(Response, ct);
    }
}
