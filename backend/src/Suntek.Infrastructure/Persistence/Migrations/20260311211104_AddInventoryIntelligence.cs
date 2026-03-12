using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Suntek.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryIntelligence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "RetailQuantity",
                table: "InventoryItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RollsPerBox",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnitType",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WholesaleQuantity",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RetailQuantity",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "RollsPerBox",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "UnitType",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "WholesaleQuantity",
                table: "InventoryItems");
        }
    }
}
