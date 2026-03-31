# views.py
import json
import csv
import time
import random
from django.shortcuts import render
from django.http import JsonResponse

# Import models
from .models import SudokuPuzzle 

# Import ALL your custom logic from engine.py in one clean line
from .engine import solve_single_sudoku, run_benchmark, get_logical_step, Sudoku

# ==========================================
# 1. THE GLOBAL CACHE (Runs once on startup)
# ==========================================
def load_sudoku_dataset(filepath):
    puzzles = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                puzzles.append(row['quizzes']) # Grab only the quizzes column
    except Exception as e:
        print(f"CRITICAL ERROR loading dataset: {e}")
    return puzzles

CSV_PATH = r"C:\Users\Himanshu Rai\OneDrive\Pictures\Documents\Sudoku\sudoku_showcase\sudoku.csv"

print("Booting up Python Engine...")
print("Loading Sudoku dataset into ultra-fast RAM...")
GLOBAL_SUDOKU_DATASET = load_sudoku_dataset(CSV_PATH)
if GLOBAL_SUDOKU_DATASET:
    print(f"SUCCESS: {len(GLOBAL_SUDOKU_DATASET)} puzzles loaded into memory!")
else:
    print("WARNING: Dataset failed to load.")

# Helper Function to prevent the "String Index Out of Range" error
def string_to_grid(puzzle_string):
    """Converts an 81-character string into a 9x9 list of integers."""
    grid = []
    for i in range(9):
        # Grab 9 characters at a time, convert each to an int, and make a row
        row = [int(char) for char in puzzle_string[i*9:(i+1)*9]]
        grid.append(row)
    return grid


# ==========================================
# 2. VIEWS (API Endpoints)
# ==========================================
def index(request):
    return render(request, 'dashboard/index.html')

def solve_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            grid = data.get('board')
            
            solved_grid = solve_single_sudoku(grid) 
            
            if solved_grid:
                return JsonResponse({'solvedBoard': solved_grid})
            else:
                return JsonResponse({'error': 'No solution possible based on your logic.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Invalid request method'}, status=400)

# ==========================================
# 2. THE BENCHMARK VIEW (Lightning Fast)
# ==========================================
def benchmark(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            sample_size = int(data.get('sample_size', 50))
            
            puzzles_to_solve = GLOBAL_SUDOKU_DATASET[:sample_size]
            
            if not puzzles_to_solve:
                return JsonResponse({'error': 'No puzzles found in memory'}, status=500)

            # --- START STOPWATCH ---
            start_time = time.perf_counter()
            successful_solves = 0
            
            for puzzle_string in puzzles_to_solve:
                grid = string_to_grid(puzzle_string)
                result = solve_single_sudoku(grid)
                
                if result:
                    successful_solves += 1 
                
            # --- STOP STOPWATCH (This is the line that went missing!) ---
            end_time = time.perf_counter()
            
            # Calculate the exact math AND round the results
            total_time_seconds = end_time - start_time
            avg_time_ms = round((total_time_seconds / sample_size) * 100, 3) 
            accuracy = round((successful_solves / sample_size) * 100, 1) 
            
            return JsonResponse({
                'avg_time_ms': avg_time_ms,
                'accuracy': accuracy
            })
            
        except Exception as e:
            print(f"Benchmark Error: {e}")
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Invalid request'}, status=405)

def get_random_sudoku(request):
    count = SudokuPuzzle.objects.count()
    if count == 0:
        return JsonResponse({'error': 'No puzzles found!'}, status=404)
    
    random_index = random.randint(0, count - 1)
    random_puzzle = SudokuPuzzle.objects.all()[random_index]
    
    return JsonResponse({'puzzle': random_puzzle.puzzle_string})

def get_hint(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            current_grid = data.get('board')
            
            hint_data = get_logical_step(current_grid)
            
            if hint_data:
                return JsonResponse(hint_data)
            else:
                return JsonResponse({'error': 'No logical moves found or board is full.'}, status=400)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Invalid request method'}, status=400)