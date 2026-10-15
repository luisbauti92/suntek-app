namespace Suntek.Domain.Enums;

/// <summary>
/// Clasificación comercial de un producto para el catálogo público. Es independiente de
/// <see cref="UnitType"/>, que sigue controlando unidades, dimensiones y precios.
/// </summary>
public enum CatalogCategory
{
    Films = 0,
    Tools = 1,
    Accessories = 2,
    Materials = 3
}
