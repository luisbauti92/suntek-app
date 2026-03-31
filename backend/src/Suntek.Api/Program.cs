using System.Text.Json.Serialization;
using FastEndpoints;
using FastEndpoints.Swagger;
using FastEndpoints.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Suntek.Application;
using Suntek.Infrastructure;
using Suntek.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:SecurityKey"] ?? throw new InvalidOperationException("JWT SecurityKey not configured.");

builder.Services.AddAuthenticationJwtBearer(s => s.SigningKey = jwtKey);
builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
});
builder.Services.AddAuthorization();
builder.Services.AddFastEndpoints()
    .SwaggerDocument(o =>
    {
        o.DocumentSettings = s =>
        {
            s.Title = "SUNTEK API v1";
            s.Version = "v1";
        };
    });

var allowedOrigins = builder.Configuration["AllowedOrigins"]?.Split(',') ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("SuntekPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<AppDbContext>();

    // Applies pending migrations only; no-op when the DB is already up to date.
    await db.Database.MigrateAsync();

    // Idempotent: creates roles and default admin only if missing (safe on every startup).
    await DataSeeder.SeedRolesAsync(sp);
    await DataSeeder.SeedAdminUserAsync(sp);
}

app.UseCors("SuntekPolicy");

app.UseFastEndpoints(c =>
{
    c.Serializer.Options.Converters.Add(new JsonStringEnumConverter());
});
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
    app.MapScalarApiReference(options => options
        .WithTitle("SUNTEK API v1")
        .AddDocument("v1", "SUNTEK API v1", "/swagger/v1/swagger.json"));
}

app.Run();
