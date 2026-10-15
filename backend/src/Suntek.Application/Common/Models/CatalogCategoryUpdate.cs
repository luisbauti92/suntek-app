using Suntek.Domain.Enums;

namespace Suntek.Application.Common.Models;

/// <summary>
/// Distingue "no se tocó la categoría" (<c>null</c>) de "ponerla en automática" (instancia con
/// <see cref="Value"/> nulo). Es el mismo patrón que <see cref="ManufacturerInfo"/> para el
/// fabricante: un pedido que omite el campo no debe borrar una categoría ya asignada.
/// </summary>
public record CatalogCategoryUpdate(CatalogCategory? Value);
