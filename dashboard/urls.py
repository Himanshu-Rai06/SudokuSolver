from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('solve/', views.solve_api, name='solve_api'),
    path('benchmark/', views.benchmark, name='benchmark'), 
    path('get-random-sudoku/', views.get_random_sudoku, name='get-random-sudoku'),
    path('get-hint/', views.get_hint, name='get_hint'),
]