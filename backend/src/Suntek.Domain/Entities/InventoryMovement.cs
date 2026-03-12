using Suntek.Domain.Enums;

namespace Suntek.Domain.Entities;

public class InventoryMovement
{
    public int Id { get; set; }
    public MovementType MovementType { get; set; }
    public int ProductId { get; set; }
    public int? SaleId { get; set; }
    public decimal Quantity { get; set; }
    public string QuantityUnit { get; set; } = string.Empty; // "Boxes", "Meters", "Units"
    public string Description { get; set; } = string.Empty;
    public int? WholesaleQuantityAfter { get; set; }
    public decimal? RetailQuantityAfter { get; set; }
    public DateTime CreatedAt { get; set; }

    public Product Product { get; set; } = null!;
    public Sale? Sale { get; set; }
}
