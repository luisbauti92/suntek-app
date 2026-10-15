using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Images;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Catalog;

public class UploadProductImageRequest
{
    public IFormFile? File { get; set; }
}

/// <summary>
/// Controlled server-side upload: the browser sends the file to the API, which validates the bytes
/// and stores it in R2. R2 credentials are never exposed to the client.
/// </summary>
public class UploadProductImageEndpoint(IMediator mediator) : Endpoint<UploadProductImageRequest, ProductImageDto>
{
    public override void Configure()
    {
        Post("/api/products/{id}/images");
        AllowFileUploads();
        Roles(AppRoles.Admin);
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(UploadProductImageRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");

        if (req.File is null || req.File.Length == 0)
        {
            AddError(r => r.File, "A file is required.");
            ThrowIfAnyErrors();
            return;
        }

        await using var stream = req.File.OpenReadStream();
        var result = await mediator.Send(new UploadProductImageCommand(id, stream, req.File.FileName), ct);

        switch (result.Error)
        {
            case ProductImageError.ProductNotFound:
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
