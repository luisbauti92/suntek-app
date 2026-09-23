using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Suntek.Application.Sales.Commands;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Sales;

/// <summary>
/// Camino legacy de venta única (el que usa el modal del admin), que hasta ahora tenía
/// cero tests. Duplica la lógica de dinero del batch, así que es justo donde las dos
/// versiones se separan con el tiempo.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class RecordSaleCommandTests(SuntekTestHost host)
{
    [Fact]
    public async Task Una_venta_por_mayor_registra_cajas_y_descuenta_almacen()
    {
        var product = await SaleScenario.SeedProductAsync(
            host.Services, UnitType.Meters, 30m, 4, 4800m, 44m, wholesaleQuantity: 10);

        var result = await RecordAsync(new RecordSaleCommand(product.Id, 3m, SaleType.Wholesale, 4800m));

        Assert.True(result.Success, result.ErrorMessage);

        var sale = await SaleScenario.LastSaleAsync(host.Services, product.Id);
        Assert.Equal(14400m, sale.TotalPrice);            // 3 × 4800
        Assert.Equal(3m, sale.EnteredQuantity);
        Assert.Equal("Boxes", sale.Unit);                 // derivado, igual que su movimiento

        var reloaded = await SaleScenario.ReloadProductAsync(host.Services, product.Id);
        Assert.Equal(7, reloaded.WholesaleQuantity);
        Assert.Equal(7, reloaded.Quantity);
    }

    [Fact]
    public async Task Una_venta_retail_registra_metros_y_descuenta_vitrina()
    {
        var product = await SaleScenario.SeedProductAsync(
            host.Services, UnitType.Meters, 30m, 1, 480m, 18m, retailQuantity: 50m);

        var result = await RecordAsync(new RecordSaleCommand(product.Id, 12m, SaleType.Retail, 18m));

        Assert.True(result.Success, result.ErrorMessage);

        var sale = await SaleScenario.LastSaleAsync(host.Services, product.Id);
        Assert.Equal(216m, sale.TotalPrice);              // 12 × 18
        Assert.Equal(12m, sale.EnteredQuantity);
        Assert.Equal("Meters", sale.Unit);

        var reloaded = await SaleScenario.ReloadProductAsync(host.Services, product.Id);
        Assert.Equal(38m, reloaded.RetailQuantity);
    }

    private async Task<RecordSaleResult> RecordAsync(RecordSaleCommand command)
    {
        await using var scope = host.Services.CreateAsyncScope();
        var handler = scope.ServiceProvider
            .GetRequiredService<IRequestHandler<RecordSaleCommand, RecordSaleResult>>();

        return await handler.Handle(command, CancellationToken.None);
    }
}
