# views.py
import json
import csv
import time
import random
import os
from pathlib import Path
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

BASE_DIR = Path(__file__).resolve().parent.parent 
CSV_PATH = os.path.join(BASE_DIR, 'sudoku.csv')

print(f"Booting up Python Engine... Looking for CSV at: {CSV_PATH}")
print("Loading Sudoku dataset into ultra-fast RAM...")

GLOBAL_SUDOKU_DATASET = load_sudoku_dataset(CSV_PATH)
if GLOBAL_SUDOKU_DATASET:
    print(f"SUCCESS: {len(GLOBAL_SUDOKU_DATASET)} puzzles loaded into memory!")
else:
    # If it fails, let's check the current directory to debug
    print(f"WARNING: Dataset failed to load. Current directory is: {os.getcwd()}")
    print(f"Files available here: {os.listdir(BASE_DIR)}")

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
            raw_grid = data.get('board')
            
            # --- FIX: CLEAN THE GRID BEFORE SENDING TO ENGINE ---
            clean_grid = []
            for row in raw_grid:
                clean_row = []
                for cell in row:
                    # If the cell is empty, null, or a space, convert it to 0
                    if cell in ["", " ", None, 0, "0"]:
                        clean_row.append(0)
                    else:
                        clean_row.append(int(cell)) # Convert string numbers to real integers
                clean_grid.append(clean_row)
            
            # Send the cleaned integer grid to the engine
            solved_grid = solve_single_sudoku(clean_grid) 
            
            if solved_grid:
                return JsonResponse({'solvedBoard': solved_grid})
            else:
                return JsonResponse({'error': 'No solution possible based on your logic.'}, status=400)
        except Exception as e:
            print(f"Solver Error: {e}")
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Invalid request method'}, status=400)

# ==========================================
# 3. THE BENCHMARK VIEW (Lightning Fast)
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
                
            # --- STOP STOPWATCH ---
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

# ==========================================
# 4. RANDOM PUZZLE GENERATOR
# ==========================================
def get_random_sudoku(request):
    # --- FIX: PULL FROM CSV RAM INSTEAD OF EMPTY SQLITE DB ---
    if not GLOBAL_SUDOKU_DATASET:
        return JsonResponse({'error': 'No puzzles found in memory!'}, status=404)
    
    # Pick a random puzzle string directly from the 1-million puzzle CSV list
    random_puzzle_string = random.choice(GLOBAL_SUDOKU_DATASET)
    
    return JsonResponse({'puzzle': random_puzzle_string})

# ==========================================
# 5. GET HINT
# ==========================================
def get_hint(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            current_grid = data.get('board')
            
            # --- FIX: CLEAN GRID FOR HINTS AS WELL ---
            clean_grid = []
            for row in current_grid:
                clean_row = []
                for cell in row:
                    if cell in ["", " ", None, 0, "0"]:
                        clean_row.append(0)
                    else:
                        clean_row.append(int(cell))
                clean_grid.append(clean_row)

            hint_data = get_logical_step(clean_grid)
            
            if hint_data:
                return JsonResponse(hint_data)
            else:
                return JsonResponse({'error': 'No logical moves found or board is full.'}, status=400)
                
        except Exception as e:
            print(f"Hint Error: {e}")
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Invalid request method'}, status=400)