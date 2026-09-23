using ClosedXML.Excel;
using Microsoft.Extensions.DependencyInjection;
using Suntek.Application.Common.Interfaces;
using Suntek.Application.Common.Models;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Report;

/// <summary>
/// Cubre el reporte exportable, que hasta ahora tenía cero tests: es formato de salida
/// (encabezados, idioma, unidades y total) y ahí un cambio de label o de columna se
/// rompe sin que nada avise.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class SalesReportTests(SuntekTestHost host)
{
    private static readonly SaleReportDto RollLine = new(
        new DateTime(2026, 9, 21, 20, 50, 21, DateTimeKind.Utc),
        "M3-cinta", "Adhesivo rojo claro", 1m, "Rolls", 60m, 60m);

    private static readonly SaleReportDto MeterLine = new(
        new DateTime(2026, 9, 21, 21, 30, 34, DateTimeKind.Utc),
        "3008m", "Esmerilado Frosted", 15m, "Meters", 1200m, 18000m);

    [Theory]
    [InlineData("es", "Reporte de ventas", "Fecha", "Producto", "Cantidad", "Unidad", "Precio Bs", "Rollos")]
    [InlineData("en", "Sales Report", "Date", "Product", "Qty", "Unit", "Price Bs", "Rolls")]
    public void El_reporte_respeta_el_idioma_pedido(
        string language,
        string sheetName,
        string colFecha,
        string colProducto,
        string colCantidad,
        string colUnidad,
        string colPrecio,
        string unidadRollos)
    {
        using var workbook = Generate(language, RollLine);
        var sheet = workbook.Worksheet(1);

        Assert.Equal(sheetName, sheet.Name);
        Assert.Equal(colFecha, sheet.Cell(1, 1).GetString());
        Assert.Equal("SKU", sheet.Cell(1, 2).GetString());   // SKU no se traduce
        Assert.Equal(colProducto, sheet.Cell(1, 3).GetString());
        Assert.Equal(colCantidad, sheet.Cell(1, 4).GetString());
        Assert.Equal(colUnidad, sheet.Cell(1, 5).GetString());
        Assert.Equal(colPrecio, sheet.Cell(1, 6).GetString());

        // La unidad sale del token guardado en la venta, que sí distingue rollos de metros.
        Assert.Equal(unidadRollos, sheet.Cell(2, 5).GetString());
        Assert.Equal(1m, sheet.Cell(2, 4).GetValue<decimal>());
    }

    /// <summary>
    /// Un idioma que no reconocemos (o vacío) cae a español, un token de unidad desconocido
    /// no se pierde, y la fila de total suma lo registrado.
    /// </summary>
    [Fact]
    public void El_reporte_es_tolerante_y_el_total_suma_lo_registrado()
    {
        var desconocido = new SaleReportDto(DateTime.UtcNow, "X-1", "Producto raro", 1m, "Algo", 5m, 5m);

        using var workbook = Generate(string.Empty, RollLine, MeterLine, desconocido);
        var sheet = workbook.Worksheet(1);

        Assert.Equal("Reporte de ventas", sheet.Name);
        Assert.Equal("Rollos", sheet.Cell(2, 5).GetString());
        Assert.Equal("Metros", sheet.Cell(3, 5).GetString());
        Assert.Equal("Algo", sheet.Cell(4, 5).GetString());

        Assert.Equal("TOTAL (Bs)", sheet.Cell(6, 6).GetString());
        Assert.Equal(18065m, sheet.Cell(6, 7).GetValue<decimal>());   // 60 + 18000 + 5
    }

    private XLWorkbook Generate(string language, params SaleReportDto[] lines)
    {
        using var scope = host.Services.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<IExcelService>();

        return new XLWorkbook(new MemoryStream(service.GenerateSalesReport(lines, language)));
    }
}
