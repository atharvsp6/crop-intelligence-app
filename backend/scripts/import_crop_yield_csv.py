"""Utility script to bulk import crop_yield.csv into MongoDB crop_yield_data collection.

Usage (from backend directory):
    python scripts/import_crop_yield_csv.py --file ../crop_yield.csv

Optional args:
    --db <database_name>
    --batch-size 1000

Assumes environment variables for Mongo connection already configured (MONGO_URI or components).
"""
import argparse
import os
import sys
import pandas as pd
from datetime import datetime
from database import get_database

REQUIRED_COLUMNS = [
    'Crop','Crop_Year','Season','State','Area','Production','Annual_Rainfall','Fertilizer','Pesticide','Yield'
]

def normalize_record(row: pd.Series):
    return {
        'crop_type': str(row['Crop']).strip(),
        'year': int(row['Crop_Year']),
        'season': str(row['Season']).strip(),
        'state': str(row['State']).strip(),
        'area': float(row['Area']),
        'production': float(row['Production']),
        'annual_rainfall': float(row['Annual_Rainfall']),
        'fertilizer_input': float(row['Fertilizer']),
        'pesticide_input': float(row['Pesticide']),
        'yield': float(row['Yield']),
        # Derive approximate per-unit metrics
        'yield_per_area': float(row['Yield']) if row['Area'] == 0 else float(row['Yield'])/float(row['Area']),
        'created_at': datetime.utcnow()
    }

def main():
    parser = argparse.ArgumentParser(description='Import crop yield CSV into MongoDB')
    parser.add_argument('--file', default='../crop_yield.csv', help='Path to CSV file')
    parser.add_argument('--db', default=None, help='Override database name')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch insert size')
    parser.add_argument('--replace', action='store_true', help='Drop existing crop_yield_data collection before import')
    args = parser.parse_args()

    csv_path = args.file
    if not os.path.exists(csv_path):
        print(f"ERROR: File not found: {csv_path}")
        sys.exit(1)

    print(f"Reading CSV: {csv_path}")
    df = pd.read_csv(csv_path)

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        print(f"ERROR: Missing required columns: {missing}")
        sys.exit(1)

    db = get_database(args.db)
    collection = db['crop_yield_data']

    if args.replace:
        print('Dropping existing crop_yield_data collection...')
        collection.drop()

    records = []
    total = len(df)
    for idx, row in df.iterrows():
        try:
            rec = normalize_record(row)
            records.append(rec)
        except Exception as e:
            print(f"Row {idx} skipped: {e}")
        if len(records) >= args.batch_size:
            collection.insert_many(records)
            print(f"Inserted {len(records)} records (progress {idx+1}/{total})")
            records = []

    if records:
        collection.insert_many(records)
        print(f"Inserted final {len(records)} records. Total rows processed: {total}")

    # Create helpful indexes
    print('Creating indexes...')
    collection.create_index('crop_type')
    collection.create_index('year')
    collection.create_index([('crop_type', 1), ('year', 1)])

    print('Import completed successfully.')

if __name__ == '__main__':
    main()
