from django.contrib import admin

from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'amount', 'category', 'payment_method', 'expense_date', 'created_at')
    list_filter = ('category', 'payment_method', 'expense_date')
    search_fields = ('title', 'description')
