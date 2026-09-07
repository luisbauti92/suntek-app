using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Sales.Commands;

public class RecordBatchSaleCommandHandler(
    IProductRepository productRepository,
    ISaleRepository saleRepository,
    IInventoryMovementRepository movementRepository) : IRequestHandler<RecordBatchSaleCommand, RecordBatchSaleResult>
{
    private static decimal Round2(decimal v) => decimal.Round(v, 2, MidpointRounding.AwayFromZero);

    public async Task<RecordBatchSaleResult> Handle(RecordBatchSaleCommand request, CancellationToken ct)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            return new RecordBatchSaleResult(false, "El ticket debe contener al menos un producto.", null, 0, null);
        }

        // 1. Pre-load and validate all products & stocks
        var productMap = new Dictionary<int, Product>();
        foreach (var item in request.Items)
        {
            if (item.Quantity <= 0)
            {
                return new RecordBatchSaleResult(false, $"La cantidad para el producto {item.ProductId} debe ser mayor a cero.", null, 0, null);
            }

            if (!productMap.ContainsKey(item.ProductId))
            {
                var p = await productRepository.GetByIdAsync(item.ProductId, ct);
                if (p == null)
                {
                    return new RecordBatchSaleResult(false, $"Producto con ID {item.ProductId} no fue encontrado.", null, 0, null);
                }
                productMap[item.ProductId] = p;
            }
        }

        // Verify stock sufficiency across all items
        var requiredWholesale = new Dictionary<int, int>();
        var requiredRetail = new Dictionary<int, decimal>();

        foreach (var item in request.Items)
        {
            if (item.SaleType == SaleType.Wholesale)
            {
                var boxes = (int)item.Quantity;
                requiredWholesale[item.ProductId] = requiredWholesale.GetValueOrDefault(item.ProductId) + boxes;
            }
            else
            {
                requiredRetail[item.ProductId] = requiredRetail.GetValueOrDefault(item.ProductId) + item.Quantity;
            }
        }

        foreach (var (productId, neededBoxes) in requiredWholesale)
        {
            var p = productMap[productId];
            if (p.WholesaleQuantity < neededBoxes)
            {
                return new RecordBatchSaleResult(false, $"Stock insuficiente en almacén para '{p.Name}'. Disponibles: {p.WholesaleQuantity} caja(s).", null, 0, null);
            }
        }

        foreach (var (productId, neededRetail) in requiredRetail)
        {
            var p = productMap[productId];
            if (p.RetailQuantity < neededRetail)
            {
                var unit = p.UnitType == UnitType.Meters ? "metros" : "unidades";
                return new RecordBatchSaleResult(false, $"Stock insuficiente en tienda para '{p.Name}'. Disponibles: {p.RetailQuantity:0.##} {unit}.", null, 0, null);
            }
        }

        // 2. Process sales and inventory deductions
        var ticketCode = $"TK-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var clientClean = string.IsNullOrWhiteSpace(request.ClientName) ? null : request.ClientName.Trim();
        var clientNote = clientClean != null ? $" (Cliente: {clientClean})" : "";
        var payNote = request.PaymentMethod switch
        {
            PaymentMethod.QrBcp => " [QR BCP]",
            PaymentMethod.Mixed => " [Mixto]",
            _ => " [Efectivo]"
        };

        decimal grandTotal = 0;
        var updatedProductDtos = new List<ProductDto>();

        foreach (var item in request.Items)
        {
            var product = productMap[item.ProductId];
            if (item.SaleType == SaleType.Wholesale)
            {
                var boxes = (int)item.Quantity;
                product.WholesaleQuantity -= boxes;
                product.Quantity = product.WholesaleQuantity;
            }
            else
            {
                product.RetailQuantity -= item.Quantity;
            }
            product.UpdatedAt = DateTime.UtcNow;

            var unitPrice = Round2(item.UnitPrice);
            var itemTotal = Round2(item.Quantity * unitPrice);
            grandTotal += itemTotal;

            var sale = new Sale
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                SaleType = item.SaleType,
                UnitPrice = unitPrice,
                TotalPrice = itemTotal,
                CreatedAt = DateTime.UtcNow,
                ClientName = clientClean,
                PaymentMethod = request.PaymentMethod,
                CashAmount = request.CashAmount,
                QrAmount = request.QrAmount,
                TicketCode = ticketCode
            };
            var savedSale = await saleRepository.AddAsync(sale, ct);
            await productRepository.UpdateAsync(product, ct);

            var quantityUnit = item.SaleType == SaleType.Wholesale
                ? "Boxes"
                : (product.UnitType == UnitType.Meters ? "Meters" : "Units");
            var description = item.SaleType == SaleType.Wholesale
                ? $"Ticket {ticketCode} - Venta por mayor: {item.Quantity} caja(s){clientNote}{payNote}"
                : $"Ticket {ticketCode} - Venta vitrina: {item.Quantity} {quantityUnit.ToLowerInvariant()}{clientNote}{payNote}";

            var movement = new InventoryMovement
            {
                MovementType = MovementType.Sale,
                ProductId = product.Id,
                SaleId = savedSale.Id,
                Quantity = item.Quantity,
                QuantityUnit = quantityUnit,
                Description = description,
                WholesaleQuantityAfter = product.WholesaleQuantity,
                RetailQuantityAfter = product.RetailQuantity,
                CreatedAt = DateTime.UtcNow
            };
            await movementRepository.AddAsync(movement, ct);
        }

        foreach (var p in productMap.Values)
        {
            updatedProductDtos.Add(new ProductDto(
                p.Id, p.Sku, p.Name, p.Quantity, p.Length, p.Width,
                p.PricePerRoll, p.PricePerMeter, p.RollsPerBox, p.UnitType,
                p.WholesaleQuantity, p.RetailQuantity, p.Status, p.CreatedAt));
        }

        return new RecordBatchSaleResult(true, null, ticketCode, Round2(grandTotal), updatedProductDtos);
    }
}
