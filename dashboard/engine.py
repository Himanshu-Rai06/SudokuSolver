import pandas as pd
import time
import os
from django.conf import settings

def row_finder(a, array):
    return array[a]

def col_finder(b, array):
    col = []
    for row in array:
        col.append(row[b])
    return col

def box_finder(a, b, array):
    box = []
    a = a // 3
    b = b // 3
    for i in range(a * 3, (a + 1) * 3):
        for j in range(b * 3, (b + 1) * 3):
            box.append(array[i][j])
    return box

def find_set(a, b, array):
    possible_set = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    if array[a][b] == 0:
        ans = set(possible_set) - set(row_finder(a, array)) - set(col_finder(b, array)) - set(box_finder(a, b, array))
    else:
        ans = set([array[a][b]])
    return ans

def check(array):
    possible_values_set = []
    for i in range(9):
        for j in range(9):
            if array[i][j] == 0:
                possible_values_set.append([i, j, find_set(i, j, array)])
    return possible_values_set

def fill_check(possible_values, array):
    updated_pos = []
    for item in possible_values:
        if len(item[2]) == 1:
            array[item[0]][item[1]] = list(item[2])[0]
            updated_pos.append([item[0], item[1]])
    return updated_pos

def row_col_box(a, b, array):
    possible_values_set = []
    for i in range(9):
        if array[i][a] == 0:
            possible_values_set.append([i, a, find_set(i, a, array)])
    for j in range(9):
        if array[b][j] == 0:
            possible_values_set.append([b, j, find_set(b, j, array)])
    a = a // 3
    b = b // 3
    for i in range(a * 3, (a + 1) * 3):
        for j in range(b * 3, (b + 1) * 3):
            if array[i][j] == 0:
                possible_values_set.append([i, j, find_set(i, j, array)])
    return possible_values_set

def recheck(array, updated_pos):
    checks = []
    for item in updated_pos:
        checks = fill_check(row_col_box(item[0], item[1], array), array)
    return checks

def max_loop(array):
    storage = []
    record = []
    flat = [x for row in array for x in row]
    counts = {str(i): flat.count(i) for i in range(1, 10)}
    sort_counts = dict(sorted(counts.items(), key=lambda item: item[1]))
    sort_counts = dict(list(sort_counts.items())[::-1])

    for element in sort_counts:
        max_digit = int(element)
        for i in range(0, 9, 3):
            for j in range(0, 9, 3):
                if max_digit not in box_finder(i, j, array):
                    for k in range(i, i + 3):
                        for l in range(j, j + 3):
                            storage.append([k, l, find_set(k, l, array)])

                            if k == i + 2 and l == j + 2:
                                found = False
                                for product in storage:
                                    if max_digit in product[-1]:
                                        if found == False:
                                            record.append([product[0], product[1], [max_digit]])
                                            found = True
                                        elif found == True:
                                            record.pop()
                                            found = False
                                            break
                                storage = []

    for item in record:
        array[item[0]][item[1]] = item[2][0]

    return array

def try_and_error(array):
    final_set = []
    for i in range(9):
        for j in range(9):
            if array[i][j] == 0:
                s = find_set(i, j, array)
                if len(s) == 0:
                    return None
                final_set.append([i, j, s])

    if not final_set:
        return array

    final_set.sort(key=lambda x: len(x[2]))
    r, c, possibilities = final_set[0]

    for value in possibilities:
        new_grid = [row[:] for row in array]
        new_grid[r][c] = value

        result = try_and_error(new_grid)
        if result is not None:
            return result

    return None

def Sudoku(array):
    pos = fill_check(check(array), array)
    if pos:
        check_pos = recheck(array, pos)
    else:
        max_loop(array)
        check_pos = False

    while check_pos:
        check_pos = recheck(array, check_pos)
    return array

