from django.urls import path

from . import views

urlpatterns = [
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense-detail'),
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
]
