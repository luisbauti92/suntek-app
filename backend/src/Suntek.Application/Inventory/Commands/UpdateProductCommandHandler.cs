using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Entities;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class UpdateProductCommandHandler(IProductRepository productRepository) : IRequestHandler<UpdateProductCommand, ProductDto?>
{
    public async Task<ProductDto?> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.Id, ct);
        if (product == null)
            return null;

        product.Name = request.Name;
        product.Quantity = request.Quantity;
        product.UpdatedAt = DateTime.UtcNow;
        await productRepository.UpdateAsync(product, ct);
        return new ProductDto(product.Id, product.Sku, product.Name, product.Quantity,
            product.Length, product.Width, product.PricePerRoll, product.PricePerMeter,
            product.RollsPerBox, product.UnitType, product.WholesaleQuantity, product.RetailQuantity, product.CreatedAt);
    }
}
