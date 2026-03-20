# Copilot Instructions for AI Agents

## Project Overview

- **Frontend:** React (with Vite for build/dev)
- **Backend Integration:** Communicates with a Spring Boot backend (see example controller below)
- **Main UI Structure:**
  - Partner and User flows are separated in `src/pages/patneruserpages/` and `src/pages/userpages/`.
  - Shared components are in `src/components/` (modals, headers, icons).
  - API calls are abstracted in `src/api/` (use `authService.js` and `userService.js` for backend communication).
- **State Management:**
  - Context providers for authentication and user state are in `src/pages/patneruserpages/context/` and `src/pages/userpages/context/`.

## Developer Workflows

- **Start Dev Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Lint:** `npm run lint`
- **Preview Build:** `npm run preview`
- **No built-in test scripts.**

## Key Patterns & Conventions

- **Modals:** Use props for open/close and submit handlers. See `PropertyRegister` and `AddEmployeeModal` for examples.
- **Validation:** Frontend validation matches backend rules (see `PropertyRegister-README.md` for field patterns).
- **Routing:** Uses `react-router-dom`. Protected routes are implemented via `ProtectedRoute.jsx` and `ProtectedPartnerRoute.jsx`.
- **Styling:** CSS Modules (e.g., `Component.module.css`).
- **Icons:** Use FontAwesome and Lucide React icons.
- **API:** Use `axios` for HTTP requests. Centralize API logic in `src/api/`.
- **Error Handling:** Display errors in modals/forms. Backend errors are surfaced to users.

## Integration Points

- **Backend:** All API calls go through `authService.js` and `userService.js`.
- **Spring Boot Example:**
  - User registration: `POST /appointments/registerUser` (see backend `UserController`)
  - User login: `POST /appointments/loginUser` (returns JWT in response payload)
- **Form Validation:** Strictly follow backend annotation patterns for user and property registration.

## Examples

- **Register Property:** See `PropertyRegister-README.md` and `PropertyRegister.jsx` for usage and validation rules.
- **Context Usage:** See `PartnerAuthProvider.jsx` and `UserProvider.jsx` for context setup and consumption.

## Directory References

- `src/components/partnercomponent/` — Partner-specific UI components
- `src/components/partnercomponent/dashboardcomponents/` — Dashboard icons/components
- `src/pages/patneruserpages/context/` — Partner context providers
- `src/pages/userpages/context/` — User context providers
- `src/api/` — API service modules

---

**For unclear or missing conventions, ask the user for clarification before making assumptions.**
