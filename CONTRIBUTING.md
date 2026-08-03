# Contributing to Kyreqo

Welcome to the Kyreqo codebase! Thank you for contributing. This document provides guidelines for contributing to Kyreqo, including local setup, code standards, testing, and security.

---

## 🛠️ Tech Stack & Setup

Kyreqo is split into:
*   **Backend**: Django REST Framework + PostgreSQL
*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS (using **`pnpm`** as the package manager)

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

---

## 🔒 Security Practices & Auditing

Security is a core focus of Kyreqo, especially preventing Server-Side Request Forgery (SSRF) and dependency vulnerabilities.

### 1. Python Security Linter (`bandit`)
We use `bandit` to scan Python code for security issues.
*   **Run Bandit scan**:
    ```bash
    backend/venv/bin/bandit -r backend/apps/ -x "**/tests.py"
    ```
    *Ensure you resolve any High/Medium severity findings before creating a Pull Request.*

### 2. Frontend Dependency Audit
*   Use `pnpm audit` to check for security vulnerabilities in frontend node packages:
    ```bash
    pnpm audit
    ```

---

## 🌿 Git Workflow & Branches

1. **Branch Names**: Use descriptive prefixes:
   *   `feature/feature-name` (e.g., `feature/ssrf-proxy`)
   *   `bugfix/bug-description` (e.g., `bugfix/jwt-expiration`)
   *   `docs/doc-update`
2. **Commit Messages**: Write meaningful commit messages:
   *   *Format*: `<prefix>: <description>`
   *   *Example*: `feat(backend): add ssrf validation to proxy engine`
3. **Submitting a PR**:
   *   Ensure all tests pass and security/linting checks (`bandit`, `pnpm audit`) are clean.
   *   Fill out the Pull Request template completely.
