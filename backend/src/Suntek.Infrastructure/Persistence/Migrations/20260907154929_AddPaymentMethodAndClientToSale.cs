using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Suntek.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethodAndClientToSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CashAmount",
                table: "Sales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientName",
                table: "Sales",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "Sales",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "QrAmount",
                table: "Sales",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TicketCode",
                table: "Sales",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CashAmount",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientName",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "QrAmount",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "TicketCode",
                table: "Sales");
        }
    }
}
