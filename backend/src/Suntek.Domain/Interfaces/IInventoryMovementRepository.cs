using Suntek.Domain.Entities;

namespace Suntek.Domain.Interfaces;

public interface IInventoryMovementRepository
{
    Task<InventoryMovement> AddAsync(InventoryMovement movement, CancellationToken ct = default);
    Task<IReadOnlyList<InventoryMovement>> GetByDateRangeOrderedByDateDescAsync(
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        CancellationToken ct = default);
    Task<IReadOnlyList<InventoryMovement>> GetSalesMovementsByDateRangeAsync(
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken ct = default);
}
