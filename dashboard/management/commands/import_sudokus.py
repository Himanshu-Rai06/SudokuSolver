import csv
from django.core.management.base import BaseCommand
from dashboard.models import SudokuPuzzle 

class Command(BaseCommand):
    help = 'Imports Sudoku puzzles from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str)

    def handle(self, *args, **kwargs):
        csv_filepath = kwargs['csv_file']
        batch_size = 10000 
        objs = []
        
        self.stdout.write("Wiping old data to be safe...")
        SudokuPuzzle.objects.all().delete()
        
        self.stdout.write("Starting database import...")
        
        with open(csv_filepath, 'r') as file:
            reader = csv.reader(file)
            next(reader, None) # Skip the "quizzes,solutions" header
            
            for row in reader:
                if row: # Ensure the row isn't totally empty
                    puzzle = row[0].strip() # Grab ONLY the first column
                    objs.append(SudokuPuzzle(puzzle_string=puzzle))
                
                if len(objs) >= batch_size:
                    SudokuPuzzle.objects.bulk_create(objs)
                    self.stdout.write(f"Imported {batch_size} puzzles...")
                    objs = []
                    
            if objs:
                SudokuPuzzle.objects.bulk_create(objs)
                
        self.stdout.write(self.style.SUCCESS('Successfully imported all puzzles!'))