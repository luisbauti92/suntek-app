using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Inventory;

/// <summary>
/// La categoría de catálogo es una clasificación comercial explícita e independiente del
/// tipo de unidad. Una categoría explícita manda; si es nula (legacy) se mantiene la
/// inferencia por tipo de unidad/SKU. El catálogo público sigue devolviendo los mismos
/// strings de siempre: films, tools, accessories.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class CatalogCategoryTests(SuntekTestHost host)
{
    private const string CatalogKey = "integration-tests-catalog-key";

    [Fact]
    public async Task La_categoria_explicita_se_impone_a_la_inferencia()
    {
        var admin = await LoginAsAdminAsync();
        // Units sin "TOOL"/"HERRAMIENTA": la inferencia diría "accessories", pero la
        // categoría explícita manda y debe salir como "tools".
        var sku = await RegisterAsync(admin, "Units", "Tools");

        var catalog = await GetPublicCatalogAsync();
        var entry = catalog.Single(p => p.Sku == sku);

        Assert.Equal("tools", entry.Category);
    }

    [Fact]
    public async Task La_categoria_nula_mantiene_la_inferencia_legacy()
    {
        var admin = await LoginAsAdminAsync();
        // Meters sin categoría: la inferencia legacy la clasifica como films.
        var sku = await RegisterAsync(admin, "Meters", null);

        var catalog = await GetPublicCatalogAsync();
        var entry = catalog.Single(p => p.Sku == sku);

        Assert.Equal("films", entry.Category);
    }

    [Fact]
    public async Task Crear_y_actualizar_persisten_la_categoria()
    {
        var admin = await LoginAsAdminAsync();

        var created = await RegisterAndReadAsync(admin, "Meters", "Films");
        Assert.Equal("Films", created.Category);

        await UpdateAsync(admin, created.Id, created.Sku, "Accessories");
        var updated = await FindInListAsync(admin, created.Sku);
        Assert.Equal("Accessories", updated.GetProperty("category").GetString());

        await UpdateAsync(admin, created.Id, created.Sku, null);
        var cleared = await FindInListAsync(admin, created.Sku);
        Assert.Equal(JsonValueKind.Null, cleared.GetProperty("category").ValueKind);
    }

    [Fact]
    public async Task Los_productos_sembrados_sin_categoria_siguen_siendo_legibles()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);

        var listed = await FindInListAsync(admin, product.Sku);

        Assert.Equal(product.Sku, listed.GetProperty("sku").GetString());
        Assert.Equal(JsonValueKind.Null, listed.GetProperty("category").ValueKind);
    }

    [Fact]
    public async Task Los_cuatro_valores_publicos_siguen_siendo_compatibles()
    {
        var admin = await LoginAsAdminAsync();
        var films = await RegisterAsync(admin, "Meters", "Films");
        var tools = await RegisterAsync(admin, "Units", "Tools");
        var accessories = await RegisterAsync(admin, "Units", "Accessories");
        var materials = await RegisterAsync(admin, "Units", "Materials");

        var catalog = await GetPublicCatalogAsync();

        Assert.Equal("films", catalog.Single(p => p.Sku == films).Category);
        Assert.Equal("tools", catalog.Single(p => p.Sku == tools).Category);
        Assert.Equal("accessories", catalog.Single(p => p.Sku == accessories).Category);
        Assert.Equal("materials", catalog.Single(p => p.Sku == materials).Category);
    }

    [Fact]
    public async Task Materials_se_resuelve_como_materials_sea_cual_sea_el_UnitType()
    {
        var admin = await LoginAsAdminAsync();
        var units = await RegisterAsync(admin, "Units", "Materials");
        var meters = await RegisterAsync(admin, "Meters", "Materials");

        var catalog = await GetPublicCatalogAsync();

        Assert.Equal("materials", catalog.Single(p => p.Sku == units).Category);
        Assert.Equal("materials", catalog.Single(p => p.Sku == meters).Category);
    }

    [Fact]
    public async Task Un_update_que_omite_la_categoria_no_la_borra()
    {
        var admin = await LoginAsAdminAsync();
        var created = await RegisterAndReadAsync(admin, "Meters", "Films");

        // Cliente viejo, update parcial o guardar sólo campos no relacionados: no mandan
        // `category`. Ausencia no puede significar "bórralo".
        await UpdateOmittingCategoryAsync(admin, created.Id, created.Sku);

        var after = await FindInListAsync(admin, created.Sku);
        Assert.Equal("Films", after.GetProperty("category").GetString());
    }

    [Fact]
    public async Task Poner_automatica_explicitamente_si_borra_la_categoria()
    {
        var admin = await LoginAsAdminAsync();
        var created = await RegisterAndReadAsync(admin, "Meters", "Films");

        // Instancia con value nulo = el admin eligió "Automática" a propósito.
        await UpdateAsync(admin, created.Id, created.Sku, null);

        var after = await FindInListAsync(admin, created.Sku);
        Assert.Equal(JsonValueKind.Null, after.GetProperty("category").ValueKind);
    }

    private async Task<HttpClient> LoginAsAdminAsync()
    {
        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await SaleScenario.LoginAsAdminAsync(client));
        return client;
    }

    private async Task<string> RegisterAsync(HttpClient admin, string unitType, string? category)
    {
        var (sku, _, _) = await RegisterAndReadAsync(admin, unitType, category);
        return sku;
    }

    private async Task<(string Sku, int Id, string? Category)> RegisterAndReadAsync(
        HttpClient admin, string unitType, string? category)
    {
        var sku = UniqueSku();
        var body = new Dictionary<string, object?>
        {
            ["sku"] = sku,
            ["name"] = "Producto de prueba",
            ["quantity"] = 10,
            ["length"] = unitType == "Meters" ? 30m : 0m,
            ["width"] = unitType == "Meters" ? 1.52m : 0m,
            ["pricePerRoll"] = 480m,
            ["pricePerMeter"] = unitType == "Meters" ? 18m : 0m,
            ["rollsPerBox"] = 1,
            ["unitType"] = unitType,
        };
        if (category is not null)
            body["category"] = category;

        var response = await admin.PostAsJsonAsync("/api/inventory", body, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        var id = created.GetProperty("id").GetInt32();
        var stored = await FindInListAsync(admin, sku);
        var storedCategory = stored.GetProperty("category").ValueKind == JsonValueKind.Null
            ? null
            : stored.GetProperty("category").GetString();

        return (sku, id, storedCategory);
    }

    private async Task UpdateAsync(HttpClient admin, int id, string sku, string? category)
    {
        var body = new Dictionary<string, object?>
        {
            ["sku"] = sku,
            ["name"] = "Producto de prueba",
            ["length"] = 30m,
            ["width"] = 1.52m,
            ["rollsPerBox"] = 1,
            ["pricePerRoll"] = 480m,
            ["pricePerMeter"] = 18m,
            ["category"] = new { value = category },
        };

        var response = await admin.PutAsJsonAsync($"/api/inventory/{id}", body, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
    }

    /// <summary>Update que omite el campo category: el caso de un cliente viejo o un update parcial.</summary>
    private async Task UpdateOmittingCategoryAsync(HttpClient admin, int id, string sku)
    {
        var body = new Dictionary<string, object?>
        {
            ["sku"] = sku,
            ["name"] = "Producto de prueba",
            ["length"] = 30m,
            ["width"] = 1.52m,
            ["rollsPerBox"] = 1,
            ["pricePerRoll"] = 480m,
            ["pricePerMeter"] = 18m,
        };

        var response = await admin.PutAsJsonAsync($"/api/inventory/{id}", body, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private async Task<JsonElement> FindInListAsync(HttpClient client, string sku)
    {
        var response = await client.GetAsync("/api/inventory", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.EnumerateArray().Single(p => p.GetProperty("sku").GetString() == sku);
    }

    private async Task<List<(string Sku, string Category)>> GetPublicCatalogAsync()
    {
        var client = host.CreateClient();
        client.DefaultRequestHeaders.Add("X-Catalog-Key", CatalogKey);
        var response = await client.GetAsync("/api/catalog/products", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.EnumerateArray()
            .Select(p => (p.GetProperty("sku").GetString()!, p.GetProperty("category").GetString()!))
            .ToList();
    }

    private static string UniqueSku() => $"C{Guid.NewGuid():N}"[..16];
}
