using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

public class DeleteProductCommandHandler(IProductRepository productRepository) : IRequestHandler<DeleteProductCommand, bool>
{
    public async Task<bool> Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.Id, ct);
        if (product == null)
            return false;

        await productRepository.DeleteAsync(product, ct);
        return true;
    }
}
