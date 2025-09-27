"""Train or retrain the crop yield prediction model using the expanded dataset.

This script:
  1. Reads records from MongoDB crop_yield_data (populated by import script)
  2. Performs feature engineering (encodes categorical variables, derives ratios)
  3. Trains a RandomForestRegressor with cross-validation metrics
  4. Saves model + encoder artifacts
  5. Stores training metadata to crop_yield_model_meta.json

Run from backend directory:
    python scripts/train_crop_yield_model.py --estimators 300 --test-size 0.2
"""
import argparse
import json
import os
import sys
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from math import expm1, log1p

# Ensure repository root / backend directory is on path so `database` can be imported
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

try:
    from database import get_collection
except ModuleNotFoundError as e:
    raise ModuleNotFoundError("Failed to import 'database'. Run this script from the backend directory or use 'python -m scripts.train_crop_yield_model'. Original error: " + str(e))

MODEL_PATH = 'crop_yield_model.joblib'
ENCODER_PATH = 'crop_label_encoder.joblib'
META_PATH = 'crop_yield_model_meta.json'
DIAG_PATH = 'crop_yield_diagnostics.json'

def load_df():
    coll = get_collection('crop_yield_data')
    docs = list(coll.find({}, {'_id': 0}))
    return pd.DataFrame(docs)

def feature_engineer(df: pd.DataFrame):
    df = df.copy()
    # Basic cleaning: unify casing and handle missing textual fields
    for col in ['crop_type','season','state']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
                .replace({'': np.nan, 'none': np.nan, 'nan': np.nan, 'NaN': np.nan})
            )
            # Title case states & seasons (crops keep original except lower duplicates collapsed)
            if col == 'state':
                df[col] = df[col].dropna().str.title().combine_first(df[col])
            if col == 'season':
                df[col] = df[col].dropna().str.title().combine_first(df[col])
            if col == 'crop_type':
                # Normalize crop types to consistent capitalization for multi-word entries
                df[col] = df[col].dropna().str.replace(r'\s+',' ', regex=True).str.strip()

    # Fill still-missing season/state with placeholder
    for col in ['season','state']:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')
    # Ensure mandatory numeric fields exist
    numeric_fill = ['area','production','annual_rainfall','fertilizer_input','pesticide_input','yield']
    for c in numeric_fill:
        if c not in df.columns:
            df[c] = 0.0
        df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0.0)

    # Derive production per area if not present
    if 'yield_per_area' not in df.columns:
        df['yield_per_area'] = np.where(df['area']>0, df['yield']/df['area'], 0.0)

    # Encode season & state as additional signals (optional, could lead to high cardinality)
    season_encoder = LabelEncoder()
    state_encoder = LabelEncoder()
    df['season_encoded'] = season_encoder.fit_transform(df['season'].astype(str))
    df['state_encoded'] = state_encoder.fit_transform(df['state'].astype(str))

    # Primary crop type encoder
    crop_encoder = LabelEncoder()
    df['crop_type_encoded'] = crop_encoder.fit_transform(df['crop_type'].astype(str))

    # Normalized input resources per area (avoid division by zero)
    df['fertilizer_per_area'] = np.where(df['area'] > 0, df['fertilizer_input'] / df['area'], 0.0)
    df['pesticide_per_area'] = np.where(df['area'] > 0, df['pesticide_input'] / df['area'], 0.0)

    feature_cols = [
        'crop_type_encoded','season_encoded','state_encoded',
        'area','annual_rainfall','fertilizer_input','pesticide_input',
        'fertilizer_per_area','pesticide_per_area'
    ]
    # Target: yield (or production per area??) We'll keep existing meaning of 'yield'
    y = df['yield']
    X = df[feature_cols]
    encoders = {
        'crop_type': crop_encoder,
        'season': season_encoder,
        'state': state_encoder
    }
    return X, y, encoders, feature_cols

def save_encoders(encoders: dict):
    joblib.dump(encoders['crop_type'], ENCODER_PATH)
    # Save auxiliary encoders' class labels (season/state) into meta (not separate artifacts)
    return {
        'season_classes': list(encoders['season'].classes_),
        'state_classes': list(encoders['state'].classes_),
        'crop_type_classes': list(encoders['crop_type'].classes_)
    }

def compute_group_stats(df: pd.DataFrame, key_cols):
    g = df.groupby(key_cols)['yield']
    stats = g.agg(['count','mean','std','min','max']).reset_index().sort_values('count')
    return stats.to_dict(orient='records')