# --- THIS IS THE WRAPPER FUNCTION DJANGO CALLS ---
def solve_single_sudoku(grid):
    # Deep copy the grid so we don't mutate the original request data
    arrays = [row[:] for row in grid]
    start = [row[:] for row in arrays]

    while any(0 in row for row in arrays):
        ori = Sudoku(arrays)

        if ori != start:
            arrays = [row[:] for row in ori]
            start = [row[:] for row in ori]
            continue

        guess = try_and_error(arrays)
        if guess is None:
            return None # No solution possible

        if guess != start:
            arrays = [row[:] for row in guess]
            start = [row[:] for row in guess]
            continue

        return None # No progress possible

    return arrays

import csv
import random

def string_to_grid(s):
    """Converts string exactly like your original script."""
    # Safety pad with zeros just in case pandas stripped something
    s = s.ljust(81, '0') 
    return [[int(s[r*9 + c]) for c in range(9)] for r in range(9)]

def run_benchmark(sample_size=50):
    csv_path = os.path.join(settings.BASE_DIR, 'sudoku.csv') 
    
    try:
        # Using Python's built-in CSV reader (matches your original code!)
        # It's actually safer for purely string data than pandas.
        puzzles = []
        with open(csv_path, newline='') as f:
            reader = csv.DictReader(f)
            # We don't want to load 1 million rows if we don't have to,
            # but standard random sampling on an iterator requires loading.
            # Loading 1M strings takes ~1 second, which is acceptable.
            for row in reader:
                puzzles.append(row['quizzes'])
                
        # Pick random sample
        sample_strings = random.sample(puzzles, min(sample_size, len(puzzles)))
        
    except FileNotFoundError:
        return {"error": "sudoku.csv not found in the main folder!"}
    except Exception as e:
        return {"error": f"CSV Reading Error: {str(e)}"}

    total_time = 0
    solved_count = 0
    
    for quiz_str in sample_strings:
        try:
            grid = string_to_grid(quiz_str)
            
            start_time = time.time()
            result = solve_single_sudoku(grid) 
            end_time = time.time()
            
            if result is not None:
                solved_count += 1
                
            total_time += (end_time - start_time)
        except Exception as e:
            # If ONE puzzle fails to parse or solve, skip it, don't crash the whole test
            continue
            
    # Calculate stats
    actual_tested = len(sample_strings)
    if actual_tested == 0:
        return {"error": "No valid puzzles found to test."}
        
    avg_time_ms = (total_time / actual_tested) * 1000
    accuracy = (solved_count / actual_tested) * 100
    
    return {
        'total_time_s': round(total_time, 3),
        'avg_time_ms': round(avg_time_ms, 3),
        'accuracy': round(accuracy, 1),
        'puzzles_tested': actual_tested
    }

def get_logical_step(grid):
    # Create a deep copy so we don't accidentally mutate the user's board
    array = [row[:] for row in grid]
    
    # 1. Use your existing check() function to find all possibilities for every empty cell
    possible_values_set = check(array)
    
    # 2. Look for a "Naked Single" (A cell where only 1 number is possible)
    for item in possible_values_set:
        r = item[0]
        c = item[1]
        possibilities = item[2]
        
        if len(possibilities) == 1:
            val = list(possibilities)[0]
            # Calculate the 1D index (0-80) for your frontend JS
            target_index = (r * 9) + c 
            
            return {
                'target_index': target_index,
                'value': str(val),
                'message': f"The only possible value here is {val}. All other numbers are blocked by its row, column, or 3x3 box!"
            }
            
    # 3. Fallback: If there are no obvious Naked Singles, use the solver to give a complex hint
    solved_grid = solve_single_sudoku(array)
    if solved_grid:
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0: # Find first empty spot
                    return {
                        'target_index': (r * 9) + c,
                        'value': str(solved_grid[r][c]),
                        'message': f"This one requires advanced deduction! By process of elimination, this must be {solved_grid[r][c]}."
                    }
                    
    return None # Board is full or unsolvable