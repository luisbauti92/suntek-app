using FastEndpoints;
using MediatR;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class AssignCategoryBulkRequest
{
    /// <summary>Productos seleccionados en el ERP.</summary>
    public List<int> ProductIds { get; set; } = [];
    /// <summary>Categoría destino. Nula = volver a automática (sin categoría explícita).</summary>
    public CatalogCategory? Category { get; set; }
}

public class AssignCategoryBulkResponse
{
    public int UpdatedCount { get; set; }
    public CatalogCategory? Category { get; set; }
}

/// <summary>
/// Asignación masiva de categoría desde el ERP. Es una operación de gestión, por eso queda
/// reservada a Admin (igual que el cambio de estado), a diferencia de la edición puntual de
/// <see cref="UpdateInventoryEndpoint"/>.
/// </summary>
public class AssignCategoryBulkEndpoint(IMediator mediator)
    : Endpoint<AssignCategoryBulkRequest, AssignCategoryBulkResponse>
{
    public override void Configure()
    {
        Patch("/api/products/bulk-category");
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(AssignCategoryBulkRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new AssignCategoryBulkCommand(req.ProductIds, req.Category), ct);

        if (result.Error == AssignCategoryBulkError.EmptySelection)
        {
            AddError(r => r.ProductIds, "Select at least one product.");
            ThrowIfAnyErrors();
            return;
        }

        if (result.Error == AssignCategoryBulkError.ProductNotFound)
        {
            AddError(r => r.ProductIds, $"Unknown or archived products: {string.Join(", ", result.MissingIds)}.");
            ThrowIfAnyErrors(StatusCodes.Status404NotFound);
            return;
        }

        Response = new AssignCategoryBulkResponse
        {
            UpdatedCount = result.UpdatedCount,
            Category = req.Category,
        };
        await Send.OkAsync(Response, ct);
    }
}
