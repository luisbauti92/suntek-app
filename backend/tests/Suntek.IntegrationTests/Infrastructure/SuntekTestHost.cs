using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;
using Xunit;

namespace Suntek.IntegrationTests.Infrastructure;

/// <summary>
/// Arranca un Postgres descartable por corrida y levanta la API real contra él.
///
/// No hay mocks: la API aplica sus propias migraciones y siembra el admin al iniciar
/// (Program.cs), así que cada corrida tiene un esquema construido desde el código bajo
/// prueba. Si alguien agrega una propiedad a una entidad y se olvida la migración, estos
/// tests fallan en vez de explotar en producción.
/// </summary>
public sealed class SuntekTestHost : IAsyncLifetime
{
    private PostgreSqlContainer _postgres = null!;
    private SuntekApiFactory _factory = null!;

    public IServiceProvider Services => _factory.Services;

    public HttpClient CreateClient() => _factory.CreateClient();

    public async ValueTask InitializeAsync()
    {
        _postgres = new PostgreSqlBuilder("postgres:17-alpine")
            .WithDatabase("suntek_tests")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();

        await _postgres.StartAsync();

        // La configuración va por variables de entorno a propósito: la API resuelve la
        // connection string al construir el host (AddInfrastructure lee builder.Configuration
        // antes de que WebApplicationFactory aplique nada), así que un ConfigureAppConfiguration
        // en el factory llega tarde. Las variables de entorno sí están en CreateBuilder.
        // Efecto colateral útil: no dependemos de appsettings.Development.json, que está
        // gitignoreado y no existe en CI.
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", _postgres.GetConnectionString());
        Environment.SetEnvironmentVariable("Jwt__SecurityKey", "integration-tests-signing-key-not-used-in-production");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "suntek-tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "suntek-tests");
        Environment.SetEnvironmentVariable("Jwt__ExpirationMinutes", "60");
        Environment.SetEnvironmentVariable("Catalog__ApiKey", "integration-tests-catalog-key");
        Environment.SetEnvironmentVariable("AllowedOrigins", "http://localhost");
        // Sin esto, EF loguea cada comando SQL y el resultado de los tests queda ilegible.
        Environment.SetEnvironmentVariable("Logging__LogLevel__Default", "Warning");

        _factory = new SuntekApiFactory();

        // Toca Services para forzar el arranque (migraciones + seed) antes del primer test.
        _ = _factory.Services;
    }

    public async ValueTask DisposeAsync()
    {
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}

public sealed class SuntekApiFactory : WebApplicationFactory<Program>;

[CollectionDefinition(Name)]
public sealed class IntegrationCollection : ICollectionFixture<SuntekTestHost>
{
    public const string Name = "suntek-integration";
}
