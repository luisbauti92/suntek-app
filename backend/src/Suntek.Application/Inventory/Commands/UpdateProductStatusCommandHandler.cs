using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class UpdateProductStatusCommandHandler(IProductRepository productRepository)
    : IRequestHandler<UpdateProductStatusCommand, bool>
{
    public async Task<bool> Handle(UpdateProductStatusCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdIncludingArchivedAsync(request.Id, ct);
        if (product is null)
            return false;

        product.Status = request.Status;
        product.UpdatedAt = DateTime.UtcNow;
        await productRepository.UpdateAsync(product, ct);
        return true;
    }
}
