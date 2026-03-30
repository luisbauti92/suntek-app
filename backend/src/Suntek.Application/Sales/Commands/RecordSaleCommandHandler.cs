using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Sales.Commands;

public class RecordSaleCommandHandler(
    IProductRepository productRepository,
    ISaleRepository saleRepository,
    IInventoryMovementRepository movementRepository) : IRequestHandler<RecordSaleCommand, RecordSaleResult>
{
    private static decimal Round2(decimal v) => decimal.Round(v, 2, MidpointRounding.AwayFromZero);

    public async Task<RecordSaleResult> Handle(RecordSaleCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, ct);
        if (product == null)
            return new RecordSaleResult(false, "Product not found.", null);

        if (request.SaleType == SaleType.Wholesale)
        {
            var boxes = (int)request.Quantity;
            if (boxes <= 0 || product.WholesaleQuantity < boxes)
                return new RecordSaleResult(false, "Insufficient wholesale stock (boxes).", null);
            product.WholesaleQuantity -= boxes;
            product.Quantity = product.WholesaleQuantity;
        }
        else
        {
            if (request.Quantity <= 0 || product.RetailQuantity < request.Quantity)
                return new RecordSaleResult(false, "Insufficient retail stock (meters/units).", null);
            product.RetailQuantity -= request.Quantity;
        }

        product.UpdatedAt = DateTime.UtcNow;
        var unitPrice = Round2(request.UnitPrice);
        var totalPrice = Round2(request.Quantity * unitPrice);

        var sale = new Sale
        {
            ProductId = product.Id,
            Quantity = request.Quantity,
            SaleType = request.SaleType,
            UnitPrice = unitPrice,
            TotalPrice = totalPrice,
            CreatedAt = DateTime.UtcNow
        };
        var savedSale = await saleRepository.AddAsync(sale, ct);
        await productRepository.UpdateAsync(product, ct);

        var quantityUnit = request.SaleType == SaleType.Wholesale ? "Boxes" : (product.UnitType == UnitType.Meters ? "Meters" : "Units");
        var description = request.SaleType == SaleType.Wholesale
            ? $"Wholesale sale: {request.Quantity} box(es)"
            : $"Retail sale: {request.Quantity} {quantityUnit.ToLowerInvariant()}";
        var movement = new InventoryMovement
        {
            MovementType = MovementType.Sale,
            ProductId = product.Id,
            SaleId = savedSale.Id,
            Quantity = request.Quantity,
            QuantityUnit = quantityUnit,
            Description = description,
            WholesaleQuantityAfter = product.WholesaleQuantity,
            RetailQuantityAfter = product.RetailQuantity,
            CreatedAt = DateTime.UtcNow
        };
        await movementRepository.AddAsync(movement, ct);

        var dto = new ProductDto(product.Id, product.Sku, product.Name, product.Quantity,
            product.Length, product.Width, product.PricePerRoll, product.PricePerMeter,
            product.RollsPerBox, product.UnitType, product.WholesaleQuantity, product.RetailQuantity, product.CreatedAt);
        return new RecordSaleResult(true, null, dto);
    }
}
