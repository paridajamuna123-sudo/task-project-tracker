# Task & Project Tracker

A Task & Project Tracker web application built with **Angular 22**, **TypeScript (strict mode)**, **RxJS**, and **Reactive Forms**, powered by the [DummyJSON Todos API](https://dummyjson.com).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Run Instructions](#setup--run-instructions)
- [Project Structure](#project-structure)
- [Architectural Decisions](#architectural-decisions)
- [Handled Edge Cases & DummyJSON Quirks](#handled-edge-cases--dummyjson-quirks)
- [Trade-Offs](#trade-offs)
- [Future Improvements](#future-improvements)

---

## Features

- **Dashboard Summary (`/`)**: Reactively computes aggregate metrics (**Total Projects**, **Total Tasks**, **Completed Tasks**, **Pending Tasks**) from shared state using RxJS operators.
- **Projects Overview (`/projects`)**: Fetches trimmed todo metadata (`GET /todos?limit=0&select=userId,completed`) once, groups records client-side by `userId` (e.g., `Project - User 13`), and displays task counts and derived statuses (`Completed`, `In Progress`, `Not Started`).
- **Project Detail & Server-Side Pagination (`/projects/:userId`)**:
  - Fetches tasks per project directly from the server using `GET /todos/user/:userId?limit={n}&skip={n}`.
  - Pagination controls (`Previous` / `Next`) trigger fresh server requests for each page and handle boundary conditions cleanly.
  - **Reactive Form** with validation for adding new tasks:
    - **Task Title**: Required, minimum 3 characters.
    - **Due Date**: Required, cannot be in the past.
    - **Priority**: `Low`, `Medium`, or `High`.
  - Toggle task completion status and delete tasks with a confirmation dialog.
  - **Simulate API Failure (500)** toggle to test and demonstrate optimistic rollback and error recovery.
- **Route Protection**: Uses a functional `CanActivateFn` guard (`projectExistsGuard`) to prevent navigation to invalid or non-existent project IDs.

---

## Tech Stack

- **Framework**: Angular 22 (Standalone Components)
- **Language**: TypeScript (Strict Mode)
- **Async & State Management**: RxJS (`BehaviorSubject`, `Subject`, `switchMap`, `map`, `catchError`, `finalize`, `takeUntilDestroyed`)
- **Forms & Routing**: Angular Reactive Forms, Angular Router with route parameters and functional guards
- **Styling**: Plain SCSS (component-scoped styles with consistent design tokens)
- **Testing**: Vitest (`ng test`) with Angular `HttpTestingController`

---

## Setup & Run Instructions

### Prerequisites

- **Node.js**: v24+ recommended
- **npm**: v11+

### Installation & Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <your-repository-url>
   cd task-project-tracker
   npm install
   ```

2. **Environment configuration**:
   Review `.env.example` at the repository root (no API key is required for DummyJSON):
   ```bash
   cp .env.example .env
   ```
   Base endpoints are configured in `src/environments/environment.ts`:
   - `apiBaseUrl`: `https://dummyjson.com`
   - `failureEndpoint`: `https://dummyjson.com/http/500`

3. **Start the development server**:
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/` in your browser.

4. **Run unit tests**:
   ```bash
   ng test
   ```

5. **Build for production**:
   ```bash
   ng build
   ```
   Production build artifacts are output to `dist/`.

---

## Project Structure

```text
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── project-exists-guard.ts      # Validates :userId before activating detail route
│   │   ├── models/
│   │   │   ├── project.model.ts             # Project & DashboardStats interfaces
│   │   │   └── task.model.ts                # Task, CreateTaskInput & DummyJSON DTO types
│   │   └── services/
│   │       ├── task-project.service.ts      # Centralized HTTP layer, RxJS store & edge cases
│   │       └── task-project.spec.ts         # Service & edge-case unit tests
│   ├── features/
│   │   ├── dashboard/                       # '/' reactive aggregate summary view
│   │   ├── project-list/                    # '/projects' grouped project cards view
│   │   └── project-detail/                  # '/projects/:userId' paginated tasks & form
│   ├── shared/
│   │   └── components/
│   │       ├── confirm-dialog/              # Reusable modal confirmation prompt
│   │       ├── pagination-controls/         # Reusable pager with boundary checks
│   │       ├── scoped-status/               # Scoped loading spinner & error alert banner
│   │       ├── status-badge/                # Reusable priority & status badge
│   │       └── task-card/                   # Reusable task item card
│   ├── app.routes.ts
│   └── app.ts
└── environments/
```

---

## Architectural Decisions

1. **Smart vs. Dumb Component Separation (DRY)**:
   - Feature components (`Dashboard`, `ProjectList`, `ProjectDetail`) act as smart containers connected to `TaskProjectService`.
   - Repeated UI elements (`StatusBadge`, `TaskCard`, `PaginationControls`, `ConfirmDialog`, `ScopedStatus`) are extracted into standalone presentational components communicating strictly via `@Input()` and `@Output()`, keeping them decoupled from parent services and reusable across views.
2. **Centralized Service & Reactive State (`TaskProjectService`)**:
   - All `HttpClient` calls are isolated in `TaskProjectService`—no component makes direct HTTP requests.
   - Shared state is managed via `BehaviorSubject` stores, and aggregate dashboard metrics (`dashboardStats$`) are derived reactively from `projects$` using RxJS `map` so stats stay synchronized across views without duplicated state.
3. **Styling Choice (Plain SCSS)**:
   - Plain component-scoped SCSS was chosen over external UI libraries to keep bundle size minimal, avoid third-party styling overrides, and maintain full control over clean, accessible layout and status styling.
4. **Scoped Loading & Error Handling**:
   - Loading indicators and error banners are scoped to specific operations (project list fetch, paginated task fetch, and task mutations) rather than blocking the entire application with a global spinner.

---

## Handled Edge Cases & DummyJSON Quirks

- **Duplicate-ID Trap on Task Creation**:
  - DummyJSON's `POST /todos/add` endpoint simulates creation without server-side persistence and returns the same mock ID (e.g., `151`) on repeated requests.
  - Each newly created task is assigned a unique client-generated `localId` (`crypto.randomUUID()`), ensuring multiple tasks created in the same session never collide or overwrite one another in local state.
- **Race Conditions on Rapid Pagination / Project Switching**:
  - Page and project change events feed into a `Subject` piped through RxJS `switchMap`, automatically cancelling superseded in-flight HTTP requests so stale responses never overwrite newer data.
- **Optimistic Updates with Automatic Rollback**:
  - Toggling task completion (`PATCH /todos/:id`) and deleting tasks (`DELETE /todos/:id`) update the UI immediately for responsiveness while snapshotting prior state.
  - If the request fails (demonstrable via the **Simulate API failure (500)** toggle pointing to `https://dummyjson.com/http/500`), local task state and aggregate project counts roll back cleanly and display an error alert.
- **Pagination Boundary Handling**:
  - Disables **Next** when `skip + limit >= total`, handles single-page projects cleanly, and displays a clear empty state when a project has zero tasks.

---

## Trade-Offs

- **Client-Side Extended Task Fields**: Because DummyJSON todos only provide `id`, `todo`, `completed`, and `userId`, `priority` and `dueDate` are populated client-side for fetched tasks and stored locally when submitted via the Reactive Form.
- **Session-Scoped Mutations**: Because DummyJSON does not persist `POST`, `PATCH`, or `DELETE` writes on its backend, mutations are reconciled into the in-memory RxJS store and reset on a full browser reload.
- **No Global Client-Side Search/Filter**: DummyJSON's `/todos` endpoint does not support server-side free-text search or status filtering across all records, so pagination remains strictly server-driven.

---

## Future Improvements

- **Task Detail Deep Link (`/tasks/:id`)**: Add a dedicated task detail view backed by `GET /todos/:id`.
- **Page-Scoped Quick Filter**: Add an optional status/search filter clearly scoped to the currently loaded page of tasks.
- **Signals / NgRx Migration**: Explore Angular Signals (`signal`, `computed`, `rxResource`) or NgRx Store if state complexity grows.
- **Drag-and-Drop & E2E Coverage**: Add Angular CDK drag-and-drop reordering and Playwright/Cypress end-to-end tests.