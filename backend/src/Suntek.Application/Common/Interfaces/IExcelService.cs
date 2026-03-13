using Suntek.Application.Common.Models;

namespace Suntek.Application.Common.Interfaces;

public interface IExcelService
{
    byte[] GenerateSalesReport(IEnumerable<SaleReportDto> data);
}
