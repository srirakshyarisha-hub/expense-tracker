import datetime

from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for the Expense model with full backend validation."""

    class Meta:
        model = Expense
        fields = [
            'id',
            'title',
            'amount',
            'category',
            'expense_date',
            'payment_method',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    def validate_amount(self, value):
        if value is None:
            raise serializers.ValidationError("Amount cannot be empty.")
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_category(self, value):
        if not value:
            raise serializers.ValidationError("Category cannot be empty.")
        valid_categories = [choice[0] for choice in Expense.CATEGORY_CHOICES]
        if value not in valid_categories:
            raise serializers.ValidationError(
                f"'{value}' is not a valid category. Choose from {valid_categories}."
            )
        return value

    def validate_payment_method(self, value):
        if not value:
            raise serializers.ValidationError("Payment method cannot be empty.")
        valid_methods = [choice[0] for choice in Expense.PAYMENT_METHOD_CHOICES]
        if value not in valid_methods:
            raise serializers.ValidationError(
                f"'{value}' is not a valid payment method. Choose from {valid_methods}."
            )
        return value

    def validate_expense_date(self, value):
        if not value:
            raise serializers.ValidationError("Date cannot be empty.")
        if value > datetime.date.today():
            raise serializers.ValidationError("Expense date cannot be in the future.")
        return value
