using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Sales;

/// <summary>
/// Blinda el contrato serializado del arqueo, que es justo donde el POS se equivocó: la API
/// (por el <c>JsonStringEnumConverter</c> global) manda los enums por su nombre — "QrBcp",
/// "Retail" — no como número, y el POS comparaba contra 1 y 2. Como había un valor por
/// defecto, el error no se veía: mostraba "Efectivo" en todas las ventas.
///
/// El test afirma el <c>ValueKind</c>, no sólo el texto, para que cambiar el formato de
/// serialización rompa acá y no en la pantalla del que cobra.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class DailyClosureContractTests(SuntekTestHost host)
{
    [Fact]
    public async Task El_arqueo_entrega_los_enums_por_nombre_y_no_como_numero()
    {
        var wholesale = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 4, 4800m, 44m);
        var retail = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);

        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await SaleScenario.LoginAsAdminAsync(client));

        await PostSaleAsync(client, wholesale.Id, quantity: 2m, saleType: 0, unitPrice: 4800m, unit: "Boxes", entered: 2m, paymentMethod: 0);
        await PostSaleAsync(client, retail.Id, quantity: 4m, saleType: 1, unitPrice: 18m, unit: "Meters", entered: 4m, paymentMethod: 1);

        var lines = (await GetClosureAsync(client)).GetProperty("sales").EnumerateArray().ToList();

        var wholesaleLine = lines.Single(l => l.GetProperty("productSku").GetString() == wholesale.Sku);
        var retailLine = lines.Single(l => l.GetProperty("productSku").GetString() == retail.Sku);

        Assert.Equal(JsonValueKind.String, wholesaleLine.GetProperty("paymentMethod").ValueKind);
        Assert.Equal("Cash", wholesaleLine.GetProperty("paymentMethod").GetString());
        Assert.Equal("Wholesale", wholesaleLine.GetProperty("saleType").GetString());

        Assert.Equal("QrBcp", retailLine.GetProperty("paymentMethod").GetString());
        Assert.Equal("Retail", retailLine.GetProperty("saleType").GetString());
    }

    /// <summary>
    /// Los totales del arqueo tienen que cuadrar con las ventas que el mismo arqueo lista.
    /// Se verifica contra su propia lista, así no depende de qué otras ventas tenga el día.
    /// </summary>
    [Fact]
    public async Task Los_totales_del_arqueo_cuadran_con_las_ventas_que_lista()
    {
        var cash = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);
        var qr = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);
        var mixed = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);

        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await SaleScenario.LoginAsAdminAsync(client));

        await PostSaleAsync(client, cash.Id, 4m, saleType: 1, unitPrice: 18m, unit: "Meters", entered: 4m, paymentMethod: 0);
        await PostSaleAsync(client, qr.Id, 4m, saleType: 1, unitPrice: 18m, unit: "Meters", entered: 4m, paymentMethod: 1);
        await PostSaleAsync(client, mixed.Id, 4m, saleType: 1, unitPrice: 18m, unit: "Meters", entered: 4m, paymentMethod: 2, cashAmount: 30m, qrAmount: 42m);

        var body = await GetClosureAsync(client);

        decimal expectedCash = 0;
        decimal expectedQr = 0;

        foreach (var line in body.GetProperty("sales").EnumerateArray())
        {
            var method = line.GetProperty("paymentMethod").GetString();

            switch (method)
            {
                case "QrBcp":
                    expectedQr += line.GetProperty("totalPrice").GetDecimal();
                    break;
                case "Mixed":
                    expectedCash += Amount(line, "cashAmount");
                    expectedQr += Amount(line, "qrAmount");
                    break;
                default: // Cash
                    expectedCash += line.GetProperty("totalPrice").GetDecimal();
                    break;
            }
        }

        Assert.Equal(body.GetProperty("totalCashBs").GetDecimal(), expectedCash);
        Assert.Equal(body.GetProperty("totalQrBs").GetDecimal(), expectedQr);
    }

    private static decimal Amount(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.Number
            ? value.GetDecimal()
            : 0m;

    private static async Task PostSaleAsync(
        HttpClient client,
        int productId,
        decimal quantity,
        int saleType,
        decimal unitPrice,
        string unit,
        decimal entered,
        int paymentMethod,
        decimal? cashAmount = null,
        decimal? qrAmount = null)
    {
        var payload = new
        {
            items = new[]
            {
                new { productId, quantity, saleType, unitPrice, unit, enteredQuantity = entered },
            },
            paymentMethod,
            cashAmount,
            qrAmount,
        };

        var response = await client.PostAsJsonAsync("/api/sales/batch", payload, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private static async Task<JsonElement> GetClosureAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/sales/daily-closure", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
    }
}
