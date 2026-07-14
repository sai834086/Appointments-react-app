# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack appointment booking application with two sub-apps:
- **Backend**: Spring Boot REST API (`Backend/appointments/`)
- **Frontend**: React + Vite SPA (`Frontend/my-app/`)

---

## Backend (Spring Boot)

**Stack**: Java 21, Spring Boot 3.5.5, Spring Security, JPA/Hibernate, MySQL, Flyway, JWT (jjwt 0.11.5), MapStruct, Lombok

### Commands

```bash
cd Backend/appointments

# Run the application
./mvnw spring-boot:run

# Build (skip tests)
./mvnw clean package -DskipTests

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=AppointmentsApplicationTests
```

### Configuration

- Server runs on **port 8010**
- Database: MySQL at `localhost:3306/appointments_booking_db`
- JWT config: `jwt.secret` and `jwt.validity` (ms) in `application.properties`
- Flyway migrations are **disabled by default** (`spring.flyway.enabled=false`); schema is managed via `spring.jpa.hibernate.ddl-auto=update`
- Migration scripts are in `src/main/resources/db/migration/` (V1–V8)

### Architecture

Package root: `com.appointments.booking.appointments`

| Layer | Package | Notes |
|---|---|---|
| Controllers | `controller/patner/`, `controller/user/`, `controller/appointment/` | Partner and user/admin are separate subtrees |
| Services (interfaces) | `service/patner/`, `service/user/`, `service/appointment/` | |
| Service Implementations | `serviceimpl/patner/`, `serviceimpl/user/`, `serviceimpl/appointment/` | `AvailabilityGenerator` computes open time slots |
| Models | `model/patner/`, `model/appuser/`, `model/appointment/`, `model/roles/` | |
| Security | `security/` | `JwtUtil`, `JwtAuthenticationFilter`, `JwtUserDetails` |
| DTOs | `payload/request/`, `payload/response/`, `payload/projection/` | Separate request/response objects per domain |
| MapStruct | `mapStruct/` | Entity ↔ DTO mapping |
| Exceptions | `exception/` | `GlobalExceptionHandler` + custom exceptions |

**Domain models**:
- `AppUser` — end users who book appointments
- `PartnerUser` — business owners; have `Property` → `Employee` → `Availability` + `OffTime` + `Services`
- `Appointments` — links AppUser, Employee, Service with date/time and `AppointmentStatus` enum
- `Role` — role-based access (`ROLE_USER`, `ROLE_PARTNER`, `ROLE_ADMIN`, `ROLE_MANAGER`)

**Auth flow**: Both user and partner share the same JWT infrastructure but register/login via separate endpoints (`/register`, `/login` vs `/partnerUser/register`, `/partnerUser/login`). The `JwtAuthenticationFilter` validates tokens on every request.

**Availability logic**: `AvailabilityGenerator` takes an employee's `Availability` schedule, subtracts existing `Appointments` intervals and `OffTime` blocks, and returns open `LocalTime` slots for a given date.

---

## Frontend (React + Vite)

**Stack**: React 19, React Router 7, Axios, Vite 7

### Commands

```bash
cd Frontend/my-app

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

### Environment

Create `Frontend/my-app/.env` from `.env.example`:

```
VITE_REACT_APP_API_URL=http://localhost:8010/appointments
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### Architecture

The app is split into two distinct sub-apps, selected by URL prefix in `RootApp.jsx`:

- `/partner/*` → `PartnerApp.jsx` wrapped in `PartnerAuthProvider`
- All other routes → `UserApp.jsx` wrapped in `UserProvider`

**Source layout**:
```
src/
  main.jsx              # Entry point
  RootApp.jsx           # Route-based app selector
  UserApp.jsx           # User-side route definitions
  PartnerApp.jsx        # Partner-side route definitions
  api/
    api.js              # Axios instance with JWT interceptor (reads token from localStorage)
    authService.js      # Auth API calls
    userService.js      # User-specific API calls
  config/config.js      # Reads VITE_REACT_APP_API_URL
  pages/
    appuserpages/       # User pages + context (UserProvider/UserContext)
    patneruserpages/    # Partner pages + context (PartnerAuthProvider/PartnerAuthContext)
  components/
    usercomponent/      # Shared UI components for user side
    partnercomponent/   # Shared UI components for partner side
```

**Auth**: JWT token stored in `localStorage` under `"token"`. The Axios interceptor in `api.js` auto-attaches `Authorization: Bearer <token>` to all requests except login/register endpoints (matched by exact URL string).

**CSS**: Component-level CSS modules (`.module.css` files alongside components). File name casing must match exactly — mismatches cause build failures on Linux/CI.
