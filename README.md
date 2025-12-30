# Lighting ERP – Backend (Django REST API)

This repository contains the **backend APIs** for the **Lighting ERP system**, built using **Django** and **Django REST Framework (DRF)**.

This documentation is intended for:
- Backend Developers
- Frontend Developers (React / Angular / Vue)
- QA / API Testers

It explains **how to set up, run, and test the project locally** after cloning from GitHub.

---

## 📌 Prerequisites

Before starting, ensure the following are installed on your system:

### Required
- **Python 3.10+** (Recommended: 3.11)
- **Git**
- **pip** (Python package installer)
- **Virtual Environment support** (standard `venv`)

### Optional but Recommended
- **VS Code** (with Python extension)
- **Postman** or **Swagger UI** (for API testing)
- **DB Browser for SQLite** (if using the default database)


### Verify Python Installation
Open your terminal and check your version:
```bash
python --version

git clone [https://github.com/Tvum-Tech/backend_mvp_boq.git](https://github.com/Tvum-Tech/backend_mvp_boq.git)
cd lighting_erp

Create Virtual Environment
Isolate project dependencies by creating a virtual environment.


Windows:
--------------------------
python -m venv venv
venv\Scripts\activate


Mac / Linux:
--------------------------
python3 -m venv venv
source venv/bin/activate


Install Dependencies
-------------------------------
pip install -r requirements.txt


If requirements.txt is missing or fails, install the core packages manually:
----------------------------------------------------------------------------------
pip install django djangorestframework drf-spectacular pytest pytest-django


Apply Migrations
Initialize the database schema:
-----------------------------------
python manage.py makemigrations
python manage.py migrate

Running the Server
Start the local development server:
---------------------------------------
python manage.py runserver


The API will be accessible at: 👉 http://127.0.0.1:8000/

📚 API Documentation
This project uses drf-spectacular to generate automatic API documentation. Once the server is running, you can access:

Swagger UI (Interactive): http://127.0.0.1:8000/api/schema/swagger-ui/
Redoc (Standard): http://127.0.0.1:8000/api/schema/redoc/
Django Admin: http://127.0.0.1:8000/admin/
