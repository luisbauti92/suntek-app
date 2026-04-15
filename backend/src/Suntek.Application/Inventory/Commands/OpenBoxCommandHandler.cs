using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class OpenBoxCommandHandler(
    IProductRepository productRepository,
    IInventoryMovementRepository movementRepository) : IRequestHandler<OpenBoxCommand, ProductDto?>
{
    public async Task<ProductDto?> Handle(OpenBoxCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, ct);
        if (product == null || product.WholesaleQuantity < 1)
            return null;

        product.WholesaleQuantity -= 1;
        product.Quantity = product.WholesaleQuantity;

        if (product.UnitType == UnitType.Meters)
            product.RetailQuantity += product.Length * product.RollsPerBox;
        else
            product.RetailQuantity += product.RollsPerBox;

        product.UpdatedAt = DateTime.UtcNow;
        await productRepository.UpdateAsync(product, ct);

        var movement = new InventoryMovement
        {
            MovementType = MovementType.OpenBox,
            ProductId = product.Id,
            Quantity = 1,
            QuantityUnit = "Boxes",
            Description = "Opened 1 box; stock moved to retail.",
            WholesaleQuantityAfter = product.WholesaleQuantity,
            RetailQuantityAfter = product.RetailQuantity,
            CreatedAt = DateTime.UtcNow
        };
        await movementRepository.AddAsync(movement, ct);

        return new ProductDto(product.Id, product.Sku, product.Name, product.Quantity,
            product.Length, product.Width, product.PricePerRoll, product.PricePerMeter,
            product.RollsPerBox, product.UnitType, product.WholesaleQuantity, product.RetailQuantity, product.Status, product.CreatedAt);
    }
}
