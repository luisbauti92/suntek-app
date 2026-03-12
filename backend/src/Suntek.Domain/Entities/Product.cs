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
    public int WholesaleQuantity { get; set; }
    public decimal RetailQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
