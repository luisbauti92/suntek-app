using Suntek.Domain.Enums;

namespace Suntek.Domain.Entities;

public class Product
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
    /// <summary>Fabricante o proveedor. Dato de compra: no se publica en el catálogo.</summary>
    public string? Manufacturer { get; set; }
    /// <summary>
    /// Precio referencial del fabricante en dólares: así se le paga al proveedor.
    /// Es dato de costo, no de venta, y por eso no se mezcla nunca con los precios en Bs.
    /// </summary>
    public decimal? ManufacturerPriceUsd { get; set; }
    public int WholesaleQuantity { get; set; }
    public decimal RetailQuantity { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
