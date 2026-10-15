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
/// Asignación masiva de categoría desde el ERP. La regla de oro es que sea todo-o-nada:
/// si algún id no existe, la operación entera se rechaza y ningún producto cambia. Un
/// endpoint que actualiza "los que encuentra" esconde selecciones viejas y deja al admin
/// creyendo que asignó a todos.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class BulkCategoryAssignmentTests(SuntekTestHost host)
{
    [Fact]
    public async Task La_asignacion_masiva_cambia_la_categoria_de_todos_los_seleccionados()
    {
        var admin = await LoginAsAdminAsync();
        var a = await RegisterAsync(admin, "Meters", "Films");
        var b = await RegisterAsync(admin, "Units", null);
        var c = await RegisterAsync(admin, "Units", "Accessories");

        var (status, updatedCount) = await AssignBulkAsync(admin, [a, b, c], "Tools");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(3, updatedCount);
        Assert.Equal("Tools", (await ProductInDbAsync(a)).Category?.ToString());
        Assert.Equal("Tools", (await ProductInDbAsync(b)).Category?.ToString());
        Assert.Equal("Tools", (await ProductInDbAsync(c)).Category?.ToString());
    }

    [Fact]
    public async Task La_asignacion_masiva_puede_volver_a_automatica()
    {
        var admin = await LoginAsAdminAsync();
        var a = await RegisterAsync(admin, "Meters", "Films");
        var b = await RegisterAsync(admin, "Units", "Tools");

        var (status, _) = await AssignBulkAsync(admin, [a, b], null);

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Null((await ProductInDbAsync(a)).Category);
        Assert.Null((await ProductInDbAsync(b)).Category);
    }

    [Fact]
    public async Task Un_id_desconocido_cancela_toda_la_operacion()
    {
        var admin = await LoginAsAdminAsync();
        var a = await RegisterAsync(admin, "Meters", "Films");
        var b = await RegisterAsync(admin, "Meters", "Films");

        var (status, _) = await AssignBulkAsync(admin, [a, b, 9_999_999], "Tools");

        Assert.Equal(HttpStatusCode.NotFound, status);
        // Ni siquiera los ids válidos de la selección se tocan: no hay asignación parcial.
        Assert.Equal("Films", (await ProductInDbAsync(a)).Category?.ToString());
        Assert.Equal("Films", (await ProductInDbAsync(b)).Category?.ToString());
    }

    [Fact]
    public async Task Una_seleccion_vacia_es_rechazada()
    {
        var admin = await LoginAsAdminAsync();

        var response = await admin.PatchAsJsonAsync(
            "/api/products/bulk-category",
            new { productIds = Array.Empty<int>(), category = "Tools" },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task La_asignacion_masiva_no_toca_stock_precios_ni_estado()
    {
        var admin = await LoginAsAdminAsync();
        var id = await RegisterAsync(admin, "Meters", null, pricePerRoll: 512.34m, pricePerMeter: 19.99m);
        var before = await ProductInDbAsync(id);

        await AssignBulkAsync(admin, [id], "Materials");
        var after = await ProductInDbAsync(id);

        Assert.Equal("Materials", after.Category?.ToString());
        Assert.Equal(before.WholesaleQuantity, after.WholesaleQuantity);
        Assert.Equal(before.RetailQuantity, after.RetailQuantity);
        Assert.Equal(before.PricePerRoll, after.PricePerRoll);
        Assert.Equal(before.PricePerMeter, after.PricePerMeter);
        Assert.Equal(before.Length, after.Length);
        Assert.Equal(before.UnitType, after.UnitType);
        Assert.Equal(before.Status, after.Status);
        Assert.NotNull(after.UpdatedAt);
    }

    [Fact]
    public async Task Un_producto_archivado_no_se_puede_clasificar_en_masa()
    {
        var admin = await LoginAsAdminAsync();
        var id = await RegisterAsync(admin, "Units", "Films");

        var archive = await admin.DeleteAsync($"/api/inventory/{id}", TestContext.Current.CancellationToken);
        archive.EnsureSuccessStatusCode();

        var (status, _) = await AssignBulkAsync(admin, [id], "Tools");

        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Equal("Films", (await ProductInDbAsync(id)).Category?.ToString());
    }

    [Fact]
    public async Task Un_operador_no_puede_asignar_categorias_en_masa()
    {
        var admin = await LoginAsAdminAsync();
        var id = await RegisterAsync(admin, "Meters", null);
        var operador = await LoginAsOperatorAsync();

        var response = await operador.PatchAsJsonAsync(
            "/api/products/bulk-category",
            new { productIds = new[] { id }, category = "Tools" },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Null((await ProductInDbAsync(id)).Category);
    }

    [Fact]
    public async Task Asignar_en_masa_lo_que_ya_tenia_la_categoria_es_idempotente()
    {
        var admin = await LoginAsAdminAsync();
        var a = await RegisterAsync(admin, "Meters", "Films");
        var b = await RegisterAsync(admin, "Units", "Films");

        await AssignBulkAsync(admin, [a, b], "Films");
        var (status, updatedCount) = await AssignBulkAsync(admin, [a, b], "Films");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(2, updatedCount);
        Assert.Equal("Films", (await ProductInDbAsync(a)).Category?.ToString());
    }

    private async Task<(HttpStatusCode Status, int UpdatedCount)> AssignBulkAsync(
        HttpClient admin, int[] ids, string? category)
    {
        var response = await admin.PatchAsJsonAsync(
            "/api/products/bulk-category",
            new { productIds = ids, category },
            TestContext.Current.CancellationToken);

        if (!response.IsSuccessStatusCode)
            return (response.StatusCode, 0);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return (response.StatusCode, body.GetProperty("updatedCount").GetInt32());
    }

    private Task<Product> ProductInDbAsync(int id) =>
        SaleScenario.ReadAsync(host.Services, db =>
            db.Products.IgnoreQueryFilters().AsNoTracking().SingleAsync(p => p.Id == id));

    private async Task<int> RegisterAsync(
        HttpClient admin,
        string unitType,
        string? category,
        decimal pricePerRoll = 480m,
        decimal pricePerMeter = 18m)
    {
        var sku = UniqueSku();
        var body = new Dictionary<string, object?>
        {
            ["sku"] = sku,
            ["name"] = "Producto de prueba",
            ["quantity"] = 10,
            ["length"] = unitType == "Meters" ? 30m : 0m,
            ["width"] = unitType == "Meters" ? 1.52m : 0m,
            ["pricePerRoll"] = pricePerRoll,
            ["pricePerMeter"] = unitType == "Meters" ? pricePerMeter : 0m,
            ["rollsPerBox"] = 1,
            ["unitType"] = unitType,
        };
        if (category is not null)
            body["category"] = category;

        var response = await admin.PostAsJsonAsync("/api/inventory", body, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return created.GetProperty("id").GetInt32();
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

    private static string UniqueSku() => $"B{Guid.NewGuid():N}"[..16];
}
