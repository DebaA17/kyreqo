# Contributing to Kyreqo

Welcome to the Kyreqo codebase! Thank you for contributing. This document provides guidelines for contributing to Kyreqo, including local setup, code standards, testing, and security.

---

## 🛠️ Tech Stack & Setup

Kyreqo is split into:
*   **Backend**: Django REST Framework + PostgreSQL
*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS (using **`pnpm`** as the package manager)

### Backend Local Setup

1. **Navigate to backend and create venv**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   ```
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run migrations and start the server**:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Local Setup

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```
2. **Install dependencies using `pnpm`**:
   ```bash
   pnpm install
   ```
3. **Start the development server**:
   ```bash
   pnpm dev
   ```

---

## 🔒 Security Practices & Auditing

Security is a core focus of Kyreqo, especially preventing Server-Side Request Forgery (SSRF) and dependency vulnerabilities.

### 1. Python Security Linter (`bandit`)
We use `bandit` to scan Python code for security issues.
*   **Install Bandit** (if not already installed):
    ```bash
    pip install bandit
    ```
*   **Run Bandit scan**:
    ```bash
    bandit -r backend/
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
