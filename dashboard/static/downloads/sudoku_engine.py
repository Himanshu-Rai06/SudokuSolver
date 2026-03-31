# Change arrays for other sudokus, replacing empty spaces with 0
arrays = [
    [0, 4, 0, 1, 0, 0, 0, 5, 0],
    [1, 0, 7, 0, 0, 3, 9, 6, 0],
    [5, 2, 0, 0, 0, 8, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 7],
    [0, 0, 0, 9, 0, 6, 8, 0, 0],
    [8, 0, 3, 0, 5, 0, 6, 2, 0],
    [0, 9, 0, 0, 6, 0, 5, 4, 3],
    [6, 0, 0, 0, 8, 0, 7, 0, 0],
    [2, 5, 0, 0, 9, 7, 1, 0, 0]]

def show():
    for row in arrays:
        for element in row:
            print(element, end=" ")
        print()

show()
print("----------------------------------------")


def row_finder(a,array):
    return array[a]


def col_finder(b,array):
    col = []
    for row in array:
        col.append(row[b])
    return col


def box_finder(a,b,array):
    box = []
    a = a//3
    b = b//3
    for i in range(a*3, (a+1)*3):
        for j in range(b*3, (b+1)*3):
            box.append(array[i][j])
    return box


def find_set(a,b,array):
    possible_set = [1,2,3,4,5,6,7,8,9]
    if array[a][b] == 0:
        ans = set(possible_set) - set(row_finder(a,array)) - set(col_finder(b,array)) - set(box_finder(a,b,array))
    else:
        ans = set([array[a][b]])
    return ans


def check(array):
    possible_values_set = []
    for i in range(9):
        for j in range(9):
            if array[i][j] == 0:
                possible_values_set.append([i,j,find_set(i,j,array)])
    return possible_values_set


def fill_check(possible_values, array):
    updated_pos = []
    for item in possible_values:
        if len(item[2]) == 1:
            array[item[0]][item[1]] = list(item[2])[0]
            updated_pos.append([item[0],item[1]])
    return updated_pos


def row_col_box(a,b,array):
    possible_values_set = []

    for i in range(9):
        if array[i][a] == 0:
            possible_values_set.append([i,a,find_set(i,a,array)])

    for j in range(9):
        if array[b][j] == 0:
            possible_values_set.append([b,j,find_set(b,j,array)])

    a = a//3
    b = b//3
    for i in range(a*3, (a+1)*3):
        for j in range(b*3, (b+1)*3):
            if array[i][j] == 0:
                possible_values_set.append([i,j,find_set(i,j,array)])

    return possible_values_set


def recheck(array,updated_pos):
    for item in updated_pos:
        checks = fill_check(row_col_box(item[0],item[1],array),array)
    return checks


def max_loop(array):
    storage = []
    record = []
    flat = [x for row in array for x in row]
    counts = {str(i): flat.count(str(i)) for i in range(1,10)}
    sort_counts = dict(sorted(counts.items(), key=lambda item: item[1]))
    sort_counts = dict(list(sort_counts.items())[::-1])

    for element in sort_counts:
        max_digit = str(element)
        for i in range(0,9,3):
            for j in range(0,9,3):
                if max_digit not in box_finder(i, j, array):
                    for k in range(i,i+3):
                        for l in range(j, j+3):
                            storage.append([k,l,find_set(k,l,array)])

                            if k == i+2 and l == j+2:
                                found = False
                                for product in storage:
                                    if max_digit in product[-1]:
                                        if found == False:
                                            record.append([product[0],product[1],[max_digit]])
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
    pos = fill_check(check(array),array)

    if pos:
        check_pos = recheck(array, pos)
    else:
        max_loop(array)
        check_pos = False


    while check_pos:
        check_pos = recheck(array, check_pos)
    return array


start = [row[:] for row in arrays]

while any(0 in row for row in arrays):

    ori = Sudoku(arrays)

    if ori != start:
        arrays = [row[:] for row in ori]
        start = [row[:] for row in ori]
        continue

    guess = try_and_error(arrays)
    if guess is None:
        print("No solution possible")
        break

    if guess != start:
        arrays = [row[:] for row in guess]
        start = [row[:] for row in guess]
        continue

    print("No progress possible — switching to deeper backtracking")
    break

show()