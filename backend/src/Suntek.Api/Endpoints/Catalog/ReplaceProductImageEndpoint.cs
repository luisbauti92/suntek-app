using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Images;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Catalog;

public class ReplaceProductImageRequest
{
    public IFormFile? File { get; set; }
}

/// <summary>
/// Replaces an image's content while keeping its identity (order and primary flag). Used when the
/// same slot should get a better photograph.
/// </summary>
public class ReplaceProductImageEndpoint(IMediator mediator)
    : Endpoint<ReplaceProductImageRequest, ProductImageDto>
{
    public override void Configure()
    {
        Put("/api/products/{id}/images/{imageId}");
        AllowFileUploads();
        Roles(AppRoles.Admin);
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(ReplaceProductImageRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");
        var imageId = Route<int>("imageId");

        if (req.File is null || req.File.Length == 0)
        {
            AddError(r => r.File, "A file is required.");
            ThrowIfAnyErrors();
            return;
        }

        await using var stream = req.File.OpenReadStream();
        var result = await mediator.Send(new ReplaceProductImageCommand(id, imageId, stream, req.File.FileName), ct);

        switch (result.Error)
        {
            case ProductImageError.ImageNotFound:
                await Send.NotFoundAsync(ct);
                return;
            case ProductImageError.FileTooLarge:
                AddError(r => r.File, "The file exceeds the maximum allowed size.");
                ThrowIfAnyErrors(StatusCodes.Status413PayloadTooLarge);
                return;
            case ProductImageError.InvalidFile:
                AddError(r => r.File, "Only JPEG, PNG, or WebP images are accepted.");
                ThrowIfAnyErrors();
                return;
        }

        Response = result.Image!;
        await Send.OkAsync(Response, ct);
    }
}
