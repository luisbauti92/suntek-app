using MediatR;

namespace Suntek.Application.Catalog.Images;

/// <summary>
/// Full, explicit ordering: the payload must list every image of the product exactly once, so a
/// stale client cannot silently reorder a gallery it did not fully read.
/// </summary>
public record ReorderProductImagesCommand(int ProductId, IReadOnlyList<int> OrderedIds)
    : IRequest<ProductImageOperationResult>;
