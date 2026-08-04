using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GFCM.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "branches",
                columns: table => new
                {
                    branchId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    branchName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    branchAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    branchCity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    branchPhone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    openingHours = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.branchId);
                });

            migrationBuilder.CreateTable(
                name: "membershipPlans",
                columns: table => new
                {
                    membershipPlanId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    planName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    planDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    durationInDays = table.Column<int>(type: "int", nullable: false),
                    planPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    maxClassesPerMonth = table.Column<int>(type: "int", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_membershipPlans", x => x.membershipPlanId);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    userId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    userName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    passwordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    role = table.Column<int>(type: "int", nullable: false),
                    phoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.userId);
                });

            migrationBuilder.CreateTable(
                name: "equipment",
                columns: table => new
                {
                    equipmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    equipmentName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    purchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    maintenanceStatus = table.Column<int>(type: "int", nullable: false),
                    branchId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment", x => x.equipmentId);
                    table.ForeignKey(
                        name: "FK_equipment_branches_branchId",
                        column: x => x.branchId,
                        principalTable: "branches",
                        principalColumn: "branchId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "attendances",
                columns: table => new
                {
                    attendanceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    userId = table.Column<int>(type: "int", nullable: false),
                    branchId = table.Column<int>(type: "int", nullable: false),
                    attendanceDate = table.Column<DateTime>(type: "date", nullable: false),
                    checkInTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    checkOutTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendances", x => x.attendanceId);
                    table.ForeignKey(
                        name: "FK_attendances_branches_branchId",
                        column: x => x.branchId,
                        principalTable: "branches",
                        principalColumn: "branchId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_attendances_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bodyMetrics",
                columns: table => new
                {
                    bodyMetricId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    userId = table.Column<int>(type: "int", nullable: false),
                    metricDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    weightKg = table.Column<double>(type: "float", nullable: false),
                    heightCm = table.Column<double>(type: "float", nullable: false),
                    bodyFatPercentage = table.Column<double>(type: "float", nullable: true),
                    muscleMassKg = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bodyMetrics", x => x.bodyMetricId);
                    table.ForeignKey(
                        name: "FK_bodyMetrics_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "memberships",
                columns: table => new
                {
                    membershipId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    userId = table.Column<int>(type: "int", nullable: false),
                    membershipPlanId = table.Column<int>(type: "int", nullable: false),
                    startDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    endDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    membershipStatus = table.Column<int>(type: "int", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_memberships", x => x.membershipId);
                    table.ForeignKey(
                        name: "FK_memberships_membershipPlans_membershipPlanId",
                        column: x => x.membershipPlanId,
                        principalTable: "membershipPlans",
                        principalColumn: "membershipPlanId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_memberships_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trainerProfiles",
                columns: table => new
                {
                    trainerProfileId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    userId = table.Column<int>(type: "int", nullable: false),
                    branchId = table.Column<int>(type: "int", nullable: false),
                    specialization = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    bio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    yearsOfExperience = table.Column<int>(type: "int", nullable: false),
                    certificationDetails = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trainerProfiles", x => x.trainerProfileId);
                    table.ForeignKey(
                        name: "FK_trainerProfiles_branches_branchId",
                        column: x => x.branchId,
                        principalTable: "branches",
                        principalColumn: "branchId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_trainerProfiles_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    paymentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    paymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    paymentMethod = table.Column<int>(type: "int", nullable: false),
                    paymentStatus = table.Column<int>(type: "int", nullable: false),
                    userId = table.Column<int>(type: "int", nullable: false),
                    membershipId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.paymentId);
                    table.ForeignKey(
                        name: "FK_payments_memberships_membershipId",
                        column: x => x.membershipId,
                        principalTable: "memberships",
                        principalColumn: "membershipId");
                    table.ForeignKey(
                        name: "FK_payments_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "classSchedules",
                columns: table => new
                {
                    classScheduleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    className = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    trainerProfileId = table.Column<int>(type: "int", nullable: false),
                    branchId = table.Column<int>(type: "int", nullable: false),
                    startTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    endTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    capacity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_classSchedules", x => x.classScheduleId);
                    table.ForeignKey(
                        name: "FK_classSchedules_branches_branchId",
                        column: x => x.branchId,
                        principalTable: "branches",
                        principalColumn: "branchId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_classSchedules_trainerProfiles_trainerProfileId",
                        column: x => x.trainerProfileId,
                        principalTable: "trainerProfiles",
                        principalColumn: "trainerProfileId",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "workoutPlans",
                columns: table => new
                {
                    workoutPlanId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    planTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    userId = table.Column<int>(type: "int", nullable: false),
                    trainerProfileId = table.Column<int>(type: "int", nullable: true),
                    planDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    startDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    endDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workoutPlans", x => x.workoutPlanId);
                    table.ForeignKey(
                        name: "FK_workoutPlans_trainerProfiles_trainerProfileId",
                        column: x => x.trainerProfileId,
                        principalTable: "trainerProfiles",
                        principalColumn: "trainerProfileId");
                    table.ForeignKey(
                        name: "FK_workoutPlans_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "classBookings",
                columns: table => new
                {
                    userId = table.Column<int>(type: "int", nullable: false),
                    classScheduleId = table.Column<int>(type: "int", nullable: false),
                    bookingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    bookingStatus = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_classBookings", x => new { x.userId, x.classScheduleId });
                    table.ForeignKey(
                        name: "FK_classBookings_classSchedules_classScheduleId",
                        column: x => x.classScheduleId,
                        principalTable: "classSchedules",
                        principalColumn: "classScheduleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_classBookings_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_attendances_branchId",
                table: "attendances",
                column: "branchId");

            migrationBuilder.CreateIndex(
                name: "IX_attendances_userId",
                table: "attendances",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_bodyMetrics_userId",
                table: "bodyMetrics",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_classBookings_classScheduleId",
                table: "classBookings",
                column: "classScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_classSchedules_branchId",
                table: "classSchedules",
                column: "branchId");

            migrationBuilder.CreateIndex(
                name: "IX_classSchedules_trainerProfileId",
                table: "classSchedules",
                column: "trainerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_branchId",
                table: "equipment",
                column: "branchId");

            migrationBuilder.CreateIndex(
                name: "IX_memberships_membershipPlanId",
                table: "memberships",
                column: "membershipPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_memberships_userId",
                table: "memberships",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_membershipId",
                table: "payments",
                column: "membershipId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_userId",
                table: "payments",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_trainerProfiles_branchId",
                table: "trainerProfiles",
                column: "branchId");

            migrationBuilder.CreateIndex(
                name: "IX_trainerProfiles_userId",
                table: "trainerProfiles",
                column: "userId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workoutPlans_trainerProfileId",
                table: "workoutPlans",
                column: "trainerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_workoutPlans_userId",
                table: "workoutPlans",
                column: "userId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "attendances");

            migrationBuilder.DropTable(
                name: "bodyMetrics");

            migrationBuilder.DropTable(
                name: "classBookings");

            migrationBuilder.DropTable(
                name: "equipment");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "workoutPlans");

            migrationBuilder.DropTable(
                name: "classSchedules");

            migrationBuilder.DropTable(
                name: "memberships");

            migrationBuilder.DropTable(
                name: "trainerProfiles");

            migrationBuilder.DropTable(
                name: "membershipPlans");

            migrationBuilder.DropTable(
                name: "branches");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
