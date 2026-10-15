using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Inventory.Commands;

/// <summary>
/// Asigna la categoría a varios productos de una sola vez. Es todo-o-nada a propósito:
/// si algún id no existe (o está archivado, que el filtro global oculta), devuelve el error
/// y no modifica ninguno. Un endpoint masivo que "actualiza los que encuentra" esconde
/// selecciones viejas y deja al admin creyendo que asignó todo.
/// </summary>
public class AssignCategoryBulkCommandHandler(IProductRepository productRepository)
    : IRequestHandler<AssignCategoryBulkCommand, AssignCategoryBulkResult>
{
    public async Task<AssignCategoryBulkResult> Handle(AssignCategoryBulkCommand request, CancellationToken ct)
    {
        var ids = request.ProductIds.Distinct().ToArray();
        if (ids.Length == 0)
            return new AssignCategoryBulkResult(0, [], AssignCategoryBulkError.EmptySelection);

        var products = await productRepository.GetByIdsAsync(ids, ct);
        if (products.Count != ids.Length)
        {
            var found = products.Select(p => p.Id).ToHashSet();
            var missing = ids.Where(id => !found.Contains(id)).ToArray();
            return new AssignCategoryBulkResult(0, missing, AssignCategoryBulkError.ProductNotFound);
        }

        var now = DateTime.UtcNow;
        foreach (var product in products)
        {
            product.Category = request.Category;
            product.UpdatedAt = now;
        }

        await productRepository.UpdateRangeAsync(products, ct);

        return new AssignCategoryBulkResult(products.Count, [], null);
    }
}
