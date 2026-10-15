using FastEndpoints;
using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Application.Inventory.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Inventory;

public class UpdateInventoryRequest
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public int RollsPerBox { get; set; }
    public decimal PricePerRoll { get; set; }
    public decimal PricePerMeter { get; set; }
    /// <summary>
    /// Categoría comercial para el catálogo. Omitirlo (o null) deja la categoría como estaba;
    /// una instancia con <see cref="CatalogCategoryUpdate.Value"/> nulo la pone en automática.
    /// </summary>
    public CatalogCategoryUpdate? Category { get; set; }
    /// <summary>Fabricante o proveedor. Omitirlo deja el dato como estaba.</summary>
    public string? Manufacturer { get; set; }
    /// <summary>Precio referencial del fabricante en dólares. Sólo un Admin puede leerlo o escribirlo.</summary>
    public decimal? ManufacturerPriceUsd { get; set; }
}

public class UpdateInventoryResponse
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal PricePerRoll { get; set; }
    public decimal PricePerMeter { get; set; }
    public int RollsPerBox { get; set; }
    public UnitType UnitType { get; set; }
    public CatalogCategory? Category { get; set; }
    public string? Manufacturer { get; set; }
    public decimal? ManufacturerPriceUsd { get; set; }
    public int WholesaleQuantity { get; set; }
    public decimal RetailQuantity { get; set; }
    public ProductStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateInventoryEndpoint(IMediator mediator) : Endpoint<UpdateInventoryRequest, UpdateInventoryResponse>
{
    public override void Configure()
    {
        Put("/api/inventory/{id}");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(UpdateInventoryRequest req, CancellationToken ct)
    {
        var id = Route<int>("id");

        // Sólo un Admin puede cambiar la categoría explícita. La sola presencia del objeto cuenta
        // como intento: una instancia con `value` nulo es "volver a automática", y también es un
        // cambio. Un operador conserva el resto de los campos, pero no este.
        if (req.Category is not null && !User.IsInRole(AppRoles.Admin))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        var result = await mediator.Send(
            new UpdateProductCommand(id, req.Sku, req.Name, req.Length, req.Width, req.RollsPerBox, req.PricePerRoll, req.PricePerMeter,
                req.Category,
                ProductCost.ManufacturerFrom(User, req.Manufacturer, req.ManufacturerPriceUsd)),
            ct);

        if (result.Error == UpdateProductError.NotFound)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        if (result.Error == UpdateProductError.DuplicateSku)
            ThrowError("Another product already uses this SKU.", statusCode: StatusCodes.Status409Conflict);

        if (result.Error == UpdateProductError.InvalidInput || result.Error == UpdateProductError.InvalidPrice)
            ThrowError(
                "SKU, name, and prices must be valid (prices cannot be negative).",
                statusCode: StatusCodes.Status400BadRequest);

        var p = result.Product!;
        Response = new UpdateInventoryResponse
        {
            Id = p.Id,
            Sku = p.Sku,
            Name = p.Name,
            Quantity = p.Quantity,
            Length = p.Length,
            Width = p.Width,
            PricePerRoll = p.PricePerRoll,
            PricePerMeter = p.PricePerMeter,
            RollsPerBox = p.RollsPerBox,
            UnitType = p.UnitType,
            Category = p.Category,
            Manufacturer = p.Manufacturer,
            ManufacturerPriceUsd = ProductCost.VisiblePrice(User, p.ManufacturerPriceUsd),
            WholesaleQuantity = p.WholesaleQuantity,
            RetailQuantity = p.RetailQuantity,
            Status = p.Status,
            CreatedAt = p.CreatedAt,
        };
        await Send.OkAsync(Response, ct);
    }
}
