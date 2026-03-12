using Suntek.Domain.Enums;

namespace Suntek.Domain.Entities;

public class Sale
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public SaleType SaleType { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; }

    public Product Product { get; set; } = null!;
}
