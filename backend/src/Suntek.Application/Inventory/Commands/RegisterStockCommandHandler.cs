using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class RegisterStockCommandHandler(
    IProductRepository productRepository,
    IInventoryMovementRepository movementRepository) : IRequestHandler<RegisterStockCommand, ProductDto>
{
    public async Task<ProductDto> Handle(RegisterStockCommand request, CancellationToken ct)
    {
        var existing = await productRepository.GetBySkuAsync(request.Sku, ct);
        if (existing != null)
        {
            existing.WholesaleQuantity += request.Quantity;
            existing.Quantity = existing.WholesaleQuantity;
            existing.UpdatedAt = DateTime.UtcNow;
            await productRepository.UpdateAsync(existing, ct);
            var movement = new InventoryMovement
            {
                MovementType = MovementType.Register,
                ProductId = existing.Id,
                Quantity = request.Quantity,
                QuantityUnit = "Boxes",
                Description = $"Registered {request.Quantity} box(es).",
                WholesaleQuantityAfter = existing.WholesaleQuantity,
                RetailQuantityAfter = existing.RetailQuantity,
                CreatedAt = DateTime.UtcNow
            };
            await movementRepository.AddAsync(movement, ct);
            return new ProductDto(existing.Id, existing.Sku, existing.Name, existing.Quantity,
                existing.Length, existing.Width, existing.PricePerRoll, existing.PricePerMeter,
                existing.RollsPerBox, existing.UnitType, existing.WholesaleQuantity, existing.RetailQuantity, existing.CreatedAt);
        }

        var product = new Product
        {
            Sku = request.Sku,
            Name = request.Name,
            Quantity = request.Quantity,
            Length = request.Length,
            Width = request.Width,
            PricePerRoll = request.PricePerRoll,
            PricePerMeter = request.PricePerMeter,
            RollsPerBox = request.RollsPerBox,
            UnitType = request.UnitType,
            WholesaleQuantity = request.Quantity,
            RetailQuantity = 0
        };
        var added = await productRepository.AddAsync(product, ct);
        var registerMovement = new InventoryMovement
        {
            MovementType = MovementType.Register,
            ProductId = added.Id,
            Quantity = request.Quantity,
            QuantityUnit = "Boxes",
            Description = $"Registered {request.Quantity} box(es) (new product).",
            WholesaleQuantityAfter = added.WholesaleQuantity,
            RetailQuantityAfter = added.RetailQuantity,
            CreatedAt = DateTime.UtcNow
        };
        await movementRepository.AddAsync(registerMovement, ct);
        return new ProductDto(added.Id, added.Sku, added.Name, added.Quantity,
            added.Length, added.Width, added.PricePerRoll, added.PricePerMeter,
            added.RollsPerBox, added.UnitType, added.WholesaleQuantity, added.RetailQuantity, added.CreatedAt);
    }
}
