using Suntek.Domain.Entities;

namespace Suntek.Domain.Interfaces;

public interface IInventoryMovementRepository
{
    Task<InventoryMovement> AddAsync(InventoryMovement movement, CancellationToken ct = default);
    Task<(IReadOnlyList<InventoryMovement> Items, int TotalCount, decimal TotalSalesBsInRange, int ResolvedPage)> GetMovementHistoryPageAsync(
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        int page,
        int pageSize,
        CancellationToken ct = default);
    Task<IReadOnlyList<InventoryMovement>> GetSalesMovementsByDateRangeAsync(
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken ct = default);
}
