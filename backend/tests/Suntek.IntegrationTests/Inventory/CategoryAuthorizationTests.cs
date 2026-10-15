using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Inventory;

/// <summary>
/// La categoría de catálogo es Admin-only. Un operador puede seguir editando y creando
/// productos (nombre, medidas, precios, stock) pero no puede clasificarlos. La presencia del
/// objeto de categoría cuenta como intento, incluso con `value` nulo: eso es "volver a
/// automática" y también es un cambio.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class CategoryAuthorizationTests(SuntekTestHost host)
{
    [Fact]
    public async Task Un_operador_no_puede_cambiar_la_categoria_en_la_edicion()
    {
        var admin = await LoginAsAdminAsync();
        var sku = UniqueSku();
        var id = await RegisterAsync(admin, sku, "Films");

        var operador = await LoginAsOperatorAsync();
        var response = await UpdateAsync(operador, id, sku, category: new { value = "Tools" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("Films", (await ProductInDbAsync(id)).Category?.ToString());
    }

    [Fact]
    public async Task Un_operador_no_puede_reiniciar_la_categoria_a_automatica()
    {
        var admin = await LoginAsAdminAsync();
        var sku = UniqueSku();
        var id = await RegisterAsync(admin, sku, "Films");

        var operador = await LoginAsOperatorAsync();
        // Instancia con value nulo: "volver a automática" también es un cambio de categoría.
        var response = await UpdateAsync(operador, id, sku, category: new { value = (string?)null });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("Films", (await ProductInDbAsync(id)).Category?.ToString());
    }

    [Fact]
    public async Task Un_operador_si_puede_editar_los_demas_campos_sin_tocar_la_categoria()
    {
        var admin = await LoginAsAdminAsync();
        var sku = UniqueSku();
        var id = await RegisterAsync(admin, sku, "Films");

        var operador = await LoginAsOperatorAsync();
        var response = await UpdateAsync(operador, id, sku, category: null, name: "Nombre corregido", pricePerRoll: 333.33m);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stored = await ProductInDbAsync(id);
        Assert.Equal("Nombre corregido", stored.Name);
        Assert.Equal(333.33m, stored.PricePerRoll);
        // La categoría que asignó el Admin no se toca.
        Assert.Equal("Films", stored.Category?.ToString());
    }

    [Fact]
    public async Task Un_admin_si_puede_cambiar_y_limpiar_la_categoria()
    {
        var admin = await LoginAsAdminAsync();
        var sku = UniqueSku();
        var id = await RegisterAsync(admin, sku, "Films");

        var set = await UpdateAsync(admin, id, sku, category: new { value = "Materials" });
        Assert.Equal(HttpStatusCode.OK, set.StatusCode);
        Assert.Equal("Materials", (await ProductInDbAsync(id)).Category?.ToString());

        var clear = await UpdateAsync(admin, id, sku, category: new { value = (string?)null });
        Assert.Equal(HttpStatusCode.OK, clear.StatusCode);
        Assert.Null((await ProductInDbAsync(id)).Category);
    }

    [Fact]
    public async Task Un_operador_no_puede_clasificar_un_producto_al_crearlo()
    {
        var operador = await LoginAsOperatorAsync();
        var sku = UniqueSku();

        var response = await operador.PostAsJsonAsync("/api/inventory", new
        {
            sku,
            name = "Producto de prueba",
            quantity = 5,
            length = 30m,
            width = 1.52m,
            pricePerRoll = 480m,
            pricePerMeter = 18m,
            rollsPerBox = 1,
            unitType = "Meters",
            category = "Tools",
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var admin = await LoginAsAdminAsync();
        var listed = await FindInListAsync(admin, sku);
        Assert.Null(listed);
    }

    [Fact]
    public async Task Un_operador_si_puede_crear_en_automatica()
    {
        var operador = await LoginAsOperatorAsync();
        var sku = UniqueSku();

        var response = await operador.PostAsJsonAsync("/api/inventory", new
        {
            sku,
            name = "Producto de prueba",
            quantity = 5,
            length = 30m,
            width = 1.52m,
            pricePerRoll = 480m,
            pricePerMeter = 18m,
            rollsPerBox = 1,
            unitType = "Meters",
            category = (string?)null,
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var created = await ProductInDbAsync((await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken)).GetProperty("id").GetInt32());
        Assert.Null(created.Category);
    }

    private static async Task<HttpResponseMessage> UpdateAsync(
        HttpClient client, int id, string sku, object? category, string name = "Producto de prueba", decimal pricePerRoll = 480m)
    {
        var body = new Dictionary<string, object?>
        {
            ["sku"] = sku,
            ["name"] = name,
            ["length"] = 30m,
            ["width"] = 1.52m,
            ["rollsPerBox"] = 1,
            ["pricePerRoll"] = pricePerRoll,
            ["pricePerMeter"] = 18m,
        };
        if (category is not null)
            body["category"] = category;

        return await client.PutAsJsonAsync($"/api/inventory/{id}", body, TestContext.Current.CancellationToken);
    }

    private async Task<int> RegisterAsync(HttpClient admin, string sku, string? category)
    {
        var body = new Dictionary<string, object?>
        {
            ["sku"] = sku,
            ["name"] = "Producto de prueba",
            ["quantity"] = 10,
            ["length"] = 30m,
            ["width"] = 1.52m,
            ["pricePerRoll"] = 480m,
            ["pricePerMeter"] = 18m,
            ["rollsPerBox"] = 1,
            ["unitType"] = "Meters",
        };
        if (category is not null)
            body["category"] = category;

        var response = await admin.PostAsJsonAsync("/api/inventory", body, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return created.GetProperty("id").GetInt32();
    }

    /// <summary>Busca el producto en el listado; devuelve null si no existe (p. ej. nunca se creó).</summary>
    private async Task<JsonElement?> FindInListAsync(HttpClient client, string sku)
    {
        var response = await client.GetAsync("/api/inventory", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        foreach (var item in body.EnumerateArray())
        {
            if (item.GetProperty("sku").GetString() == sku)
                return item;
        }
        return null;
    }

    private Task<Product> ProductInDbAsync(int id) =>
        SaleScenario.ReadAsync(host.Services, db =>
            db.Products.IgnoreQueryFilters().AsNoTracking().SingleAsync(p => p.Id == id));

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

    private static string UniqueSku() => $"A{Guid.NewGuid():N}"[..16];
}
