using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Catalog;

/// <summary>
/// El catálogo público solo expone productos activos; Discontinued y Archived quedan fuera.
/// El ERP (admin) sigue viendo los discontinuados por su endpoint autorizado de inventario.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class PublicCatalogVisibilityTests(SuntekTestHost host)
{
    private const string CatalogKey = "integration-tests-catalog-key";

    [Fact]
    public async Task El_catalogo_publico_solo_devuelve_productos_activos()
    {
        var admin = await LoginAsAdminAsync();

        var activo = await SeedActiveAsync();
        var discontinuado = await SeedActiveAsync();
        var archivado = await SeedActiveAsync();

        await SetStatusAsync(admin, discontinuado.Id, "Discontinued");
        await SetStatusAsync(admin, archivado.Id, "Archived");

        var skus = await GetPublicCatalogSkusAsync();

        Assert.Contains(activo.Sku, skus);
        Assert.DoesNotContain(discontinuado.Sku, skus);
        Assert.DoesNotContain(archivado.Sku, skus);
    }

    [Fact]
    public async Task El_erp_sigue_viendo_los_discontinuados()
    {
        var admin = await LoginAsAdminAsync();
        var discontinuado = await SeedActiveAsync();
        await SetStatusAsync(admin, discontinuado.Id, "Discontinued");

        var response = await admin.GetAsync(
            "/api/inventory?status=discontinued", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        var skus = body.EnumerateArray().Select(p => p.GetProperty("sku").GetString()).ToList();

        Assert.Contains(discontinuado.Sku, skus);
    }

    private async Task<HttpClient> LoginAsAdminAsync()
    {
        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await SaleScenario.LoginAsAdminAsync(client));
        return client;
    }

    private Task<Product> SeedActiveAsync() =>
        SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);

    private static async Task SetStatusAsync(HttpClient admin, int id, string status)
    {
        var response = await admin.PatchAsJsonAsync(
            $"/api/products/{id}/status", new { status }, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private async Task<List<string>> GetPublicCatalogSkusAsync()
    {
        var client = host.CreateClient();
        client.DefaultRequestHeaders.Add("X-Catalog-Key", CatalogKey);
        var response = await client.GetAsync("/api/catalog/products", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.EnumerateArray().Select(p => p.GetProperty("sku").GetString()).ToList();
    }
}
