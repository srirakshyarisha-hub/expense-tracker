# Project Documentation — Expense Tracker (CRUD Web Application)

## 1. Project Overview (Simple Explanation for Viva)

This project is a **full-stack web application** that lets a user record and manage their
daily expenses. It demonstrates the four basic database operations — **Create, Read, Update,
Delete (CRUD)** — using a real backend and a real database, not fake/static data.

In simple words:
- The **frontend** (HTML/CSS/JS) is what the user sees and clicks on.
- The **backend** (Django + Django REST Framework) receives requests from the frontend,
  validates the data, and talks to the database.
- The **database** (SQLite) is where every expense record is permanently stored.
- The frontend and backend talk to each other using a **REST API** — a set of URLs that
  return JSON data, following standard HTTP methods (GET, POST, PUT, PATCH, DELETE).

## 2. Architecture

```
 Browser (HTML/CSS/JS)
        |
        |  fetch() -> JSON over HTTP
        v
 Django REST Framework (views.py, serializers.py, urls.py)
        |
        |  Django ORM
        v
 SQLite Database (db.sqlite3)
```

- **models.py** defines the `Expense` table structure.
- **serializers.py** converts between JSON <-> Python objects and runs backend validation.
- **views.py** contains the API logic (list, create, retrieve, update, delete, dashboard stats).
- **urls.py** maps URLs to views.
- **script.js** calls these URLs using `fetch()` and updates the page without reloading it.

## 3. Database Design

**Table: `expenses_expense`**

| Field           | Type          | Notes                              |
|-----------------|---------------|-------------------------------------|
| id              | AutoField     | Primary key                         |
| title           | CharField     | Required, max 150 chars             |
| amount          | Decimal(10,2) | Required, must be > 0               |
| category        | CharField     | Required, one of a fixed choice list|
| expense_date    | DateField     | Required, cannot be a future date   |
| payment_method  | CharField     | Required, one of a fixed choice list|
| description     | TextField     | Optional                            |
| created_at      | DateTimeField | Auto-set on creation                |
| updated_at      | DateTimeField | Auto-set on every update            |

## 4. Validation Strategy

Validation happens in **two places**, which is a best practice:

1. **Frontend (JavaScript)** — gives the user instant feedback before a network call is even
   made (empty title, non-positive amount, missing date, future date, missing category/payment
   method).
2. **Backend (DRF Serializer)** — the *real* gatekeeper. Even if someone bypasses the UI and
   calls the API directly (e.g. from Postman), the serializer rejects invalid data and returns
   a `400 Bad Request` with a clear `errors` object. This is why backend validation can never
   be skipped — the frontend can be bypassed, the backend cannot.

## 5. Why SQLite?

SQLite is a lightweight, file-based database that requires no separate server installation —
perfect for a student project. Django creates and manages it automatically through
**migrations**, which are version-controlled instructions for building/changing the database
schema.

## 6. Sample Viva Questions & Answers

**Q1. What is CRUD?**
A: Create, Read, Update, Delete — the four basic operations performed on data in any
application with persistent storage.

**Q2. Why did you use Django REST Framework instead of plain Django?**
A: DRF makes it easy to build a JSON REST API with built-in serialization, validation, and
browsable API tools, which a plain Django view would require much more manual code for.

**Q3. What is a serializer?**
A: A serializer converts complex data types (like Django model instances) into JSON for the
API response, and converts incoming JSON back into Python objects — while also running
validation rules on that data.

**Q4. How does the frontend talk to the backend?**
A: Through `fetch()` calls in JavaScript that send HTTP requests (GET/POST/PUT/PATCH/DELETE)
to the Django REST Framework API endpoints, which respond with JSON.

**Q5. What happens when you submit the Add Expense form?**
A: JavaScript validates the fields first. If valid, it sends a `POST` request with the form
data as JSON to `/api/expenses/`. Django validates it again on the server, saves it to
SQLite if valid, and returns the created record, which the frontend then displays instantly.

**Q6. How do you prevent invalid data from entering the database?**
A: Through serializer-level `validate_<field>` methods in `serializers.py` — for example,
rejecting a non-positive amount, an invalid category, or a future expense date, and returning
a `400` error instead of saving.

**Q7. What is a migration?**
A: A migration is a file that describes a change to the database schema (like creating a
table). Running `python manage.py migrate` applies these changes to `db.sqlite3`.

**Q8. How is the dashboard data calculated?**
A: The `/api/dashboard/` endpoint uses Django's ORM aggregation functions (`Sum`, `Count`) to
compute totals directly from the database every time it's called — it is never hardcoded.

**Q9. How would you test this API without the frontend?**
A: Using Postman — sending GET/POST/PUT/DELETE requests directly to the `/api/expenses/`
endpoints and inspecting the JSON responses and status codes.

**Q10. What database operations happen when you click Delete?**
A: The frontend calls `DELETE /api/expenses/<id>/` after the user confirms in a modal. Django
looks up that row by primary key and permanently removes it from SQLite, then returns a
success message, and the frontend removes the card from the screen.

**Q11. Why do you validate the expense date isn't in the future?**
A: Because an "expense" by definition already happened — this is a business-rule validation
enforced in the serializer to keep the data meaningful and consistent.

**Q12. Is this project responsive?**
A: Yes — CSS media queries collapse the sidebar into a toggle-able menu and stack the grid
layouts into a single column on small screens.
