// ===================================================================
// Expense Tracker - Frontend Logic
// Talks to the Django REST Framework API using fetch()
// ===================================================================

const API_BASE = '/api';

const state = {
  expenses: [],
  editingId: null,
  deletingId: null,
  deletingTitle: '',
};

// ---------- DOM helpers ----------
const $ = (id) => document.getElementById(id);
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function openModal(id) { $(id).classList.add('active'); }
function closeModal(id) { $(id).classList.remove('active'); }

// ---------- Navigation ----------
function initNav() {
  qsa('.nav-item[data-view], .link-btn[data-view]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = el.getAttribute('data-view');
      qsa('.view').forEach((v) => v.classList.remove('active'));
      $(viewId).classList.add('active');
      qsa('.nav-item').forEach((n) => n.classList.remove('active'));
      const navMatch = qs(`.nav-item[data-view="${viewId}"]`);
      if (navMatch) navMatch.classList.add('active');
      $('pageTitle').textContent = viewId === 'dashboard-view' ? 'Dashboard' : 'Expenses';
      if (viewId === 'expenses-view') loadExpenses();
      qs('.sidebar').classList.remove('open');
    });
  });

  $('hamburger').addEventListener('click', () => qs('.sidebar').classList.toggle('open'));
}

// ---------- API calls ----------
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }
  if (!response.ok) {
    const error = new Error('Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function fetchDashboardStats() {
  try {
    const res = await apiRequest(`${API_BASE}/dashboard/`);
    renderDashboard(res.data);
  } catch (err) {
    showToast('Could not load dashboard stats.', 'error');
  }
}

async function loadExpenses() {
  $('loadingState').style.display = 'block';
  $('emptyState').style.display = 'none';
  $('expenseGrid').innerHTML = '';

  const params = new URLSearchParams();
  const search = $('searchInput').value.trim();
  const category = $('filterCategory').value;
  const payment = $('filterPayment').value;
  const ordering = $('sortBy').value;

  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (payment) params.append('payment_method', payment);
  if (ordering) params.append('ordering', ordering);

  try {
    const res = await apiRequest(`${API_BASE}/expenses/?${params.toString()}`);
    state.expenses = res.data;
    renderExpenses(state.expenses);
  } catch (err) {
    showToast('Failed to load expenses from the server.', 'error');
  } finally {
    $('loadingState').style.display = 'none';
  }
}

// ---------- Rendering ----------
function renderDashboard(data) {
  $('statTotalExpenses').textContent = data.total_expenses;
  $('statTotalAmount').textContent = formatCurrency(data.total_amount);
  $('statMonthAmount').textContent = formatCurrency(data.this_month_amount);
  $('statTotalCategories').textContent = data.total_categories;

  // Category breakdown bars
  const maxTotal = Math.max(...data.by_category.map((c) => c.total), 1);
  $('categoryBreakdown').innerHTML = data.by_category.length
    ? data.by_category.map((c) => `
        <div class="category-row">
          <span class="category-name">${c.category}</span>
          <div class="category-bar-track">
            <div class="category-bar-fill" style="width:${(c.total / maxTotal) * 100}%"></div>
          </div>
          <span class="category-amount">${formatCurrency(c.total)}</span>
        </div>
      `).join('')
    : '<p style="color:var(--text-muted); font-size:0.85rem;">No expenses yet.</p>';

  // Recent expenses
  $('recentExpenses').innerHTML = data.recent_expenses.length
    ? data.recent_expenses.map((e) => `
        <div class="recent-item">
          <div>
            <div class="recent-item-title">${escapeHtml(e.title)}</div>
            <div class="recent-item-meta">${e.category} · ${formatDate(e.expense_date)}</div>
          </div>
          <div class="recent-item-amount">${formatCurrency(e.amount)}</div>
        </div>
      `).join('')
    : '<p style="color:var(--text-muted); font-size:0.85rem;">No expenses yet. Add your first one!</p>';
}

function renderExpenses(expenses) {
  if (!expenses.length) {
    $('emptyState').style.display = 'block';
    $('expenseGrid').innerHTML = '';
    return;
  }
  $('emptyState').style.display = 'none';

  $('expenseGrid').innerHTML = expenses.map((e) => `
    <div class="expense-card">
      <div class="expense-card-top">
        <div>
          <div class="expense-card-title">${escapeHtml(e.title)}</div>
          <span class="badge">${e.category}</span>
        </div>
        <div class="expense-card-amount">${formatCurrency(e.amount)}</div>
      </div>
      <div class="expense-card-meta">
        <span>📅 ${formatDate(e.expense_date)}</span>
        <span>💳 ${e.payment_method}</span>
      </div>
      <div class="expense-card-actions">
        <button class="btn-icon" title="View" onclick="viewExpense(${e.id})">👁️</button>
        <button class="btn-icon" title="Edit" onclick="editExpense(${e.id})">✏️</button>
        <button class="btn-icon danger" title="Delete" onclick="promptDelete(${e.id}, '${escapeHtml(e.title).replace(/'/g, "\\'")}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function populateFilterOptions() {
  const categories = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Other'];
  const methods = ['Cash','Card','UPI','Net Banking','Other'];
  $('filterCategory').innerHTML = '<option value="">All Categories</option>' +
    categories.map((c) => `<option value="${c}">${c}</option>`).join('');
  $('filterPayment').innerHTML = '<option value="">All Payment Methods</option>' +
    methods.map((m) => `<option value="${m}">${m}</option>`).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Form: Add / Edit ----------
function resetForm() {
  $('expenseForm').reset();
  $('expenseId').value = '';
  state.editingId = null;
  $('formModalTitle').textContent = 'Add Expense';
  qsa('.error-msg').forEach((el) => (el.textContent = ''));
  qsa('#expenseForm input, #expenseForm select').forEach((el) => el.classList.remove('invalid'));
  $('expense_date').max = new Date().toISOString().split('T')[0];
}

function openAddModal() {
  resetForm();
  openModal('formModalOverlay');
}

function editExpense(id) {
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense) return;
  resetForm();
  state.editingId = id;
  $('formModalTitle').textContent = 'Edit Expense';
  $('expenseId').value = expense.id;
  $('title').value = expense.title;
  $('amount').value = expense.amount;
  $('expense_date').value = expense.expense_date;
  $('category').value = expense.category;
  $('payment_method').value = expense.payment_method;
  $('description').value = expense.description || '';
  openModal('formModalOverlay');
}
window.editExpense = editExpense;

function viewExpense(id) {
  const e = state.expenses.find((x) => x.id === id);
  if (!e) return;
  $('viewModalBody').innerHTML = `
    <div class="view-row"><span>Title</span><span>${escapeHtml(e.title)}</span></div>
    <div class="view-row"><span>Amount</span><span>${formatCurrency(e.amount)}</span></div>
    <div class="view-row"><span>Category</span><span>${e.category}</span></div>
    <div class="view-row"><span>Payment Method</span><span>${e.payment_method}</span></div>
    <div class="view-row"><span>Date</span><span>${formatDate(e.expense_date)}</span></div>
    <div class="view-row"><span>Description</span><span>${escapeHtml(e.description) || '-'}</span></div>
    <div class="view-row"><span>Created At</span><span>${new Date(e.created_at).toLocaleString('en-IN')}</span></div>
  `;
  openModal('viewModalOverlay');
}
window.viewExpense = viewExpense;

function promptDelete(id, title) {
  state.deletingId = id;
  $('deleteExpenseTitle').textContent = title;
  openModal('deleteModalOverlay');
}
window.promptDelete = promptDelete;

// ---------- Frontend validation ----------
function validateForm(payload) {
  let valid = true;
  qsa('.error-msg').forEach((el) => (el.textContent = ''));
  qsa('#expenseForm input, #expenseForm select').forEach((el) => el.classList.remove('invalid'));

  const setError = (field, msg) => {
    $(`err-${field}`).textContent = msg;
    $(field).classList.add('invalid');
    valid = false;
  };

  if (!payload.title) setError('title', 'Title is required.');
  if (!payload.amount || Number(payload.amount) <= 0) setError('amount', 'Enter an amount greater than 0.');
  if (!payload.expense_date) setError('expense_date', 'Date is required.');
  else if (payload.expense_date > new Date().toISOString().split('T')[0]) setError('expense_date', 'Date cannot be in the future.');
  if (!payload.category) setError('category', 'Please select a category.');
  if (!payload.payment_method) setError('payment_method', 'Please select a payment method.');

  return valid;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const payload = {
    title: $('title').value.trim(),
    amount: $('amount').value,
    expense_date: $('expense_date').value,
    category: $('category').value,
    payment_method: $('payment_method').value,
    description: $('description').value.trim(),
  };

  if (!validateForm(payload)) return;

  const saveBtn = $('saveExpenseBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (state.editingId) {
      await apiRequest(`${API_BASE}/expenses/${state.editingId}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Expense updated successfully!', 'success');
    } else {
      await apiRequest(`${API_BASE}/expenses/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Expense added successfully!', 'success');
    }
    closeModal('formModalOverlay');
    await loadExpenses();
    await fetchDashboardStats();
  } catch (err) {
    if (err.data && err.data.errors) {
      Object.entries(err.data.errors).forEach(([field, messages]) => {
        const el = $(`err-${field}`);
        if (el) {
          el.textContent = Array.isArray(messages) ? messages[0] : messages;
          if ($(field)) $(field).classList.add('invalid');
        }
      });
      showToast('Please fix the errors in the form.', 'error');
    } else {
      showToast('Something went wrong while saving. Please try again.', 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Expense';
  }
}

async function handleConfirmDelete() {
  if (!state.deletingId) return;
  try {
    await apiRequest(`${API_BASE}/expenses/${state.deletingId}/`, { method: 'DELETE' });
    showToast('Expense deleted successfully.', 'success');
    closeModal('deleteModalOverlay');
    await loadExpenses();
    await fetchDashboardStats();
  } catch (err) {
    showToast('Failed to delete the expense.', 'error');
  } finally {
    state.deletingId = null;
  }
}

// ---------- Init ----------
function initModals() {
  qsa('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')));
  });
  qsa('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
}

function initFilters() {
  let debounceTimer;
  $('searchInput').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadExpenses, 350);
  });
  $('filterCategory').addEventListener('change', loadExpenses);
  $('filterPayment').addEventListener('change', loadExpenses);
  $('sortBy').addEventListener('change', loadExpenses);
  $('clearFiltersBtn').addEventListener('click', () => {
    $('searchInput').value = '';
    $('filterCategory').value = '';
    $('filterPayment').value = '';
    $('sortBy').value = '-expense_date';
    loadExpenses();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateFilterOptions();
  initNav();
  initModals();
  initFilters();

  $('quickAddBtn').addEventListener('click', openAddModal);
  $('emptyAddBtn').addEventListener('click', openAddModal);
  $('expenseForm').addEventListener('submit', handleFormSubmit);
  $('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);

  fetchDashboardStats();
});
