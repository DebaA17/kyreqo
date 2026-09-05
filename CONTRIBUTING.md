# Contributing to Kyreqo

Welcome to the Kyreqo codebase! Thank you for contributing. This document provides guidelines for contributing to Kyreqo, including local setup, code standards, testing, and security.

---

## 🛠️ Tech Stack & Setup

Kyreqo is split into:

- **Backend**: Django REST Framework + PostgreSQL
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (using **`pnpm`** as the package manager)

All development scripts should be run from the repository root using the workspace shortcuts defined in the root `package.json`.
> [!NOTE]
> The command-line setup instructions below are specifically written for **Linux and macOS**. For **Windows**, adjust commands accordingly (e.g., using `python` instead of `python3` and backslashes for paths).

### Backend Local Setup

1. **Create the Python virtual environment**:
   ```bash
   python3 -m venv backend/venv
   ```
2. **Install dependencies**:
   ```bash
   backend/venv/bin/pip install -r backend/requirements.txt
   ```
3. **Run database migrations**:
   ```bash
   pnpm backend:migrate
   ```
4. **Start the Django development server**:
   ```bash
   pnpm backend
   ```

> [!TIP]
> Once the backend is running, interactive Swagger/ReDoc API documentation is available locally at [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/). The production version is available at [https://kyreqo.vercel.app/api/docs/](https://kyreqo.vercel.app/api/docs/). Use these to explore and test endpoints while developing.


### Frontend Local Setup

1. **Install dependencies using `pnpm`**:
   ```bash
   pnpm install
   ```
2. **Start the frontend development server**:
   ```bash
   pnpm frontend
   ```

### Docker Local Setup (Alternative)

If you prefer to run the entire stack (Frontend, Backend, and PostgreSQL database) fully containerized, you can use Docker Compose.

1. **Start all services**:

   ```bash
   docker compose up --build
   ```

   _This will build the local Docker images, run migrations automatically, and start:_
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)

2. **Stop the environment**:
   ```bash
   docker compose down
   ```

---


## 🧪 Testing & Code Quality

### Frontend Unit & Component Tests

Frontend tests are run using **Vitest**. To run the full test suite locally:

```bash
pnpm frontend:test
```

> [!NOTE]
> Vitest is configured with `maxWorkers: 1` and `fileParallelism: false`, meaning tests run on a single worker instead of in parallel. This is intentional to keep the test run **CPU and memory efficient** across all development machines. Please don't override this configuration in your PRs.

> [!WARNING]
> **Mocking custom hooks (e.g. `useEnvironmentStore`)**: If a mock's return value includes an array or object, define it as a **stable reference outside the mock function call** rather than inline. Inline arrays/objects are recreated on every render, which can trigger **infinite render loops** in components that depend on referential equality (e.g. inside a `useEffect` dependency array).
>
> ```ts
> // ❌ Avoid: new array reference on every call
> vi.mock("@/store/useEnvironmentStore", () => ({
>   useEnvironmentStore: () => ({ variables: [] }),
> }));
>
> // ✅ Do: stable reference defined outside the mock
> const mockVariables = [];
> vi.mock("@/store/useEnvironmentStore", () => ({
>   useEnvironmentStore: () => ({ variables: mockVariables }),
> }));
> ```

### Linting & Formatting

Before opening a PR, make sure your code passes lint and formatting checks:

- **Run lint checks**:
```bash
  pnpm lint
```
- **Check formatting (Prettier)**:
```bash
  pnpm format:check
```
- **Auto-format your code**:
```bash
  pnpm format
```

---


## 🔒 Security Practices & Auditing

Security is a core focus of Kyreqo, especially preventing Server-Side Request Forgery (SSRF) and dependency vulnerabilities.

### 1. Python Security Linter (`bandit`)

We use `bandit` to scan Python code for security issues.

- **Run Bandit scan**:
  ```bash
  backend/venv/bin/bandit -r backend/apps/ -x "**/tests.py"
  ```
  _Ensure you resolve any High/Medium severity findings before creating a Pull Request._

### 2. Frontend Dependency Audit

- Use `pnpm audit` to check for security vulnerabilities in frontend node packages:
  ```bash
  pnpm audit
  ```

---

## 🎨 General UI Contribution Rules

Any Pull Request that **modifies or introduces UI changes** must include:

- **Screenshots or screen recordings** of the changes in **both Desktop and Mobile viewports**.

This is required to verify responsiveness, layout alignment, and to catch any visual regressions before merge. PRs with UI changes but no viewport evidence will be sent back for revision.

---

## 🌿 Git Workflow & Branches

### ⚠️ IMPORTANT: Issue Assignment Rule

Please do not start working on any issue until you are officially **assigned** by a maintainer.

If you want to contribute to an issue, please leave a comment asking maintainers **[@DebaA17](https://github.com/DebaA17)** or **[@Ruchika402](https://github.com/Ruchika402)** for assignment first. Unassigned Pull Requests will not be accepted.

---

1. **Branch Names**: Use descriptive prefixes:
   - `feature/feature-name` (e.g., `feature/ssrf-proxy`)
   - `bugfix/bug-description` (e.g., `bugfix/jwt-expiration`)
   - `docs/doc-update`
2. **Commit Messages**: Write meaningful commit messages:
   - _Format_: `<prefix>: <description>`
   - _Example_: `feat(backend): add ssrf validation to proxy engine`
3. **Submitting a PR**:
   - Ensure all tests pass and security/linting checks (`bandit`, `pnpm audit`, `pnpm lint`, `pnpm format:check`) are clean.
   - If your PR includes UI changes, attach Desktop and Mobile screenshots/recordings as described above.
   - Fill out the Pull Request template completely.
