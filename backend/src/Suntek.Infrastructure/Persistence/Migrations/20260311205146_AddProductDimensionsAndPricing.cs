using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Suntek.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductDimensionsAndPricing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Length",
                table: "InventoryItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerMeter",
                table: "InventoryItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerRoll",
                table: "InventoryItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Width",
                table: "InventoryItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Length",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "PricePerMeter",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "PricePerRoll",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "InventoryItems");
        }
    }
}
