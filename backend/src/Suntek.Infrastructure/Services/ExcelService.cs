using ClosedXML.Excel;
using Suntek.Application.Common.Interfaces;
using Suntek.Application.Common.Models;

namespace Suntek.Infrastructure.Services;

public class ExcelService : IExcelService
{
    /// <summary>
    /// Unit labels keyed by the token stored on <c>InventoryMovement.QuantityUnit</c>.
    /// An unknown token falls back to the stored value so a report never loses information.
    /// </summary>
    private static readonly Dictionary<string, (string Es, string En)> UnitLabels = new()
    {
        ["Boxes"] = ("Cajas", "Boxes"),
        ["Meters"] = ("Metros", "Meters"),
        ["Units"] = ("Unidades", "Units"),
    };

    public byte[] GenerateSalesReport(IEnumerable<SaleReportDto> data, string language)
    {
        var list = data.ToList();
        var isEnglish = language.StartsWith("en", StringComparison.OrdinalIgnoreCase);
        string L(string es, string en) => isEnglish ? en : es;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add(L("Reporte de ventas", "Sales Report"));

        // Headers
        ws.Cell(1, 1).Value = L("Fecha", "Date");
        ws.Cell(1, 2).Value = "SKU";
        ws.Cell(1, 3).Value = L("Producto", "Product");
        ws.Cell(1, 4).Value = L("Cantidad", "Qty");
        ws.Cell(1, 5).Value = L("Unidad", "Unit");
        ws.Cell(1, 6).Value = L("Precio Bs", "Price Bs");
        ws.Cell(1, 7).Value = L("Total Bs", "Total Bs");
        ws.Row(1).Style.Font.Bold = true;

        var row = 2;
        decimal totalSales = 0m;

        foreach (var dto in list)
        {
            ws.Cell(row, 1).Value = dto.DateUtc;
            ws.Cell(row, 1).Style.DateFormat.Format = "dd/MM/yyyy";

            ws.Cell(row, 2).Value = dto.Sku;
            ws.Cell(row, 3).Value = dto.ProductName;
            ws.Cell(row, 4).Value = dto.Quantity;
            ws.Cell(row, 5).Value = UnitLabels.TryGetValue(dto.Unit, out var unit)
                ? L(unit.Es, unit.En)
                : dto.Unit;
            ws.Cell(row, 6).Value = dto.UnitPriceBs;
            ws.Cell(row, 7).Value = dto.TotalBs;

            totalSales += dto.TotalBs;
            row++;
        }

        // Summary row
        ws.Cell(row + 1, 6).Value = "TOTAL (Bs)";
        ws.Cell(row + 1, 6).Style.Font.Bold = true;
        ws.Cell(row + 1, 7).Value = totalSales;
        ws.Cell(row + 1, 7).Style.Font.Bold = true;

        ws.Column(6).Style.NumberFormat.Format = "\"Bs\" 0.00";
        ws.Column(7).Style.NumberFormat.Format = "\"Bs\" 0.00";

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
