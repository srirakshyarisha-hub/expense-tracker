from datetime import date

from django.db.models import Sum, Count
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/expenses/  -> list all expenses (supports search/filter/ordering)
    POST /api/expenses/  -> create a new expense
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['amount', 'expense_date', 'created_at', 'title']
    ordering = ['-expense_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        category = params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        payment_method = params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        date_from = params.get('date_from')
        if date_from:
            queryset = queryset.filter(expense_date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            queryset = queryset.filter(expense_date__lte=date_to)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_create(serializer)
        return Response(
            {"success": True, "message": "Expense added successfully.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "count": len(serializer.data), "data": serializer.data})


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/expenses/<id>/  -> retrieve one expense
    PUT    /api/expenses/<id>/  -> full update
    PATCH  /api/expenses/<id>/  -> partial update
    DELETE /api/expenses/<id>/  -> delete
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"success": True, "data": serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_update(serializer)
        return Response({"success": True, "message": "Expense updated successfully.", "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"success": True, "message": "Expense deleted successfully."}, status=status.HTTP_200_OK)


@api_view(['GET'])
def dashboard_stats(request):
    """
    GET /api/dashboard/
    Returns live statistics computed directly from the SQLite database.
    """
    all_expenses = Expense.objects.all()

    total_expenses = all_expenses.count()
    total_amount = all_expenses.aggregate(total=Sum('amount'))['total'] or 0
    total_categories = all_expenses.values('category').distinct().count()

    today = date.today()
    this_month_amount = all_expenses.filter(
        expense_date__year=today.year,
        expense_date__month=today.month,
    ).aggregate(total=Sum('amount'))['total'] or 0

    by_category = list(
        all_expenses.values('category')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )

    recent = all_expenses.order_by('-created_at')[:5]
    recent_data = ExpenseSerializer(recent, many=True).data

    return Response({
        "success": True,
        "data": {
            "total_expenses": total_expenses,
            "total_amount": float(total_amount),
            "total_categories": total_categories,
            "this_month_amount": float(this_month_amount),
            "by_category": by_category,
            "recent_expenses": recent_data,
        }
    })
