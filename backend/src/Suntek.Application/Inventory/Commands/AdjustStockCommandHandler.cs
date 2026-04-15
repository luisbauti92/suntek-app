using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class AdjustStockCommandHandler(
    IProductRepository productRepository,
    IInventoryMovementRepository movementRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<AdjustStockCommand, ProductDto?>
{
    public async Task<ProductDto?> Handle(AdjustStockCommand request, CancellationToken ct)
    {
        if (request.Quantity <= 0)
            return null;

        var product = await productRepository.GetByIdAsync(request.ProductId, ct);
        if (product == null)
            return null;

        ProductDto? resultDto = null;

        await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            product.WholesaleQuantity += request.Quantity;
            product.Quantity = product.WholesaleQuantity;
            product.UpdatedAt = DateTime.UtcNow;
            await productRepository.UpdateAsync(product, token);

            var description = string.IsNullOrWhiteSpace(request.Reason)
                ? $"Manual restock: +{request.Quantity} box(es)."
                : request.Reason!;

            var movement = new InventoryMovement
            {
                MovementType = MovementType.Adjustment,
                ProductId = product.Id,
                Quantity = request.Quantity,
                QuantityUnit = "Boxes",
                Description = description,
                WholesaleQuantityAfter = product.WholesaleQuantity,
                RetailQuantityAfter = product.RetailQuantity,
                CreatedAt = DateTime.UtcNow
            };
            await movementRepository.AddAsync(movement, token);

            resultDto = new ProductDto(product.Id, product.Sku, product.Name, product.Quantity,
                product.Length, product.Width, product.PricePerRoll, product.PricePerMeter,
                product.RollsPerBox, product.UnitType, product.WholesaleQuantity, product.RetailQuantity,
                product.Status, product.CreatedAt);
        }, ct);

        return resultDto;
    }
}

