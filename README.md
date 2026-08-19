# Gym & Fitness Club Management

A full-stack gym management system: an ASP.NET Core REST API backed by SQL Server, with a Bootstrap front end served from the same origin.

It covers the day-to-day running of a multi-branch fitness club: registering members, selling and renewing memberships, taking payments, scheduling classes and bookings, tracking gym check-ins, logging body measurements, assigning workout plans, and managing equipment and staff across branches.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [API](#api)
- [Authentication and roles](#authentication-and-roles)
- [Front end](#front-end)
- [Business rules](#business-rules)
- [Code conventions](#code-conventions)

---

## Features

| Area | What it does |
|---|---|
| **Users** | Registration with hashed passwords, role assignment, soft delete (deactivate rather than remove) |
| **Trainers** | Trainer profiles linked to a user and a branch, with specialization and experience; transfer between branches |
| **Branches** | Multiple locations with addresses, phone numbers and opening hours; staff counts per branch |
| **Membership plans** | Priced tiers with a duration in days and a monthly class allowance; retire a plan without deleting it |
| **Memberships** | Enrol a member on a plan, renew by adding days, cancel; end dates are calculated by the server |
| **Payments** | Record payments against a member and optionally a membership, confirm or fail them, and report revenue |
| **Class schedules** | Classes with a trainer, branch, time slot and capacity; reassign a trainer without recreating the class |
| **Class bookings** | Book a member into a class, move them to another class, cancel, or mark them attended |
| **Attendance** | Check-in and check-out with duration, a live "currently in the gym" view, and per-branch daily averages |
| **Body metrics** | Weight, height, body fat and muscle mass over time, with a per-member progress summary |
| **Workout plans** | Programmes assigned to a member, optionally written by a trainer, with open-ended or fixed end dates |
| **Equipment** | Per-branch inventory with quantities, purchase dates and a maintenance status |
| **Dashboard** | Six live report blocks summarising revenue, members, expiring memberships, plans, equipment and attendance |
| **Email** | Transactional notifications for membership activation, cancellation, renewal reminders, booking confirmations and payment receipts |

---

## Tech stack

**Backend**

- ASP.NET Core (.NET 10) Web API
- Entity Framework Core 10 with SQL Server
- JWT bearer authentication
- BCrypt.Net for password hashing
- MailKit for SMTP email
- Swashbuckle / Swagger UI for API documentation

**Frontend**

- Static HTML served from `wwwroot`, on the same origin as the API
- Bootstrap 5.3 from CDN, plus one shared stylesheet
- Plain JavaScript, with no framework, no build step and no bundler

---

## Getting started

### Prerequisites

- .NET 10 SDK
- SQL Server (Express is fine) or LocalDB
- Visual Studio 2022+ (optional, the CLI works just as well)
- `dotnet-ef` tools, if you are using the CLI and need to create or apply migrations:

  ```bash
  dotnet tool install --global dotnet-ef
  ```

  Not needed in Visual Studio: the Package Manager Console already has the EF commands.

### 1. Configure

Edit `GFCM/appsettings.json`:

```jsonc
{
  "ConnectionStrings": {
    // point this at your SQL Server instance
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=GymDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "<at least 32 characters, random>",
    "Issuer": "GymManagementApi",
    "Audience": "GymManagementClient",
    "ExpiryMinutes": 60
  },
  "EmailConfiguration": {
    "From": "REPLACE_ME",
    "SenderName": "Gym & Fitness Club",
    "SmtpServer": "smtp.ethereal.email",
    "Port": 587,
    "UserName": "REPLACE_ME",
    "Password": "REPLACE_ME"
  }
}
```

The JWT key is required and must be at least 32 characters, and startup throws without it. The email settings can stay as placeholders; only the notification features use them.

### 2. Create the database

**Visual Studio**: open `GFCM.slnx`, then go to
*Tools → NuGet Package Manager → Package Manager Console* and run:

```powershell
Update-Database
```

**Command line**: from the repository root:

```bash
cd GFCM
dotnet ef database update
```

Either way applies the existing migrations and creates `GymDB` with all twelve tables.

### 3. Run

**Visual Studio**: press **F5** (or Ctrl+F5 to run without debugging). The `https`
profile starts the app on `https://localhost:7130` and opens Swagger automatically.

**Command line**:

```bash
cd GFCM
dotnet run
```

Either way, these are the two places to look:

- **`/`**: the web app (redirects to the login page when signed out)
- **`/swagger`**: interactive API documentation, development environment only

### 4. Create the first account

Open `/register.html` and create an account with the role **Admin**. Registration is the only anonymous write endpoint, so the first account has to be made there. Admin matters because the Users and Payments sections are admin-only.

---

## Project structure

```
Gym-Fitness-Club-Management/
├── ERD.png                     entity relationship diagram
├── ErdMapping.png              relational mapping
└── GFCM/
    ├── Controllers/            one controller per resource, 13 in total
    ├── Models/                 entities, enums and the two input-only classes
    ├── Migrations/             EF Core migrations
    ├── Services/               JWT token generation and SMTP email
    ├── ProjectContext.cs       the DbContext, one DbSet per entity
    ├── Program.cs              DI, JWT pipeline, Swagger, static files
    ├── appsettings.json        connection string, JWT and email settings
    └── wwwroot/
        ├── index.html          dashboard
        ├── login.html
        ├── register.html
        ├── css/site.css        the single shared stylesheet
        ├── js/                 one script per page, plus shared helpers
        └── pages/              the twelve management pages
```

The layout is deliberately flat: no `Data/` folder, no `Dtos/` folder, no repository layer. Controllers use the `DbContext` directly.

---

## Data model

Twelve entities. The original design diagrams are at the repository root: `ERD.png`
(Chen notation) and `ErdMapping.png` (relational mapping). The two diagrams below
are the same thing as built, using the implemented property names.

### Entity relationship diagram

```mermaid
erDiagram
    User ||--o| TrainerProfile : "has a profile"
    User ||--o{ Membership : holds
    User ||--o{ Payment : makes
    User ||--o{ Attendance : "checks in"
    User ||--o{ ClassBooking : books
    User ||--o{ BodyMetric : "is measured by"
    User ||--o{ WorkoutPlan : follows

    Branch ||--o{ TrainerProfile : employs
    Branch ||--o{ ClassSchedule : hosts
    Branch ||--o{ Equipment : stocks
    Branch ||--o{ Attendance : records

    MembershipPlan ||--o{ Membership : "is sold as"
    Membership |o--o{ Payment : "is paid by"

    TrainerProfile ||--o{ ClassSchedule : teaches
    TrainerProfile |o--o{ WorkoutPlan : designs

    ClassSchedule ||--o{ ClassBooking : "is booked by"

    User {
        int userId PK
        string userName
        string email
        string passwordHash "never returned"
        UserRole role "Admin, Trainer, Member"
        string phoneNumber
        DateTime createdAt
        bool isActive "soft delete flag"
    }

    Branch {
        int branchId PK
        string branchName
        string branchAddress
        string branchCity
        string branchPhone
        string openingHours
    }

    TrainerProfile {
        int trainerProfileId PK
        int userId FK "one profile per user"
        int branchId FK
        string specialization
        string bio
        int yearsOfExperience
        string certificationDetails
    }

    MembershipPlan {
        int membershipPlanId PK
        string planName
        string planDescription
        int durationInDays
        decimal planPrice
        int maxClassesPerMonth
        bool isActive "false means retired"
    }

    Membership {
        int membershipId PK
        int userId FK
        int membershipPlanId FK
        DateTime startDate
        DateTime endDate "startDate plus the plan duration"
        MembershipStatus membershipStatus "Active, Expired, Cancelled"
        DateTime createdAt
    }

    Payment {
        int paymentId PK
        int userId FK
        int membershipId FK "nullable"
        decimal amount
        DateTime paymentDate
        PaymentMethod paymentMethod "Card, Cash, Transfer"
        PaymentStatus paymentStatus "Pending, Completed, Failed, Refunded"
    }

    ClassSchedule {
        int classScheduleId PK
        string className
        int trainerProfileId FK
        int branchId FK
        DateTime startTime
        DateTime endTime
        int capacity
    }

    ClassBooking {
        int userId PK "also a foreign key"
        int classScheduleId PK "also a foreign key"
        DateTime bookingDate
        BookingStatus bookingStatus "Booked, Cancelled, Attended"
    }

    Equipment {
        int equipmentId PK
        string equipmentName
        int branchId FK
        int quantity
        DateTime purchaseDate
        EquipmentStatus maintenanceStatus "Operational, UnderMaintenance, Retired"
    }

    Attendance {
        int attendanceId PK
        int userId FK
        int branchId FK
        DateTime attendanceDate "date only, no time part"
        DateTime checkInTime
        DateTime checkOutTime "nullable, null means still inside"
    }

    BodyMetric {
        int bodyMetricId PK
        int userId FK
        DateTime metricDate
        double weightKg
        double heightCm
        double bodyFatPercentage "nullable"
        double muscleMassKg "nullable"
    }

    WorkoutPlan {
        int workoutPlanId PK
        int userId FK "the member it belongs to"
        int trainerProfileId FK "nullable, null means self written"
        string planTitle
        string planDescription
        DateTime startDate
        DateTime endDate "nullable, null means open ended"
    }
```

### Relational mapping

The twelve tables as EF Core creates them, with every foreign key labelled by the
column that carries it.

```mermaid
flowchart LR
    users["<b>users</b><br>PK userId"]
    branches["<b>branches</b><br>PK branchId"]
    membershipPlans["<b>membershipPlans</b><br>PK membershipPlanId"]
    trainerProfiles["<b>trainerProfiles</b><br>PK trainerProfileId"]
    memberships["<b>memberships</b><br>PK membershipId"]
    payments["<b>payments</b><br>PK paymentId"]
    classSchedules["<b>classSchedules</b><br>PK classScheduleId"]
    classBookings["<b>classBookings</b><br>PK userId + classScheduleId"]
    attendances["<b>attendances</b><br>PK attendanceId"]
    equipment["<b>equipment</b><br>PK equipmentId"]
    bodyMetrics["<b>bodyMetrics</b><br>PK bodyMetricId"]
    workoutPlans["<b>workoutPlans</b><br>PK workoutPlanId"]

    trainerProfiles -->|userId| users
    trainerProfiles -->|branchId| branches
    memberships -->|userId| users
    memberships -->|membershipPlanId| membershipPlans
    payments -->|userId| users
    payments -.->|"membershipId (nullable)"| memberships
    classSchedules -->|trainerProfileId| trainerProfiles
    classSchedules -->|branchId| branches
    classBookings -->|userId| users
    classBookings -->|classScheduleId| classSchedules
    attendances -->|userId| users
    attendances -->|branchId| branches
    equipment -->|branchId| branches
    bodyMetrics -->|userId| users
    workoutPlans -->|userId| users
    workoutPlans -.->|"trainerProfileId (nullable)"| trainerProfiles
```

Solid arrows are required foreign keys, dotted arrows are optional ones.

Relationships worth knowing:

- **TrainerProfile** is the join between a user and a branch. A user with the Trainer role is not yet a trainer, because classes are scheduled against the profile, not the user.
- **ClassBooking** has a composite primary key of `userId` + `classScheduleId`, so the same member cannot be booked into one class twice.
- **Payment.membershipId** is nullable, so a payment can exist without a membership.
- **WorkoutPlan.trainerProfileId** is nullable, where null means the member wrote the plan themselves.
- **Attendance.checkOutTime** is nullable, where null means the member is in the gym right now. That is what the live view and the open-session guard both read.

Every fixed set of values is an enum, so a typo can never reach the database: `UserRole`, `MembershipStatus`, `PaymentMethod`, `PaymentStatus`, `EquipmentStatus`, `BookingStatus`.

---

## API

98 endpoints across 13 controllers. Every resource controller has the same eight-endpoint shape, so learning one teaches you all of them:

| Verb | Route | Purpose |
|---|---|---|
| `POST` | `/{resource}/add` | create |
| `PUT` | `/{resource}/update` | full update |
| `PATCH` | `/{resource}/update…` | one targeted field |
| `DELETE` | `/{resource}/remove` | delete, **Admin only** |
| `GET` | `/{resource}/getAll` | list |
| `GET` | `/{resource}/get` | one by id |
| `GET` | `/{resource}/get…` | filtered search |
| `GET` | `/{resource}/count…` | aggregate report |

### Resources

| Route prefix | Targeted update | Search | Report |
|---|---|---|---|
| `/auth` | n/a | n/a | `POST /auth/login` |
| `/user` | `updateRole` | `getByRole` | `countByRole` |
| `/trainerprofile` | `updateBranch` | `getBySpecialization` | `getByExperience` |
| `/branch` | `updateHours` | `getByCity` | `staffCount` |
| `/membershipplan` | `updateStatus` | `getByPrice` | `getPopular` |
| `/membership` | `updateStatus` | `getExpiring` | `countByPlan` |
| `/payment` | `updateStatus` | `getByDate` | `totalRevenue` |
| `/classschedule` | `updateTrainer` | `getByDate` | `getBookingCount` |
| `/classbooking` | `updateStatus` | `getByUser`, `getByStatus` | `countByClass` |
| `/attendance` | `updateCheckOut` | `getByDate` | `averagePerBranch` |
| `/bodymetric` | `updateWeight` | `getByUser` | `getSummary` |
| `/workoutplan` | `updateTrainer` | `getByUser` | `getActive` |
| `/equipment` | `updateStatus` | `getByBranch` | `countByStatus` |

Full request and response shapes are in Swagger at `/swagger` while running in development.

---

## Authentication and roles

- `POST /auth/login` verifies the email and the BCrypt password hash, checks the account is active, and returns a JWT valid for two hours.
- The token carries the user id, email and role as claims.
- Every controller is `[Authorize]` by default. Two endpoints are open: `POST /auth/login` and `POST /user/add`, so a new user can register.
- Every `DELETE` endpoint is `[Authorize(Roles = "Admin")]`.
- The front end keeps the token in `localStorage` and sends it as a `Bearer` header on every request. A `401` clears the token and returns to the login page.
- The navigation bar is built from the stored role, so admin-only sections do not render for other users. That is convenience, not security. The API enforces the real rules.

Three roles: **Admin**, **Trainer**, **Member**.

---

## Front end

No framework and no build step. Every page loads Bootstrap, the shared stylesheet, and its own script.

Shared scripts:

| File | Responsibility |
|---|---|
| `js/api.js` | `fetch` wrapper that attaches the token, parses the response and throws on failure |
| `js/auth.js` | login, registration, logout, and the `requireAuth()` route guard |
| `js/nav.js` | builds the navigation bar and hides admin-only links |
| `js/ui.js` | toasts, confirm dialogs, status badges, date and money formatting |

Each management page has one matching script: `pages/branch.html` with `js/branch.js`, and so on. All of them follow the same pattern: a filter bar, a table, and Bootstrap modals for create and edit.

One thing to know when reading the page scripts: the aggregate report endpoints project into anonymous objects, which drops the string enum converter, so enums arrive from those endpoints as numbers. The pages that read them map the numbers back to names.

---

## Business rules

The rules live in the controllers, not in the forms, so the same checks apply whether a request comes from the web app or straight from Swagger.

- A member cannot check in twice without checking out first
- A class cannot be booked past its capacity, and capacity cannot be lowered below the number of existing bookings
- A trainer cannot have two classes in overlapping time slots
- A branch cannot be deleted while trainers, classes or equipment reference it
- A completed payment cannot be edited or deleted
- A retired plan cannot be sold
- A cancelled membership cannot be renewed
- A membership with payment history cannot be deleted, only cancelled
- A trainer cannot be removed until their classes are reassigned
- Equipment cannot take a future purchase date or a negative quantity
- A class must end after it starts, and a workout plan cannot end before it starts
- Deactivating a user keeps the row and blocks login, instead of deleting history

Membership end dates, attendance durations and revenue totals are always calculated on the server, never sent by the client.

---

## Code conventions

The codebase follows one style throughout:

- **camelCase properties**, prefixed with the entity name where it aids clarity (`userId`, `branchName`, `planPrice`). Class names stay PascalCase.
- **Relationships are declared on the model** with data annotations: `[Key]`, `[Required]`, `[ForeignKey]`, `[InverseProperty]`, `[PrimaryKey]`. There is no Fluent API and no `OnModelCreating` body.
- **`[JsonIgnore]` replaces DTOs.** Primary keys and navigation properties are hidden in both directions, so a client never sends an id and a response never loops through relationships. Endpoints that need related data project it explicitly into an anonymous object.
- **Two input-only classes**, `UserRegister` and `UserLogin`, exist only because a password must be receivable but never returnable. They are the sole exception to binding entities directly.
- **Enums with `JsonStringEnumConverter`**, so a status reads as `"Active"` rather than `0` in responses and in Swagger.

---

## Notes

- `appsettings.json` ships with placeholder credentials. Replace the JWT key and the email settings before running anywhere but a local machine.
- Swagger is mapped only in the development environment.
- The API and the front end share an origin, so no CORS configuration is needed.
