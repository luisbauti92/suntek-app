using MediatR;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class DeleteProductCommandHandler(IProductRepository productRepository) : IRequestHandler<DeleteProductCommand, bool>
{
    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdIncludingArchivedAsync(request.Id, ct);
        if (product == null)
            return false;

        product.Status = ProductStatus.Archived;
        product.UpdatedAt = DateTime.UtcNow;
        await productRepository.UpdateAsync(product, ct);
        return true;
    }
}
