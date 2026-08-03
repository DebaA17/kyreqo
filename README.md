<p align="center">
  <img src="frontend/public/kyreqo.jpg" alt="Kyreqo Banner" />
</p>

<p align="center">
  A modern, open-source web-based API testing client designed for fast, safe, and collaborative API request design.
</p>

<p align="center">
  <a href="https://github.com/DebaA17/kyreqo/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/DebaA17/kyreqo/ci.yml?branch=main&label=CI%20Pipeline&style=flat-square" alt="CI Pipeline Status" />
  </a>
  <a href="https://github.com/DebaA17/kyreqo/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/DebaA17/kyreqo/deploy.yml?branch=main&label=Deploy%20Backend&style=flat-square" alt="Deploy Backend Status" />
  </a>
  <a href="https://kyreqo-api.onrender.com/health/">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Fkyreqo-api.onrender.com%2Fhealth%2F&label=API%20Status&style=flat-square" alt="API Status" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/DebaA17/kyreqo?style=flat-square" alt="License" />
  </a>
  <a href="SECURITY.md">
    <img src="https://img.shields.io/badge/Security-Policy-blue?style=flat-square" alt="Security Policy" />
  </a>
</p>


## ✨ Features

*   **🗂️ Workspaces:** Keep your projects organized with isolated environments and collections.
*   **📂 Collections & Requests:** Build, order, and save your API requests into folders.
*   **🔐 Environment Variables:** Define, switch, and reference dynamic variables easily across your headers and bodies.
*   **↺ Quick Restore & History:** Auto-save request history and instantly restore previous request parameters with a single click.
*   **🛡️ SSRF-Hardened Proxy:** Run requests securely through a backend proxy that blocks Server-Side Request Forgery (SSRF) bypasses and bypasses client CORS blocks.

---

## 📐 Architecture Overview

To resolve CORS and secure outgoing requests, Kyreqo routes API calls through a secure Django REST API Proxy. The backend resolves the target domain and verifies the IP against private/local network ranges before executing the request.

Below is the request-response lifecycle:

<p align="center">
  <img src="frontend/public/diagram.png" width="650" alt="Kyreqo Request Lifecycle" />
</p>

---

## 🔗 Quick Links

*   🛠️ **[Local Setup & Developer Guide](CONTRIBUTING.md)**
*   🔒 **[Security Policy](SECURITY.md)**
*   🤝 **[Code of Conduct](CODE_OF_CONDUCT.md)**
*   📄 **[MIT License](LICENSE)**
