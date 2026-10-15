using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Suntek.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogCategoryToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "InventoryItems",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "InventoryItems");
        }
    }
}
