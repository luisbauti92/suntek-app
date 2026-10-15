using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.IntegrationTests.Infrastructure;
using Xunit;

namespace Suntek.IntegrationTests.Catalog;

/// <summary>
/// Product image management: validation, authorization, association, primary selection, ordering,
/// removal, and the public catalog projection. Storage is faked (see <see cref="FakeImageStorage"/>),
/// so nothing here touches live R2.
/// </summary>
[Collection(IntegrationCollection.Name)]
public class ProductImageTests(SuntekTestHost host)
{
    private const string CatalogKey = "integration-tests-catalog-key";

    // Minimal, structurally valid headers: the validator checks bytes, not decodability.
    private static readonly byte[] PngImage = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
    private static readonly byte[] JpegImage = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46];
    private static readonly byte[] WebpImage = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38];

    [Fact]
    public async Task Subir_una_imagen_valida_la_guarda_y_la_marca_como_primaria()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var response = await UploadAsync(admin, product.Id, PngImage, "foto.png", "image/png");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJsonAsync(response);

        Assert.True(body.GetProperty("isPrimary").GetBoolean());
        Assert.Equal(0, body.GetProperty("sortOrder").GetInt32());
        Assert.Equal("image/png", body.GetProperty("contentType").GetString());

        var objectKey = body.GetProperty("objectKey").GetString()!;
        Assert.StartsWith($"catalog/products/{product.Id}/", objectKey);
        Assert.EndsWith(".png", objectKey);
        Assert.Equal($"{FakeImageStorage.PublicBaseUrl}/{objectKey}", body.GetProperty("url").GetString());
        Assert.True(host.Storage.Contains(objectKey));

        // The stored row is associated with the product and keeps metadata, not just a URL.
        var stored = Assert.Single(await ImagesOfAsync(product.Id));
        Assert.Equal(product.Id, stored.ProductId);
        Assert.Equal(objectKey, stored.ObjectKey);
        Assert.Equal(PngImage.Length, stored.FileSizeBytes);
    }

    [Theory]
    [InlineData("image/jpeg")]
    [InlineData("image/png")]
    [InlineData("image/webp")]
    public async Task Solo_se_aceptan_jpeg_png_y_webp(string contentType)
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();
        var bytes = contentType switch
        {
            "image/jpeg" => JpegImage,
            "image/png" => PngImage,
            _ => WebpImage,
        };

        var response = await UploadAsync(admin, product.Id, bytes, "foto.bin", contentType);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(contentType, (await ReadJsonAsync(response)).GetProperty("contentType").GetString());
    }

    [Fact]
    public async Task Un_archivo_con_nombre_y_mime_de_imagen_pero_contenido_invalido_se_rechaza()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        // Spoofed extension and MIME type: the bytes are what decide.
        var response = await UploadAsync(
            admin, product.Id, Encoding.UTF8.GetBytes("#!/bin/sh\necho not an image"), "foto.png", "image/png");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(await ImagesOfAsync(product.Id));
    }

    [Fact]
    public async Task Un_archivo_mas_grande_que_el_limite_se_rechaza_sin_persistir()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var oversized = new byte[host.Storage.MaxFileSizeBytes + 1];
        PngImage.CopyTo(oversized, 0);

        var response = await UploadAsync(admin, product.Id, oversized, "grande.png", "image/png");

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Empty(await ImagesOfAsync(product.Id));
    }

    [Fact]
    public async Task Una_falla_de_storage_no_deja_registro_en_la_base()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();
        var objectsBefore = host.Storage.Count;

        host.Storage.FailNextPut = true;
        try
        {
            var response = await UploadAsync(admin, product.Id, PngImage, "foto.png", "image/png");
            Assert.False(response.IsSuccessStatusCode);
        }
        catch
        {
            // The storage outage may also surface as an unhandled pipeline exception; both are valid.
        }

        Assert.Equal(objectsBefore, host.Storage.Count);
        Assert.Empty(await ImagesOfAsync(product.Id));
    }

    [Fact]
    public async Task Un_operador_puede_ver_pero_no_modificar_las_imagenes()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();
        var imageId = await UploadAndGetIdAsync(admin, product.Id);

        var operador = await LoginAsOperatorAsync();

        var list = await operador.GetAsync($"/api/products/{product.Id}/images", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        var upload = await UploadAsync(operador, product.Id, PngImage, "foto.png", "image/png");
        Assert.Equal(HttpStatusCode.Forbidden, upload.StatusCode);

        var setPrimary = await operador.PatchAsync(
            $"/api/products/{product.Id}/images/{imageId}/primary", null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, setPrimary.StatusCode);

        var reorder = await operador.PatchAsJsonAsync(
            $"/api/products/{product.Id}/images/order", new { imageIds = new[] { imageId } },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, reorder.StatusCode);

        var delete = await operador.DeleteAsync(
            $"/api/products/{product.Id}/images/{imageId}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, delete.StatusCode);

        // The image the Admin uploaded is untouched.
        Assert.Single(await ImagesOfAsync(product.Id));
    }

    [Fact]
    public async Task Las_imagenes_quedan_asociadas_a_su_producto()
    {
        var admin = await LoginAsAdminAsync();
        var productA = await SeedAsync();
        var productB = await SeedAsync();

        await UploadAsync(admin, productA.Id, PngImage, "a1.png", "image/png");
        await UploadAsync(admin, productA.Id, PngImage, "a2.png", "image/png");
        await UploadAsync(admin, productB.Id, PngImage, "b1.png", "image/png");

        var listA = await ListAsync(admin, productA.Id);
        var listB = await ListAsync(admin, productB.Id);

        Assert.Equal(2, listA.Count);
        Assert.Single(listB);
        Assert.All(listA, i => Assert.Equal(productA.Id, i.GetProperty("productId").GetInt32()));
        Assert.All(listB, i => Assert.Equal(productB.Id, i.GetProperty("productId").GetInt32()));
    }

    [Fact]
    public async Task Asignar_una_primaria_desmarca_las_demas()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var first = await UploadAndGetIdAsync(admin, product.Id);
        var second = await UploadAndGetIdAsync(admin, product.Id);

        var response = await admin.PatchAsync(
            $"/api/products/{product.Id}/images/{second}/primary", null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var images = await ListAsync(admin, product.Id);
        var primary = Assert.Single(images, i => i.GetProperty("isPrimary").GetBoolean());
        Assert.Equal(second, primary.GetProperty("id").GetInt32());
        Assert.NotEqual(first, second);
    }

    [Fact]
    public async Task El_reordenamiento_persiste_y_es_determinista()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var first = await UploadAndGetIdAsync(admin, product.Id);
        var second = await UploadAndGetIdAsync(admin, product.Id);
        var third = await UploadAndGetIdAsync(admin, product.Id);

        var response = await admin.PatchAsJsonAsync(
            $"/api/products/{product.Id}/images/order",
            new { imageIds = new[] { third, first, second } },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var ordered = (await ListAsync(admin, product.Id)).Select(i => i.GetProperty("id").GetInt32()).ToList();
        Assert.Equal([third, first, second], ordered);

        // Sort order is renumbered from zero, so display order does not depend on insertion time.
        var stored = await ImagesOfAsync(product.Id);
        Assert.Equal([0, 1, 2], stored.Select(i => i.SortOrder).OrderBy(order => order).ToList());
    }

    [Fact]
    public async Task Reordenar_con_una_lista_incompleta_se_rechaza()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var first = await UploadAndGetIdAsync(admin, product.Id);
        await UploadAndGetIdAsync(admin, product.Id);

        var response = await admin.PatchAsJsonAsync(
            $"/api/products/{product.Id}/images/order",
            new { imageIds = new[] { first } },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Eliminar_una_imagen_borra_el_registro_y_el_objeto()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var upload = await ReadJsonAsync(await UploadAsync(admin, product.Id, PngImage, "foto.png", "image/png"));
        var imageId = upload.GetProperty("id").GetInt32();
        var objectKey = upload.GetProperty("objectKey").GetString()!;

        var response = await admin.DeleteAsync(
            $"/api/products/{product.Id}/images/{imageId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty(await ImagesOfAsync(product.Id));
        Assert.False(host.Storage.Contains(objectKey));
    }

    [Fact]
    public async Task Eliminar_la_primaria_promueve_la_siguiente()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var first = await UploadAndGetIdAsync(admin, product.Id);
        var second = await UploadAndGetIdAsync(admin, product.Id);

        await admin.DeleteAsync($"/api/products/{product.Id}/images/{first}", TestContext.Current.CancellationToken);

        var primary = Assert.Single(await ListAsync(admin, product.Id));
        Assert.Equal(second, primary.GetProperty("id").GetInt32());
        Assert.True(primary.GetProperty("isPrimary").GetBoolean());
    }

    [Fact]
    public async Task Reemplazar_conserva_la_identidad_de_la_imagen_y_borra_el_objeto_anterior()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var upload = await ReadJsonAsync(await UploadAsync(admin, product.Id, PngImage, "foto.png", "image/png"));
        var imageId = upload.GetProperty("id").GetInt32();
        var oldKey = upload.GetProperty("objectKey").GetString()!;

        var response = await ReplaceAsync(admin, product.Id, imageId, JpegImage, "mejor.jpg", "image/jpeg");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJsonAsync(response);

        Assert.Equal(imageId, body.GetProperty("id").GetInt32());
        Assert.True(body.GetProperty("isPrimary").GetBoolean());
        Assert.Equal(0, body.GetProperty("sortOrder").GetInt32());
        Assert.Equal("image/jpeg", body.GetProperty("contentType").GetString());
        Assert.Equal(JpegImage.Length, body.GetProperty("fileSizeBytes").GetInt64());

        var newKey = body.GetProperty("objectKey").GetString()!;
        Assert.NotEqual(oldKey, newKey);
        Assert.False(host.Storage.Contains(oldKey));
        Assert.True(host.Storage.Contains(newKey));
    }

    [Fact]
    public async Task Subir_a_un_producto_inexistente_devuelve_404()
    {
        var admin = await LoginAsAdminAsync();

        var response = await UploadAsync(admin, 999_999, PngImage, "foto.png", "image/png");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task El_catalogo_publico_expone_la_imagen_primaria_y_deja_null_si_no_hay()
    {
        var admin = await LoginAsAdminAsync();
        var withImage = await SeedAsync();
        var withoutImage = await SeedAsync();

        var upload = await ReadJsonAsync(await UploadAsync(admin, withImage.Id, PngImage, "foto.png", "image/png"));
        var expectedUrl = $"{FakeImageStorage.PublicBaseUrl}/{upload.GetProperty("objectKey").GetString()}";

        var catalog = host.CreateClient();
        catalog.DefaultRequestHeaders.Add("X-Catalog-Key", CatalogKey);
        var response = await catalog.GetAsync("/api/catalog/products", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        var withImageItem = FindBySku(body, withImage.Sku);
        var withoutImageItem = FindBySku(body, withoutImage.Sku);

        Assert.Equal(expectedUrl, withImageItem.GetProperty("imageUrl").GetString());
        Assert.Equal(JsonValueKind.Null, withoutImageItem.GetProperty("imageUrl").ValueKind);
    }

    [Fact]
    public async Task El_inventario_del_erp_expone_la_imagen_primaria()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();

        var upload = await ReadJsonAsync(await UploadAsync(admin, product.Id, PngImage, "foto.png", "image/png"));
        var expectedUrl = $"{FakeImageStorage.PublicBaseUrl}/{upload.GetProperty("objectKey").GetString()}";

        var response = await admin.GetAsync("/api/inventory", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        var item = body.EnumerateArray().First(p => p.GetProperty("sku").GetString() == product.Sku);
        Assert.Equal(expectedUrl, item.GetProperty("primaryImageUrl").GetString());
    }

    [Fact]
    public async Task Las_operaciones_de_imagen_no_tocan_otros_campos_del_producto()
    {
        var admin = await LoginAsAdminAsync();
        var product = await SeedAsync();
        var before = await ReloadProductAsync(product.Id);

        var imageId = await UploadAndGetIdAsync(admin, product.Id);
        await admin.PatchAsync(
            $"/api/products/{product.Id}/images/{imageId}/primary", null, TestContext.Current.CancellationToken);
        await UploadAsync(admin, product.Id, PngImage, "otra.png", "image/png");
        await admin.DeleteAsync(
            $"/api/products/{product.Id}/images/{imageId}", TestContext.Current.CancellationToken);

        var after = await ReloadProductAsync(product.Id);

        Assert.Equal(before.Sku, after.Sku);
        Assert.Equal(before.Name, after.Name);
        Assert.Equal(before.Quantity, after.Quantity);
        Assert.Equal(before.WholesaleQuantity, after.WholesaleQuantity);
        Assert.Equal(before.RetailQuantity, after.RetailQuantity);
        Assert.Equal(before.PricePerRoll, after.PricePerRoll);
        Assert.Equal(before.PricePerMeter, after.PricePerMeter);
        Assert.Equal(before.Length, after.Length);
        Assert.Equal(before.Width, after.Width);
        Assert.Equal(before.RollsPerBox, after.RollsPerBox);
        Assert.Equal(before.UnitType, after.UnitType);
        Assert.Equal(before.Category, after.Category);
        Assert.Equal(before.Manufacturer, after.Manufacturer);
        Assert.Equal(before.Status, after.Status);
    }

    private static JsonElement FindBySku(JsonElement catalog, string sku)
    {
        foreach (var item in catalog.EnumerateArray())
        {
            if (item.GetProperty("sku").GetString() == sku)
                return item;
        }

        throw new Xunit.Sdk.XunitException($"SKU {sku} was not present in the public catalog.");
    }

    private async Task<Product> SeedAsync() =>
        await SaleScenario.SeedProductAsync(host.Services, UnitType.Meters, 30m, 1, 480m, 18m);

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

    private async Task<int> UploadAndGetIdAsync(HttpClient client, int productId)
    {
        var response = await UploadAsync(client, productId, PngImage, "foto.png", "image/png");
        response.EnsureSuccessStatusCode();
        return (await ReadJsonAsync(response)).GetProperty("id").GetInt32();
    }

    private static Task<HttpResponseMessage> UploadAsync(
        HttpClient client, int productId, byte[] bytes, string fileName, string contentType) =>
        client.PostAsync(
            $"/api/products/{productId}/images",
            Multipart(bytes, fileName, contentType),
            TestContext.Current.CancellationToken);

    private static Task<HttpResponseMessage> ReplaceAsync(
        HttpClient client, int productId, int imageId, byte[] bytes, string fileName, string contentType) =>
        client.PutAsync(
            $"/api/products/{productId}/images/{imageId}",
            Multipart(bytes, fileName, contentType),
            TestContext.Current.CancellationToken);

    private static MultipartFormDataContent Multipart(byte[] bytes, string fileName, string contentType)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "File", fileName } };
    }

    private async Task<List<JsonElement>> ListAsync(HttpClient client, int productId)
    {
        var response = await client.GetAsync($"/api/products/{productId}/images", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        return body.EnumerateArray().ToList();
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);

    private Task<List<ProductImage>> ImagesOfAsync(int productId) =>
        SaleScenario.ReadAsync(host.Services, db =>
            db.ProductImages.AsNoTracking().Where(i => i.ProductId == productId).ToListAsync());

    private Task<Product> ReloadProductAsync(int productId) =>
        SaleScenario.ReadAsync(host.Services, db =>
            db.Products.IgnoreQueryFilters().AsNoTracking().SingleAsync(p => p.Id == productId));
}
