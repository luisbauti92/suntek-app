using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Images;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Catalog;

public class ReorderProductImagesRequest
{
    /// <summary>All image ids of the product, in the desired display order.</summary>
    public List<int> ImageIds { get; set; } = [];
}

public class ReorderProductImagesEndpoint(IMediator mediator) : Endpoint<ReorderProductImagesRequest>
{
    public override void Configure()
    {
        Patch("/api/products/{id}/images/order");
        Roles(AppRoles.Admin);
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(ReorderProductImagesRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var result = await mediator.Send(new ReorderProductImagesCommand(id, req.ImageIds), ct);

        switch (result.Error)
        {
            case ProductImageError.ProductNotFound:
                await Send.NotFoundAsync(ct);
                return;
            case ProductImageError.InvalidOrder:
                AddError(r => r.ImageIds, "The list must contain every image of the product exactly once.");
                ThrowIfAnyErrors();
                return;
        }

        await Send.NoContentAsync(ct);
    }
}
