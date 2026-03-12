# --- ETAPA DE COMPILACIÓN (BUILD) ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Copiamos solo los archivos .csproj para restaurar dependencias primero (esto acelera futuros builds)
COPY ["src/Suntek.Api/Suntek.Api.csproj", "src/Suntek.Api/"]
COPY ["src/Suntek.Application/Suntek.Application.csproj", "src/Suntek.Application/"]
COPY ["src/Suntek.Domain/Suntek.Domain.csproj", "src/Suntek.Domain/"]
COPY ["src/Suntek.Infrastructure/Suntek.Infrastructure.csproj", "src/Suntek.Infrastructure/"]

# 2. Restauramos las dependencias
RUN dotnet restore "src/Suntek.Api/Suntek.Api.csproj"

# 3. Copiamos todo el código restante del backend
COPY . .

# 4. Compilamos y publicamos la app en modo Release
RUN dotnet publish "src/Suntek.Api/Suntek.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# --- ETAPA FINAL (RUNTIME) ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copiamos solo lo necesario desde la etapa de build
COPY --from=build /app/publish .

# Render usa el puerto 8080 por defecto para contenedores
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Suntek.Api.dll"]