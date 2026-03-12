using Suntek.Domain.Entities;

namespace Suntek.Domain.Interfaces;

public interface IInventoryMovementRepository
{
    Task<InventoryMovement> AddAsync(InventoryMovement movement, CancellationToken ct = default);
    Task<IReadOnlyList<InventoryMovement>> GetAllOrderedByDateDescAsync(CancellationToken ct = default);
}
