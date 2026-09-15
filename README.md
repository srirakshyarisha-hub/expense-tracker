# 💰 Expense Tracker — CRUD-Based Web Application

A full-stack **Expense Tracker** mini web application built for a college CRUD activity.
It uses **Django + Django REST Framework** on the backend, **SQLite** as the database, and
plain **HTML/CSS/JavaScript** (fetch API) on the frontend — no frontend framework required.

---

## ✨ Features

- 📊 **Dashboard** — total expenses, total amount spent, this month's spend, categories used,
  spending-by-category breakdown, and a recent-expenses feed — all computed live from SQLite.
- 🧾 **Full CRUD** on expenses (Create, Read, Update, Delete) backed by a real REST API.
- 🔍 Search by title/description, filter by category & payment method, sort by date/amount/title.
- ✅ Frontend **and** backend validation (required fields, positive amount, valid category/date, etc).
- 💬 Success/error toast notifications, confirmation modal before delete, view-details modal.
- 📱 Fully responsive, mobile-friendly layout with a collapsible sidebar.
- 🌱 Sample data (8 realistic expenses) loaded once via a data migration — never duplicated.

---

## 🛠️ Tech Stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (`fetch`)     |
| Backend    | Python, Django, Django REST Framework         |
| Database   | SQLite                                        |
| API Testing| Postman                                       |
| Versioning | Git / GitHub                                  |

---

## 📁 Project Structure

```
expense-tracker/
│
├── manage.py
├── requirements.txt
├── README.md
├── .gitignore
├── db.sqlite3                     (created automatically)
│
├── expense_tracker/               # Django project
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── expenses/                      # Django app
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── tests.py
│   └── migrations/
│       ├── __init__.py
│       ├── 0001_initial.py
│       └── 0002_sample_data.py
│
├── templates/
│   └── index.html
│
├── static/
│   ├── css/style.css
│   └── js/script.js
│
└── documentation/
    └── project_documentation.md
```

---

## 🚀 Setup & Run (VS Code)

### 1. Open the project
Unzip the project and open the `expense-tracker` folder in VS Code.

### 2. Create a virtual environment
```bash
python -m venv venv
```
Activate it:
- **Windows:** `venv\Scripts\activate`
- **macOS/Linux:** `source venv/bin/activate`

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create the database (run migrations)
```bash
python manage.py makemigrations
python manage.py migrate
```
This creates `db.sqlite3`, the `expenses_expense` table, **and** loads the 8 sample
expenses automatically (only the first time — migrations never re-run on later starts).

### 5. (Optional) Create an admin user
```bash
python manage.py createsuperuser
```

### 6. Run the server
```bash
python manage.py runserver
```

### 7. Open the app
Visit **http://127.0.0.1:8000/** in your browser. The Django admin is at
**http://127.0.0.1:8000/admin/**.

---

## 🔌 REST API Endpoints

| Method | Endpoint                    | Description                     |
|--------|------------------------------|----------------------------------|
| GET    | `/api/expenses/`             | List all expenses (search/filter/sort) |
| POST   | `/api/expenses/`             | Create a new expense            |
| GET    | `/api/expenses/<id>/`        | Retrieve one expense            |
| PUT    | `/api/expenses/<id>/`        | Full update of an expense       |
| PATCH  | `/api/expenses/<id>/`        | Partial update of an expense    |
| DELETE | `/api/expenses/<id>/`        | Delete an expense               |
| GET    | `/api/dashboard/`            | Dashboard statistics             |

**Query parameters on `GET /api/expenses/`:**
`search=<text>` · `category=<Food|Transport|...>` · `payment_method=<Cash|Card|...>` ·
`date_from=YYYY-MM-DD` · `date_to=YYYY-MM-DD` · `ordering=amount|-amount|expense_date|-expense_date|title`

### Sample JSON body (POST / PUT)
```json
{
  "title": "Coffee with friends",
  "amount": "150.00",
  "category": "Food",
  "expense_date": "2026-09-14",
  "payment_method": "UPI",
  "description": "Weekend catch-up"
}
```

---

## 🧪 Testing in Postman

1. Open Postman and create a new collection called **Expense Tracker API**.
2. **GET all expenses** → `GET http://127.0.0.1:8000/api/expenses/`
3. **Create expense** → `POST http://127.0.0.1:8000/api/expenses/`, Body → raw → JSON (see sample above).
4. **Get one** → `GET http://127.0.0.1:8000/api/expenses/1/`
5. **Update** → `PUT` or `PATCH` `http://127.0.0.1:8000/api/expenses/1/` with a JSON body.
6. **Delete** → `DELETE http://127.0.0.1:8000/api/expenses/1/`
7. **Invalid data test** → POST with `"amount": -50` or an empty `"title"` → expect `400 Bad Request`
   with an `errors` object describing the problem.
8. **Dashboard** → `GET http://127.0.0.1:8000/api/dashboard/`

---

## ✅ Running Automated Tests

```bash
python manage.py test
```
This runs `expenses/tests.py`, which covers: creating an expense, listing, retrieving,
updating, deleting, dashboard stats, and rejecting invalid data (empty title, negative
amount, invalid category, future date).

---

## 🔎 Verifying the SQLite Database Directly

```bash
python manage.py shell
```
```python
from expenses.models import Expense
Expense.objects.count()
Expense.objects.all()
```
Or open `db.sqlite3` with the **SQLite Viewer** / **DB Browser for SQLite** tool and inspect
the `expenses_expense` table directly — rows will change in real time as you use the UI.

---

## 🧭 How to Demonstrate CRUD

1. **Create** — click "+ Add Expense", fill the form, submit → new card appears + success toast.
2. **Read** — go to "Expenses" tab, see all expenses; click 👁️ to view full details.
3. **Update** — click ✏️ on any card, change values, save → card updates immediately.
4. **Delete** — click 🗑️, confirm in the modal → card disappears + database row removed.
5. **Search/Filter** — type in the search box, or use the category/payment dropdowns.
6. **Validation** — try submitting an empty form, a negative amount, or a future date.

---

## 📄 License
Built for educational purposes as a college mini-project submission.
