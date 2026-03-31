from django.db import models

class SudokuPuzzle(models.Model):
    puzzle_string = models.CharField(max_length=81)

    def __str__(self):
        return self.puzzle_string