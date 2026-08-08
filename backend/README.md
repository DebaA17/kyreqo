# Kyreqo Backend

Built with Django REST Framework.

## Setup Instructions

> [!NOTE]
> The commands below are for Linux and macOS. For Windows, use `python` instead of `python3`, and `venv\Scripts\activate` to activate the virtual environment.

1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations and start server:
   ```bash
   python3 manage.py migrate
   python3 manage.py runserver
   ```
