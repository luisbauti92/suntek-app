using ClosedXML.Excel;
using Suntek.Application.Common.Interfaces;
using Suntek.Application.Common.Models;

namespace Suntek.Infrastructure.Services;

public class ExcelService : IExcelService
{
    public byte[] GenerateSalesReport(IEnumerable<SaleReportDto> data)
    {
        var list = data.ToList();
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Sales Report");

        // Headers
        ws.Cell(1, 1).Value = "Date";
        ws.Cell(1, 2).Value = "SKU";
        ws.Cell(1, 3).Value = "Product";
        ws.Cell(1, 4).Value = "Qty";
        ws.Cell(1, 5).Value = "Price Bs";
        ws.Cell(1, 6).Value = "Total Bs";
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
            ws.Cell(row, 5).Value = dto.UnitPriceBs;
            ws.Cell(row, 6).Value = dto.TotalBs;

            totalSales += dto.TotalBs;
            row++;
        }

        // Summary row
        ws.Cell(row + 1, 5).Value = "TOTAL (Bs)";
        ws.Cell(row + 1, 5).Style.Font.Bold = true;
        ws.Cell(row + 1, 6).Value = totalSales;
        ws.Cell(row + 1, 6).Style.Font.Bold = true;

        ws.Column(5).Style.NumberFormat.Format = "\"Bs\" 0.00";
        ws.Column(6).Style.NumberFormat.Format = "\"Bs\" 0.00";

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
