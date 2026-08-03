# Gym & Fitness Club Management — ERD Attributes

12 entities, minimum required. Use this as the source for your ERD design session (draw.io, Lucidchart, dbdiagram.io, whatever the team prefers). Rename/adjust types to match your actual DB provider if needed.

---

## 1. User
Basis for JWT auth. Covers Member, Trainer, and Admin via `Role`.

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| Name | string | |
| Email | string | unique |
| PasswordHash | string | never store plain text |
| Role | enum (Member, Trainer, Admin) | |
| PhoneNumber | string | nullable |
| CreatedAt | DateTime | |
| IsActive | bool | soft-delete flag |

**Relationships:** 1-1 TrainerProfile (only when Role = Trainer) · 1-many Membership · 1-many ClassBooking · 1-many Payment · 1-many Attendance · 1-many WorkoutPlan (as member) · 1-many BodyMetric

---

## 2. TrainerProfile

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | unique, 1-1 |
| BranchId | int (FK → Branch) | |
| Specialization | string | |
| Bio | string | nullable |
| YearsOfExperience | int | |
| CertificationDetails | string | nullable |

**Relationships:** 1-1 User · many-1 Branch · 1-many ClassSchedule · 1-many WorkoutPlan (as trainer)

---

## 3. MembershipPlan

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| Name | string | e.g. Basic, Premium |
| Description | string | nullable |
| DurationInDays | int | |
| Price | double | |
| MaxClassesPerMonth | int | nullable, for tier limits |
| IsActive | bool | |

**Relationships:** 1-many Membership

---

## 4. Membership

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | |
| MembershipPlanId | int (FK → MembershipPlan) | |
| StartDate | DateTime | |
| EndDate | DateTime | |
| Status | enum (Active, Expired, Cancelled) | |
| CreatedAt | DateTime | |

**Relationships:** many-1 User · many-1 MembershipPlan · 1-many Payment

---

## 5. ClassSchedule

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| ClassName | string | |
| TrainerProfileId | int (FK → TrainerProfile) | |
| BranchId | int (FK → Branch) | |
| StartTime | DateTime | |
| EndTime | DateTime | |
| Capacity | int | |

**Relationships:** many-1 TrainerProfile · many-1 Branch · 1-many ClassBooking

---

## 6. ClassBooking
Acts as the junction between User and ClassSchedule (many-to-many with extra attributes).

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | |
| ClassScheduleId | int (FK → ClassSchedule) | |
| BookingDate | DateTime | |
| Status | enum (Booked, Cancelled, Attended) | |

**Relationships:** many-1 User · many-1 ClassSchedule

---

## 7. Equipment

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| Name | string | |
| BranchId | int (FK → Branch) | |
| PurchaseDate | DateTime | |
| MaintenanceStatus | enum (Operational, UnderMaintenance, Retired) | |
| Quantity | int | |

**Relationships:** many-1 Branch

---

## 8. Payment

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | |
| MembershipId | int (FK → Membership) | nullable |
| Amount | double | |
| PaymentDate | DateTime | |
| PaymentMethod | enum (Card, Cash, Transfer) | |
| Status | enum (Pending, Completed, Failed, Refunded) | |

**Relationships:** many-1 User · many-1 Membership

---

## 9. Attendance

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | |
| BranchId | int (FK → Branch) | |
| Date | DateTime | |
| CheckInTime | DateTime | |
| CheckOutTime | DateTime | nullable |

**Relationships:** many-1 User · many-1 Branch

---

## 10. WorkoutPlan

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | member the plan belongs to |
| TrainerProfileId | int (FK → TrainerProfile) | nullable, who designed it |
| Title | string | |
| Description | string | nullable |
| StartDate | DateTime | |
| EndDate | DateTime | nullable |

**Relationships:** many-1 User · many-1 TrainerProfile

---

## 11. BodyMetric

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| UserId | int (FK → User) | |
| Date | DateTime | |
| WeightKg | double | |
| HeightCm | double | |
| BodyFatPercentage | double | nullable |
| MuscleMassKg | double | nullable |

**Relationships:** many-1 User

---

## 12. Branch

| Field | Type | Notes |
|---|---|---|
| Id | int (PK) | |
| Name | string | |
| Address | string | |
| City | string | |
| Phone | string | |
| OpeningHours | string | |

**Relationships:** 1-many TrainerProfile · 1-many ClassSchedule · 1-many Equipment · 1-many Attendance

---

## Relationship Summary (for the diagram)

- User (1) → (0..1) TrainerProfile
- User (1) → (many) Membership
- User (1) → (many) ClassBooking
- User (1) → (many) Payment
- User (1) → (many) Attendance
- User (1) → (many) WorkoutPlan
- User (1) → (many) BodyMetric
- Branch (1) → (many) TrainerProfile, ClassSchedule, Equipment, Attendance
- MembershipPlan (1) → (many) Membership
- Membership (1) → (many) Payment
- TrainerProfile (1) → (many) ClassSchedule, WorkoutPlan
- ClassSchedule (1) → (many) ClassBooking
- User ↔ ClassSchedule = many-to-many, resolved through ClassBooking
