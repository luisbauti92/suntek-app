using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using System.Text.Json;
using Suntek.Application.Sales.Commands;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Persistence;
using Xunit;

namespace Suntek.IntegrationTests.Infrastructure;

/// <summary>
/// Helpers para armar escenarios de venta contra la base real. Cada producto sembrado
/// usa un SKU único, así los tests comparten el contenedor sin pisarse.
/// </summary>
internal static class SaleScenario
{
    public static async Task<Product> SeedProductAsync(
        IServiceProvider services,
        UnitType unitType,
        decimal length,
        int rollsPerBox,
        decimal pricePerRoll,
        decimal pricePerMeter = 0m,
        int wholesaleQuantity = 100,
        decimal retailQuantity = 1000m)
    {
        await using var scope = services.CreateAsyncScope();
        var products = scope.ServiceProvider.GetRequiredService<IProductRepository>();

        var product = new Product
        {
            Sku = $"T{Guid.NewGuid():N}"[..16],
            Name = "Producto de prueba",
            Quantity = wholesaleQuantity,
            Length = length,
            Width = 1.52m,
            PricePerRoll = pricePerRoll,
            PricePerMeter = pricePerMeter,
            RollsPerBox = rollsPerBox,
            UnitType = unitType,
            WholesaleQuantity = wholesaleQuantity,
            RetailQuantity = retailQuantity,
            Status = ProductStatus.Active,
            CreatedAt = DateTime.UtcNow,
        };

        return await products.AddAsync(product);
    }

    public static async Task<RecordBatchSaleResult> RecordAsync(
        IServiceProvider services,
        params BatchSaleItemDto[] items)
    {
        await using var scope = services.CreateAsyncScope();
        var handler = scope.ServiceProvider
            .GetRequiredService<IRequestHandler<RecordBatchSaleCommand, RecordBatchSaleResult>>();

        return await handler.Handle(new RecordBatchSaleCommand([.. items]), CancellationToken.None);
    }

    public static async Task<T> ReadAsync<T>(
        IServiceProvider services,
        Func<AppDbContext, Task<T>> read)
    {
        await using var scope = services.CreateAsyncScope();
        return await read(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    /// <summary>Token del admin sembrado por la API, para pegarle a los endpoints.</summary>
    public static async Task<string> LoginAsAdminAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "admin@suntek.com", password = "Admin@123" },
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.GetProperty("token").GetString()!;
    }

    public static Task<Sale> LastSaleAsync(IServiceProvider services, int productId) =>
        ReadAsync(services, db => db.Sales.Where(s => s.ProductId == productId).OrderByDescending(s => s.Id).FirstAsync());

    public static Task<Product> ReloadProductAsync(IServiceProvider services, int productId) =>
        ReadAsync(services, db => db.Products.FirstAsync(p => p.Id == productId));

    public static Task<int> CountSalesAsync(IServiceProvider services, int productId) =>
        ReadAsync(services, db => db.Sales.CountAsync(s => s.ProductId == productId));

    public static Task<List<InventoryMovement>> MovementsForSaleAsync(IServiceProvider services, int saleId) =>
        ReadAsync(services, db => db.InventoryMovements.Where(m => m.SaleId == saleId).ToListAsync());

    /// <summary>Lines of a ticket, used to assert the reconciliation invariant.</summary>
    public static Task<List<Sale>> TicketLinesAsync(IServiceProvider services, string ticketCode) =>
        ReadAsync(services, db => db.Sales.Where(s => s.TicketCode == ticketCode).ToListAsync());
}
