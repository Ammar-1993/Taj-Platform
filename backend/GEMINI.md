# Taj Backend (Laravel 12) - Instructions & Conventions

This file provides specialized guidance for the Laravel backend of the Taj Educational Platform.

## 🏛 Architectural Patterns

### 1. Service Layer
- **Mandate:** Business logic MUST reside in the `app/Services` directory (e.g., `BookingService.php`, `WalletService.php`).
- **Rationale:** Controllers should remain lean, handling only request validation and response formatting. Services handle complex transactions, database locking (`lockForUpdate`), and external API calls.

### 2. API Design
- **Versioning:** All API routes must be prefixed with `v1` in `routes/api.php`.
- **Responses:** Use consistent JSON structures:
  ```json
  {
    "status": "success",
    "message": "Human readable message (Arabic preferred)",
    "data": { ... }
  }
  ```
- **Authentication:** Use `Laravel Sanctum`. Protected routes must use the `auth:sanctum` middleware.

### 3. Admin Panel (Filament v3)
- **Localization:** All `modelLabel`, `pluralModelLabel`, and field `label()` values must be in **Arabic**.
- **Organization:** Use `navigationGroup` and `navigationSort` to keep the sidebar logical.
- **Security:** Ensure `canAccessPanel` in the `User` model strictly checks for the `admin` role.

---

## 🛠 Coding Standards

- **PHP Version:** 8.3+ features are encouraged (readonly properties, constructor promotion, typed constants).
- **Naming:** 
    - Variables/Methods: `camelCase`.
    - Classes/Models: `PascalCase`.
    - Database Tables/Columns: `snake_case`.
- **Linting:** Run `./vendor/bin/pint` before committing changes to ensure PSR-12 compliance.

---

## 🔐 Security & Transactions

- **Database Integrity:** Always use `DB::transaction` for operations involving multiple table updates (e.g., Booking + Wallet Transaction).
- **Concurrency:** Use `lockForUpdate()` when querying slots or wallets during a transaction to prevent race conditions.
- **Validation:** Use `FormRequest` classes for complex validation logic; use `$request->validate()` in controllers for simple cases.

---

## 🧪 Testing Protocol

- **Framework:** PHPUnit (as configured in `phpunit.xml`).
- **Coverage:**
    - **Unit Tests:** For isolated service logic (e.g., `WalletServiceUnitTest`).
    - **Feature Tests:** For end-to-end API endpoints (e.g., `BookingLifecycleTest`).
- **Command:** `php artisan test`
- **Rule:** Every bug fix must include a regression test. Every new feature must have at least 80% logic coverage.

---

## 📦 Database & Seeding

- **Migrations:** Always include `down()` methods.
- **Seeders:** Maintain `MasterDataSeeder` for Subjects and Grade Levels. Ensure `RolesAndPermissionsSeeder` is the first to run.
- **Factories:** Maintain `UserFactory` and others for robust testing.
