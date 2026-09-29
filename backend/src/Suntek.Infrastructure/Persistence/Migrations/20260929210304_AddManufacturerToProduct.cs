using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Suntek.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManufacturerToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Manufacturer",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ManufacturerPriceUsd",
                table: "InventoryItems",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Manufacturer",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "ManufacturerPriceUsd",
                table: "InventoryItems");
        }
    }
}
