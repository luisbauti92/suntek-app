using Suntek.Application.Sales.Commands;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Sales;

[Collection(IntegrationCollection.Name)]
public class SalePricingTests(SuntekTestHost host)
{
    /// <summary>
    /// El total nace de la cantidad INGRESADA × precio de la unidad, no de la cantidad
    /// deducida. Esa era la falla: en una venta por rollo la cantidad deducida va en metros
    /// pero el precio es por rollo, así que multiplicarlos daba el total multiplicado por
    /// el Length del producto (10× de menos con Length 0.1, 30× de más con Length 30).
    /// </summary>
    [Theory]
    [InlineData(SoldUnit.Meters, 30, 1, 18, 4, 4, 72)]
    [InlineData(SoldUnit.Rolls, 0.1, 20, 60, 1, 0.1, 60)]     // regresión real: registraba 6
    [InlineData(SoldUnit.Rolls, 30, 4, 1200, 2, 60, 2400)]    // dirección peligrosa: habría registrado 72000
    [InlineData(SoldUnit.Boxes, 30, 4, 4800, 2, 2, 9600)]     // por mayor
    [InlineData(SoldUnit.Units, 0, 1, 65, 3, 3, 195)]         // accesorio
    public async Task El_total_nace_de_la_cantidad_ingresada(
        SoldUnit unit,
        double length,
        int rollsPerBox,
        double price,
        double entered,
        double deducted,
        double expectedTotal)
    {
        var product = await SaleScenario.SeedProductAsync(
            host.Services,
            unit == SoldUnit.Meters ? UnitType.Meters : UnitType.Units,
            (decimal)length,
            rollsPerBox,
            (decimal)price,
            (decimal)price);

        var saleType = unit == SoldUnit.Boxes ? SaleType.Wholesale : SaleType.Retail;

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(product.Id, (decimal)deducted, saleType, (decimal)price, unit, (decimal)entered));

        Assert.True(result.Success, result.ErrorMessage);
        Assert.Equal((decimal)expectedTotal, result.TotalAmount);

        var sale = await SaleScenario.LastSaleAsync(host.Services, product.Id);
        Assert.Equal((decimal)expectedTotal, sale.TotalPrice);
        Assert.Equal((decimal)deducted, sale.Quantity);
        Assert.Equal((decimal)entered, sale.EnteredQuantity);
        Assert.Equal(unit.ToString(), sale.Unit);
    }

    /// <summary>
    /// Una PWA cacheada no manda unidad ni cantidad ingresada. Debe seguir funcionando con
    /// el comportamiento previo (Quantity × precio), sin romperse ni cambiar de resultado.
    /// </summary>
    [Fact]
    public async Task Un_cliente_sin_los_campos_nuevos_mantiene_el_comportamiento_previo()
    {
        var product = await SaleScenario.SeedProductAsync(host.Services, UnitType.Units, 0.1m, 20, 60m, 5m);

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(product.Id, 0.1m, SaleType.Retail, 60m));

        Assert.True(result.Success, result.ErrorMessage);
        Assert.Equal(6m, result.TotalAmount);

        var sale = await SaleScenario.LastSaleAsync(host.Services, product.Id);
        Assert.Null(sale.Unit);
        Assert.Null(sale.EnteredQuantity);
    }

    /// <summary>
    /// La invariante que cubre la clase entera de bug, no el caso puntual: el total de cada
    /// línea es igual a lo cobrado por esa línea, así que el ticket nunca queda descuadrado.
    /// </summary>
    [Fact]
    public async Task El_total_del_ticket_es_la_suma_de_lo_cobrado_por_linea()
    {
        var roll = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 4, 1200m, 44m);
        var meter = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);

        var result = await SaleScenario.RecordAsync(
            host.Services,
            new BatchSaleItemDto(roll.Id, 60m, SaleType.Retail, 1200m, SoldUnit.Rolls, 2m),
            new BatchSaleItemDto(meter.Id, 3m, SaleType.Retail, 18m, SoldUnit.Meters, 3m));

        Assert.True(result.Success, result.ErrorMessage);

        var lines = await SaleScenario.TicketLinesAsync(host.Services, result.TicketCode!);
        var registrado = lines.Sum(l => l.TotalPrice);
        var cobrado = lines.Sum(l => (l.EnteredQuantity ?? l.Quantity) * l.UnitPrice);

        Assert.Equal(2, lines.Count);
        Assert.Equal(cobrado, registrado);
        Assert.Equal(2454m, registrado);   // (2 × 1200) + (3 × 18)
    }
}
