using Suntek.Application.Sales.Commands;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Sales;

[Collection(IntegrationCollection.Name)]
public class StockAndMovementTests(SuntekTestHost host)
{
    [Fact]
    public async Task Una_venta_retail_descuenta_vitrina_y_no_toca_almacen()
    {
        var product = await SaleScenario.SeedProductAsync(
            host.Services, UnitType.Meters, 30m, 1, 480m, 18m, retailQuantity: 50m);

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(product.Id, 12m, SaleType.Retail, 18m, SoldUnit.Meters, 12m));

        Assert.True(result.Success, result.ErrorMessage);

        var reloaded = await SaleScenario.ReloadProductAsync(host.Services, product.Id);
        Assert.Equal(38m, reloaded.RetailQuantity);
        Assert.Equal(100, reloaded.WholesaleQuantity);
    }

    [Fact]
    public async Task Una_venta_por_mayor_descuenta_almacen_y_sincroniza_Quantity()
    {
        var product = await SaleScenario.SeedProductAsync(
            host.Services, UnitType.Meters, 30m, 4, 4800m, 44m, wholesaleQuantity: 10);

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(product.Id, 3m, SaleType.Wholesale, 4800m, SoldUnit.Boxes, 3m));

        Assert.True(result.Success, result.ErrorMessage);

        var reloaded = await SaleScenario.ReloadProductAsync(host.Services, product.Id);
        Assert.Equal(7, reloaded.WholesaleQuantity);
        Assert.Equal(7, reloaded.Quantity);   // Quantity espeja el almacén tras una venta por mayor
    }

    [Fact]
    public async Task Stock_insuficiente_falla_y_no_deja_escrituras_parciales()
    {
        var product = await SaleScenario.SeedProductAsync(
            host.Services, UnitType.Meters, 30m, 1, 480m, 18m, retailQuantity: 5m);

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(product.Id, 99m, SaleType.Retail, 18m, SoldUnit.Meters, 99m));

        Assert.False(result.Success);
        Assert.Equal(0, await SaleScenario.CountSalesAsync(host.Services, product.Id));

        var reloaded = await SaleScenario.ReloadProductAsync(host.Services, product.Id);
        Assert.Equal(5m, reloaded.RetailQuantity);
    }

    [Fact]
    public async Task Cada_venta_deja_su_movimiento_vinculado_con_la_unidad_deducida()
    {
        var product = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 4, 1200m, 44m);

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(product.Id, 60m, SaleType.Retail, 1200m, SoldUnit.Rolls, 2m));

        Assert.True(result.Success, result.ErrorMessage);

        var sale = await SaleScenario.LastSaleAsync(host.Services, product.Id);
        var movement = Assert.Single(await SaleScenario.MovementsForSaleAsync(host.Services, sale.Id));

        Assert.Equal(MovementType.Sale, movement.MovementType);
        Assert.Equal(60m, movement.Quantity);
        Assert.Equal("Meters", movement.QuantityUnit);   // el movimiento describe la deducción, no la unidad vendida
    }
}
