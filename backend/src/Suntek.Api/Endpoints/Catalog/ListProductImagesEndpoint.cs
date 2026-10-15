using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Images;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Catalog;

/// <summary>
/// Gallery of a product. Operators can view images; only Admins mutate them (see the write endpoints).
/// </summary>
public class ListProductImagesEndpoint(IMediator mediator) : EndpointWithoutRequest<List<ProductImageDto>>
{
    public override void Configure()
    {
        Get("/api/products/{id}/images");
        Roles(AppRoles.Admin, AppRoles.Operator);
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<int>("id");
        var result = await mediator.Send(new GetProductImagesQuery(id), ct);

        if (result.Error == ProductImageError.ProductNotFound)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        Response = result.Images.ToList();
        await Send.OkAsync(Response, ct);
    }
}
