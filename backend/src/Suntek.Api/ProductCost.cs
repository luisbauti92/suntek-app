using System.Security.Claims;
using Suntek.Application.Common.Models;
using Suntek.Domain.Enums;

namespace Suntek.Api;

/// <summary>
/// El precio referencial del fabricante es dato de costo: dice cuánto se le paga al proveedor
/// y, por lo tanto, cuál es el margen. Es dato de Admin, tanto para leer como para escribir.
///
/// Vive en un solo lugar a propósito: si algún día se decide abrirlo a los operadores, se toca
/// este archivo y nada más.
/// </summary>
internal static class ProductCost
{
    internal static bool CanEdit(ClaimsPrincipal user) => user.IsInRole(AppRoles.Admin);

    /// <summary>
    /// Para las respuestas: a quien no puede ver el costo se le devuelve <c>null</c>, así el
    /// número no viaja en el JSON que recibe el POS.
    /// </summary>
    internal static decimal? VisiblePrice(ClaimsPrincipal user, decimal? priceUsd) =>
        CanEdit(user) ? priceUsd : null;

    /// <summary>
    /// Para las escrituras: devuelve <c>null</c> cuando el usuario no puede tocar el dato, y
    /// entonces el comando lo deja como estaba en vez de borrarlo.
    /// </summary>
    internal static ManufacturerInfo? ManufacturerFrom(ClaimsPrincipal user, string? name, decimal? priceUsd) =>
        CanEdit(user) ? new ManufacturerInfo(name, priceUsd) : null;
}
