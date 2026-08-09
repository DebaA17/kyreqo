# Contributing to Kyreqo

Welcome to the Kyreqo codebase! Thank you for contributing. This document provides guidelines for contributing to Kyreqo, including local setup, code standards, testing, and security.

---

## 🛠️ Tech Stack & Setup

Kyreqo is split into:

- **Backend**: Django REST Framework + PostgreSQL
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (using **`pnpm`** as the package manager)

All development scripts should be run from the repository root using the workspace shortcuts defined in the root `package.json`.

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
   - Ensure all tests pass and security/linting checks (`bandit`, `pnpm audit`) are clean.
   - Fill out the Pull Request template completely.
