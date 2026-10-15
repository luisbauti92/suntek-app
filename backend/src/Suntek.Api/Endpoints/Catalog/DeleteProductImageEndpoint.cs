using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Images;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Catalog;

public class DeleteProductImageEndpoint(IMediator mediator) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/api/products/{id}/images/{imageId}");
        Roles(AppRoles.Admin);
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<int>("id");
        var imageId = Route<int>("imageId");

        var result = await mediator.Send(new DeleteProductImageCommand(id, imageId), ct);
        if (result.Error == ProductImageError.ImageNotFound)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
