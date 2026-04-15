using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class UpdateProductStatusRequest
{
    public ProductStatus Status { get; set; }
}

public class UpdateProductStatusEndpoint(IMediator mediator) : Endpoint<UpdateProductStatusRequest>
{
    public override void Configure()
    {
        Patch("/api/products/{id}/status");
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(UpdateProductStatusRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var ok = await mediator.Send(new UpdateProductStatusCommand(id, req.Status), ct);
        if (!ok)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
