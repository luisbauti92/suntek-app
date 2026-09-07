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

    public string? ClientName { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal? CashAmount { get; set; }
    public decimal? QrAmount { get; set; }
    public string? TicketCode { get; set; }

    public Product Product { get; set; } = null!;
}
