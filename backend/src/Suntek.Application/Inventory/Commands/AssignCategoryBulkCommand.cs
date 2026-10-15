using MediatR;
using Suntek.Domain.Enums;

namespace Suntek.Application.Inventory.Commands;

/// <summary>
/// Asigna (o limpia) la categoría de catálogo de un conjunto de productos en una sola
/// operación. A diferencia de <see cref="UpdateProductCommand"/>, acá la categoría es
/// siempre explícita: <c>null</c> significa "volver a automática", no "no tocar".
/// </summary>
public record AssignCategoryBulkCommand(
    IReadOnlyList<int> ProductIds,
    CatalogCategory? Category) : IRequest<AssignCategoryBulkResult>;
