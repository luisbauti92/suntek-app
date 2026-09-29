namespace Suntek.Application.Common.Models;

/// <summary>
/// Fabricante del producto y su precio referencial en dólares (así se le paga al proveedor).
/// Es dato de costo, no de venta: nunca se suma con los precios en Bs.
///
/// En los comandos de escritura, <c>null</c> significa "este pedido no trae datos del
/// fabricante, no los toques". Un <see cref="ManufacturerInfo"/> con los dos campos en
/// <c>null</c> significa lo contrario: "bórralos".
/// </summary>
public record ManufacturerInfo(string? Name, decimal? PriceUsd);
