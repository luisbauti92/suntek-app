namespace Suntek.Domain.Enums;

/// <summary>
/// The unit a sale line was actually sold in, as chosen by the operator.
///
/// Only sales recorded after this was introduced carry it; older rows are null because the
/// sale stored the deducted quantity without recording what it was measured in. The names
/// match <c>InventoryMovement.QuantityUnit</c> on purpose, except that a movement never says
/// "Rolls" (a retail roll sale deducts meters).
/// </summary>
public enum SoldUnit
{
    Meters = 0,
    Rolls = 1,
    Boxes = 2,
    Units = 3
}
