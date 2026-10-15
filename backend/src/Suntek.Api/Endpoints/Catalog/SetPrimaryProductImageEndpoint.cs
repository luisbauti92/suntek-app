using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Images;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Catalog;

public class SetPrimaryProductImageEndpoint(IMediator mediator) : EndpointWithoutRequest<ProductImageDto>
{
    public override void Configure()
    {
        Patch("/api/products/{id}/images/{imageId}/primary");
        Roles(AppRoles.Admin);
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<int>("id");
        var imageId = Route<int>("imageId");

        var result = await mediator.Send(new SetPrimaryProductImageCommand(id, imageId), ct);
        if (result.Error == ProductImageError.ImageNotFound)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        Response = result.Image!;
        await Send.OkAsync(Response, ct);
    }
}
