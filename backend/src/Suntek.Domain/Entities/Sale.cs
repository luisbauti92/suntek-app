using Suntek.Domain.Enums;

namespace Suntek.Domain.Entities;

public class Sale
{
    public int Id { get; set; }
    public int ProductId { get; set; }

    /// <summary>Stock actually deducted, in the product's own unit (meters for a retail roll sale).</summary>
    public decimal Quantity { get; set; }

    /// <summary>Quantity as the operator entered it. Null on rows recorded before this was stored.</summary>
    public decimal? EnteredQuantity { get; set; }

    /// <summary>Unit the operator sold in ("Meters", "Rolls", "Boxes", "Units"). Null on older rows.</summary>
    public string? Unit { get; set; }

    public SaleType SaleType { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; }

    public string? ClientName { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal? CashAmount { get; set; }
    public decimal? QrAmount { get; set; }
    public string? TicketCode { get; set; }

    public Product Product { get; set; } = null!;
}
