using MediatR;
using Suntek.Application.Common.Models;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class UpdateProductCommandHandler(IProductRepository productRepository)
    : IRequestHandler<UpdateProductCommand, UpdateProductResult>
{
    private static decimal Round2(decimal v) => decimal.Round(v, 2, MidpointRounding.AwayFromZero);

    public async Task<UpdateProductResult> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.Id, ct);
        if (product is null)
            return new UpdateProductResult(null, UpdateProductError.NotFound);

        var sku = request.Sku.Trim();
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(name))
            return new UpdateProductResult(null, UpdateProductError.InvalidInput);

        var priceRoll = Round2(request.PricePerRoll);
        var priceMeter = Round2(request.PricePerMeter);
        if (priceRoll < 0 || priceMeter < 0)
            return new UpdateProductResult(null, UpdateProductError.InvalidPrice);

        if (await productRepository.IsSkuTakenByOtherAsync(sku, request.Id, ct))
            return new UpdateProductResult(null, UpdateProductError.DuplicateSku);

        product.Sku = sku;
        product.Name = name;
        product.PricePerRoll = priceRoll;
        product.PricePerMeter = priceMeter;
        product.UpdatedAt = DateTime.UtcNow;

        await productRepository.UpdateAsync(product, ct);

        var dto = new ProductDto(
            product.Id,
            product.Sku,
            product.Name,
            product.Quantity,
            product.Length,
            product.Width,
            product.PricePerRoll,
            product.PricePerMeter,
            product.RollsPerBox,
            product.UnitType,
            product.WholesaleQuantity,
            product.RetailQuantity,
            product.CreatedAt);

        return new UpdateProductResult(dto, null);
    }
}
