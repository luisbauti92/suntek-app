using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Inventory;

/// <summary>
/// El precio referencial del fabricante es dato de costo: dice cuánto se le paga al proveedor
/// y, por lo tanto, cuál es el margen. Es dato de Admin, tanto para leer como para escribir.
///
/// El nombre del fabricante no se protege: no dice nada del margen y es contexto útil.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class ManufacturerTests(SuntekTestHost host)
{
    private const string Fabricante = "Zhejiang Films Co.";
    private const decimal PrecioUsd = 12.5m;

    [Fact]
    public async Task El_admin_guarda_el_fabricante_y_su_precio_en_dolares()
    {
        var client = await LoginAsAdminAsync();
        var sku = UniqueSku();

        var created = await RegisterProductAsync(client, sku, Fabricante, PrecioUsd);

        Assert.Equal(Fabricante, created.GetProperty("manufacturer").GetString());
        Assert.Equal(PrecioUsd, created.GetProperty("manufacturerPriceUsd").GetDecimal());

        var listed = await FindProductAsync(client, sku);
        Assert.Equal(Fabricante, listed.GetProperty("manufacturer").GetString());
        Assert.Equal(PrecioUsd, listed.GetProperty("manufacturerPriceUsd").GetDecimal());
    }

    [Fact]
    public async Task El_precio_del_fabricante_no_le_llega_a_un_operador()
    {
        var admin = await LoginAsAdminAsync();
        var sku = UniqueSku();
        await RegisterProductAsync(admin, sku, Fabricante, PrecioUsd);

        var operador = await LoginAsOperatorAsync();

        var listed = await FindProductAsync(operador, sku);
        Assert.Equal(Fabricante, listed.GetProperty("manufacturer").GetString());
        Assert.Equal(JsonValueKind.Null, listed.GetProperty("manufacturerPriceUsd").ValueKind);

        // Tampoco por la respuesta de una venta, que es el camino que usa el POS.
        var sale = await operador.PostAsJsonAsync("/api/sales/batch", new
        {
            items = new[]
            {
                new
                {
                    productId = listed.GetProperty("id").GetInt32(),
                    quantity = 1m,
                    saleType = 0,
                    unitPrice = 480m,
                    unit = "Boxes",
                    enteredQuantity = 1m,
                },
            },
            paymentMethod = 0,
        }, TestContext.Current.CancellationToken);
        sale.EnsureSuccessStatusCode();

        var body = await sale.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.True(body.GetProperty("success").GetBoolean(), body.GetProperty("errorMessage").GetString());

        var updated = body.GetProperty("updatedProducts").EnumerateArray()
            .Single(p => p.GetProperty("sku").GetString() == sku);
        Assert.Equal(JsonValueKind.Null, updated.GetProperty("manufacturerPriceUsd").ValueKind);
    }

    /// <summary>
    /// El caso que un simple "puede editar" no cubre: el operador manda el formulario sin el
    /// campo, porque no lo ve. Ausente no puede significar "bórralo", o cada edición de un
    /// operador borraría datos que cargó un Admin.
    /// </summary>
    [Fact]
    public async Task Un_operador_editando_no_borra_el_costo()
    {
        var admin = await LoginAsAdminAsync();
        var sku = UniqueSku();
        var created = await RegisterProductAsync(admin, sku, Fabricante, PrecioUsd);
        var id = created.GetProperty("id").GetInt32();

        var operador = await LoginAsOperatorAsync();
        var update = await operador.PutAsJsonAsync($"/api/inventory/{id}", new
        {
            sku,
            name = "Adhesivo corregido",
            length = 30m,
            width = 1.52m,
            rollsPerBox = 4,
            pricePerRoll = 480m,
            pricePerMeter = 18m,
        }, TestContext.Current.CancellationToken);
        update.EnsureSuccessStatusCode();

        var stored = await SaleScenario.ReadAsync(host.Services, db => db.Products.SingleAsync(p => p.Sku == sku));
        Assert.Equal("Adhesivo corregido", stored.Name);
        Assert.Equal(Fabricante, stored.Manufacturer);
        Assert.Equal(PrecioUsd, stored.ManufacturerPriceUsd);
    }

    private async Task<HttpClient> LoginAsAdminAsync()
    {
        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await SaleScenario.LoginAsAdminAsync(client));
        return client;
    }

    /// <summary>Registra un operador con el admin y devuelve un cliente ya autenticado como él.</summary>
    private async Task<HttpClient> LoginAsOperatorAsync()
    {
        var admin = await LoginAsAdminAsync();
        var email = $"operador-{Guid.NewGuid():N}@suntek.com";
        const string password = "Operador@123";

        var register = await admin.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password,
            fullName = "Operador de prueba",
            role = "Operator",
        }, TestContext.Current.CancellationToken);
        register.EnsureSuccessStatusCode();

        var client = host.CreateClient();
        var login = await client.PostAsJsonAsync(
            "/api/auth/login", new { email, password }, TestContext.Current.CancellationToken);
        login.EnsureSuccessStatusCode();

        var body = await login.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
        return client;
    }

    private static async Task<JsonElement> RegisterProductAsync(
        HttpClient client, string sku, string? manufacturer, decimal? priceUsd)
    {
        var response = await client.PostAsJsonAsync("/api/inventory", new
        {
            sku,
            name = "Producto de prueba",
            quantity = 10,
            length = 30m,
            width = 1.52m,
            pricePerRoll = 480m,
            pricePerMeter = 18m,
            rollsPerBox = 4,
            unitType = "Meters",
            manufacturer,
            manufacturerPriceUsd = priceUsd,
        }, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
    }

    private static async Task<JsonElement> FindProductAsync(HttpClient client, string sku)
    {
        var response = await client.GetAsync("/api/inventory", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.EnumerateArray().Single(p => p.GetProperty("sku").GetString() == sku);
    }

    private static string UniqueSku() => $"M{Guid.NewGuid():N}"[..16];
}
