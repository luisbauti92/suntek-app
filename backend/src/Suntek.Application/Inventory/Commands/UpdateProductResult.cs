using Suntek.Application.Common.Models;

namespace Suntek.Application.Inventory.Commands;

public enum UpdateProductError
{
    NotFound,
    DuplicateSku,
    InvalidInput,
    InvalidPrice,
}

public record UpdateProductResult(ProductDto? Product, UpdateProductError? Error);
