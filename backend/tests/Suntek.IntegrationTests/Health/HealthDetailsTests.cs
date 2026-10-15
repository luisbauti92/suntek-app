using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Suntek.Application.Common.Interfaces;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Health;

/// <summary>
/// /api/health/details is Admin-only and must report connectivity without ever leaking credentials,
/// the S3 endpoint or the account id.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class HealthDetailsTests(SuntekTestHost host)
{
    private const string Path = "/api/health/details";

    [Fact]
    public async Task El_admin_ve_el_detalle_de_conexiones()
    {
        var admin = await LoginAsAdminAsync();

        var response = await admin.GetAsync(Path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJsonAsync(response);
        Assert.Equal("Healthy", body.GetProperty("status").GetString());

        var db = body.GetProperty("checks").GetProperty("database");
        Assert.Equal("Healthy", db.GetProperty("status").GetString());
        Assert.Equal(0, db.GetProperty("pendingMigrations").GetInt32());
        Assert.EndsWith("AddProductImages", db.GetProperty("latestAppliedMigration").GetString());
        Assert.True(db.GetProperty("latencyMs").GetInt64() >= 0);

        var storage = body.GetProperty("checks").GetProperty("r2Storage");
        Assert.Equal("Healthy", storage.GetProperty("status").GetString());
        Assert.True(storage.GetProperty("configured").GetBoolean());
        Assert.Equal("suntek-catalog-images", storage.GetProperty("bucket").GetString());
        Assert.Equal("catalog/products", storage.GetProperty("keyPrefix").GetString());
        Assert.Contains("ListObjectsV2", storage.GetProperty("probe").GetString());

        Assert.True(body.GetProperty("checks").GetProperty("catalogApiKey").GetProperty("configured").GetBoolean());
        Assert.True(body.GetProperty("checks").GetProperty("jwt").GetProperty("configured").GetBoolean());
    }

    [Fact]
    public async Task El_detalle_no_expone_credenciales_ni_el_endpoint()
    {
        var admin = await LoginAsAdminAsync();

        var response = await admin.GetAsync(Path, TestContext.Current.CancellationToken);
        var raw = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.DoesNotContain("test-secret-access-key", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("test-access-key-id", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("test-account.r2.cloudflarestorage.com", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("integration-tests-signing-key", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("integration-tests-catalog-key", raw, StringComparison.Ordinal);
        Assert.DoesNotContain(FakeImageStorage.PublicBaseUrl, raw, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Sin_autenticacion_el_detalle_no_es_visible()
    {
        var anonymous = host.CreateClient();

        var response = await anonymous.GetAsync(Path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Un_operador_no_puede_ver_el_detalle()
    {
        var operador = await LoginAsOperatorAsync();

        var response = await operador.GetAsync(Path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Un_storage_degradado_se_reporta_como_degraded_y_no_falla()
    {
        var admin = await LoginAsAdminAsync();
        host.Storage.ProbeResult = new ImageStorageProbeResult(
            ImageStorageProbeStatus.Degraded, "Credentials lack s3:ListBucket, so the bucket could not be listed.");

        try
        {
            var response = await admin.GetAsync(Path, TestContext.Current.CancellationToken);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await ReadJsonAsync(response);
            Assert.Equal("Degraded", body.GetProperty("status").GetString());
            var storage = body.GetProperty("checks").GetProperty("r2Storage");
            Assert.Equal("Degraded", storage.GetProperty("status").GetString());
            Assert.Contains("ListBucket", storage.GetProperty("reason").GetString());
        }
        finally
        {
            host.Storage.ProbeResult = new ImageStorageProbeResult(ImageStorageProbeStatus.Healthy);
        }
    }

    [Fact]
    public async Task Un_storage_inaccesible_devuelve_503()
    {
        var admin = await LoginAsAdminAsync();
        host.Storage.ProbeResult = new ImageStorageProbeResult(
            ImageStorageProbeStatus.Unhealthy, "Could not reach R2: HttpRequestException.");

        try
        {
            var response = await admin.GetAsync(Path, TestContext.Current.CancellationToken);

            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
            var body = await ReadJsonAsync(response);
            Assert.Equal("Unhealthy", body.GetProperty("status").GetString());
        }
        finally
        {
            host.Storage.ProbeResult = new ImageStorageProbeResult(ImageStorageProbeStatus.Healthy);
        }
    }

    private async Task<HttpClient> LoginAsAdminAsync()
    {
        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await SaleScenario.LoginAsAdminAsync(client));
        return client;
    }

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

        var body = await ReadJsonAsync(login);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.GetProperty("token").GetString());
        return client;
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
}
