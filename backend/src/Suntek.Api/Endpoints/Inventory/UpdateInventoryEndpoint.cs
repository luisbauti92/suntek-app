using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class UpdateInventoryRequest
{
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class UpdateInventoryResponse
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateInventoryEndpoint(IMediator mediator) : Endpoint<UpdateInventoryRequest, UpdateInventoryResponse>
{
    public override void Configure()
    {
        Put("/api/inventory/{id}");
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(UpdateInventoryRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var result = await mediator.Send(new UpdateProductCommand(id, req.Name, req.Quantity), ct);
        if (result == null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }
        Response = new UpdateInventoryResponse
        {
            Id = result.Id,
            Sku = result.Sku,
            Name = result.Name,
            Quantity = result.Quantity,
            CreatedAt = result.CreatedAt
        };
        await Send.OkAsync(Response, ct);
    }
}
