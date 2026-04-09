using FastEndpoints;
using MediatR;
using Suntek.Application.Catalog.Queries;

namespace Suntek.Api.Endpoints.Catalog;

/// <summary>
/// Catálogo público para catalog-web. Protegido opcionalmente con <c>X-Catalog-Key</c> (secreto compartido sitio↔API).
/// No usa JWT de usuarios; no aplica CSRF en GET sin cookies de sesión.
/// </summary>
public class ListPublicCatalogProductsEndpoint(
    IMediator mediator,
    IConfiguration configuration,
    IWebHostEnvironment environment) : EndpointWithoutRequest<List<PublicCatalogProductDto>>
{
    public override void Configure()
    {
        Get("/api/catalog/products");
        AllowAnonymous();
        Options(x => x.WithTags("Catalog"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (!await TryAuthorizeCatalogAccessAsync(ct))
            return;

        var items = await mediator.Send(new GetPublicCatalogProductsQuery(), ct);
        Response = items.ToList();
        await Send.OkAsync(Response, ct);
    }

    private async Task<bool> TryAuthorizeCatalogAccessAsync(CancellationToken ct)
    {
        var configuredKey = configuration["Catalog:ApiKey"];

        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            if (!environment.IsDevelopment())
            {
                AddError("Catalog API key is not configured.");
                await Send.ErrorsAsync(statusCode: 503, cancellation: ct);
                return false;
            }

            return true;
        }

        var provided = HttpContext.Request.Headers["X-Catalog-Key"].FirstOrDefault();
        if (!string.Equals(provided, configuredKey, StringComparison.Ordinal))
        {
            await Send.UnauthorizedAsync(ct);
            return false;
        }

        return true;
    }
}