def apply_balancing(X, y, df_original, encoders, strategy: str, key: str, rare_threshold: int):
    if strategy == 'none':
        return X, y, None, None
    # Determine grouping key values
    if key == 'crop_state':
        group_series = df_original['crop_type'].astype(str) + '||' + df_original['state'].astype(str)
    else:
        group_series = df_original['crop_type'].astype(str)
    counts = group_series.value_counts().to_dict()
    if strategy == 'sample_weight':
        # Inverse frequency weights
        weights = group_series.map(lambda k: 1.0 / counts[k])
        # Normalize to mean 1
        weights = weights * (len(weights) / weights.sum())
        return X, y, weights.values, {'mode': 'sample_weight'}
    elif strategy == 'oversample':
        target = max(rare_threshold, int(np.median(list(counts.values()))))
        rows = []
        ys = []
        for idx, (row_x, row_y, grp) in enumerate(zip(X.values, y.values, group_series.values)):
            rows.append(row_x)
            ys.append(row_y)
            c = counts[grp]
            if c < target:
                # replicate needed times (simple strategy)
                reps = int(target / c) - 1
                for _ in range(max(0, reps)):
                    rows.append(row_x)
                    ys.append(row_y)
        X_new = pd.DataFrame(rows, columns=X.columns)
        y_new = np.array(ys)
        return X_new, y_new, None, {'mode': 'oversample','target': target}
    return X, y, None, None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--estimators', type=int, default=200)
    parser.add_argument('--test-size', type=float, default=0.15)
    parser.add_argument('--cv', type=int, default=3, help='Cross validation folds')
    parser.add_argument('--balance-strategy', choices=['none','sample_weight','oversample'], default='none', help='Balance rare crops strategy')
    parser.add_argument('--balance-key', choices=['crop','crop_state'], default='crop', help='Grouping key for balancing')
    parser.add_argument('--rare-threshold', type=int, default=40, help='Minimum group count for oversampling target')
    parser.add_argument('--use-log-target', action='store_true', help='Train on log1p(yield) for stability (prediction will be expm1 transformed back).')
    parser.add_argument('--no-calibration', action='store_true', help='Disable per-crop mean ratio calibration.')
    args = parser.parse_args()

    df = load_df()
    if df.empty:
        print('No data in crop_yield_data collection. Import first.')
        return

    X, y, encoders, feature_cols = feature_engineer(df)

    original_y = y.copy()
    target_transform = None
    if args.use_log_target:
        y = np.log1p(y)
        target_transform = 'log1p'

    # Balancing / weighting
    X_bal, y_bal, sample_weight, balance_meta = apply_balancing(
        X, y, df, encoders, args.balance_strategy, args.balance_key, args.rare_threshold
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42
    )

    model = RandomForestRegressor(n_estimators=args.estimators, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train, sample_weight=sample_weight[X_train.index] if sample_weight is not None else None)
    preds = model.predict(X_test)
    # Inverse transform if needed for metrics in original scale
    if target_transform == 'log1p':
        preds_eval = np.expm1(preds)
        y_test_eval = np.expm1(y_test)
    else:
        preds_eval = preds
        y_test_eval = y_test
    mse = mean_squared_error(y_test_eval, preds_eval)
    rmse = mse ** 0.5
    r2 = r2_score(y_test_eval, preds_eval)

    cv_scores = cross_val_score(model, X_bal, y_bal, cv=args.cv, scoring='r2')

    # ------------------------------------------------------------------
    # Per-crop calibration (out-of-fold mean ratio) unless disabled
    # ------------------------------------------------------------------
    calibration_mapping = None
    if not args.no_calibration:
        from sklearn.model_selection import KFold
        kf = KFold(n_splits=args.cv, shuffle=True, random_state=42)
        oof_pred = np.zeros(len(X))
        for tr_idx, va_idx in kf.split(X):
            m_cal = RandomForestRegressor(n_estimators=args.estimators, random_state=42, n_jobs=-1)
            sw = None
            if sample_weight is not None:
                sw = sample_weight[tr_idx]
            m_cal.fit(X.iloc[tr_idx], y.iloc[tr_idx], sample_weight=sw)
            p = m_cal.predict(X.iloc[va_idx])
            if target_transform == 'log1p':
                p = np.expm1(p)
            oof_pred[va_idx] = p
        actual = original_y.values  # original scale
        df_cal = pd.DataFrame({
            'crop_type': df['crop_type'].astype(str).values,
            'actual': actual,
            'pred': oof_pred
        })
        grp = df_cal.groupby('crop_type').agg(actual_mean=('actual','mean'), pred_mean=('pred','mean'), count=('actual','count'))
        per_crop_scale = {}
        for crop_name, row in grp.iterrows():
            pred_mean = row['pred_mean']
            actual_mean = row['actual_mean']
            if pred_mean <= 0 or np.isnan(pred_mean) or np.isnan(actual_mean):
                scale = 1.0
            else:
                scale = actual_mean / pred_mean
            # Clamp extreme factors to avoid instability for very rare crops
            scale = float(np.clip(scale, 0.2, 5.0))
            per_crop_scale[crop_name] = scale
        calibration_mapping = {
            'method': 'oof_mean_ratio',
            'cv_folds': args.cv,
            'per_crop_scale': per_crop_scale
        }

    joblib.dump(model, MODEL_PATH)
    encoder_meta = save_encoders(encoders)

    meta = {
        'trained_at': datetime.utcnow().isoformat(),
        'n_records': int(len(df)),
        'n_estimators': args.estimators,
        'test_size': args.test_size,
        'features': feature_cols,
        'metrics': {
            'mse': float(mse),
            'rmse': float(rmse),
            'r2': float(r2),
            'cv_r2_mean': float(cv_scores.mean()),
            'cv_r2_std': float(cv_scores.std())
        },
        'encoders': encoder_meta,
        'balancing': balance_meta,
        'target_transform': target_transform,
        'calibration': calibration_mapping
    }
    with open(META_PATH, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    # Diagnostics: rare crops list
    diag = {
        'by_crop': compute_group_stats(df, ['crop_type']),
        'by_crop_state': compute_group_stats(df, ['crop_type','state'])[:100],  # limit length
        'balance_strategy': args.balance_strategy,
        'balance_key': args.balance_key,
        'rare_threshold': args.rare_threshold,
        'target_transform': target_transform
    }
    with open(DIAG_PATH,'w',encoding='utf-8') as f:
        json.dump(diag, f, indent=2)

    print('Model trained and saved (with diagnostics).')
    print(json.dumps(meta, indent=2))

if __name__ == '__main__':
    main()
