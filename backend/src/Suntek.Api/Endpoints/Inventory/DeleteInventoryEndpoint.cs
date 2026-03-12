using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class DeleteInventoryEndpoint(IMediator mediator) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/api/inventory/{id}");
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<int>("id");
        var deleted = await mediator.Send(new DeleteProductCommand(id), ct);
        if (!deleted)
        {
            await Send.NotFoundAsync(ct);
            return;
        }
        await Send.NoContentAsync(ct);
    }
}
