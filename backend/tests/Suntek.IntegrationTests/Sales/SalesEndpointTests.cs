using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Sales;

/// <summary>
/// Cubre el contrato HTTP: lo que el POS realmente manda por la red, incluyendo el
/// binding de los campos nuevos. Es el punto donde un rename o un cambio de casing
/// se rompe sin que ningún test de handler lo note.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class SalesEndpointTests(SuntekTestHost host)
{
    [Fact]
    public async Task La_venta_por_lote_rechaza_peticiones_sin_token()
    {
        var client = host.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/sales/batch", new { items = Array.Empty<object>() }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task La_venta_por_lote_acepta_la_unidad_y_la_cantidad_ingresada()
    {
        var product = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 4, 1200m, 44m);

        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client));

        // Payload crudo, con los nombres y tipos que usa el POS (saleType numérico, unit por nombre).
        var payload = new
        {
            items = new[]
            {
                new { productId = product.Id, quantity = 60m, saleType = 1, unitPrice = 1200m, unit = "Rolls", enteredQuantity = 2m },
            },
            paymentMethod = 1,
            qrAmount = 2400m,
        };

        var response = await client.PostAsJsonAsync("/api/sales/batch", payload, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.True(body.GetProperty("success").GetBoolean());
        Assert.Equal(2400m, body.GetProperty("totalAmount").GetDecimal());

        var sale = await SaleScenario.LastSaleAsync(host.Services, product.Id);
        Assert.Equal("Rolls", sale.Unit);
        Assert.Equal(2m, sale.EnteredQuantity);
        Assert.Equal(2400m, sale.TotalPrice);
    }

    private static async Task<string> LoginAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = "admin@suntek.com", password = "Admin@123" },
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.GetProperty("token").GetString()!;
    }
}
