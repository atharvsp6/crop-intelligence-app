import numpy as np
import pandas as pd
import warnings
from sklearn.exceptions import DataConversionWarning
warnings.filterwarnings('ignore', category=UserWarning, module='sklearn')
warnings.filterwarnings('ignore', category=DataConversionWarning, module='sklearn')
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from database import get_collection
import json
# SHAP is optional; editor may warn until dependency installed in runtime env
import shap

class CropYieldPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.label_encoder = LabelEncoder()  # legacy crop_type encoder
        # New engineered feature placeholders (optional)
        self.additional_encoders = {}
        self.is_trained = False
        self.model_path = 'crop_yield_model.joblib'
        self.encoder_path = 'crop_label_encoder.joblib'
        self._shap_explainer = None
        self._shap_features_sig = None  # track feature ordering used in explainer
        self.target_transform = None  # e.g. 'log1p'
        self.calibration = None
        self._crop_scale_cache = None
        
    def load_data_from_db(self):
        """Load crop yield data from MongoDB"""
        collection = get_collection('crop_yield_data')
        data = list(collection.find({}, {'_id': 0}))
        return pd.DataFrame(data)
    
    def prepare_features(self, df):
        """Prepare features for training/prediction.

        Legacy path expects agronomic features (temperature, humidity, etc.).
        New broader dataset may contain: area, annual_rainfall, fertilizer_input, pesticide_input, season/state codes.
        We auto-detect available schema.
        """
        df_copy = df.copy()

        # Determine schema type
        has_legacy = {'temperature','humidity','ph','rainfall','nitrogen','phosphorus','potassium'}.issubset(df_copy.columns)
        has_extended = {'annual_rainfall','fertilizer_input','pesticide_input','season','state'}.issubset(df_copy.columns)

        # Encode crop types (always)
        df_copy['crop_type_encoded'] = self.label_encoder.fit_transform(df_copy['crop_type'])

        feature_list = ['crop_type_encoded']
        target_col = 'yield' if 'yield' in df_copy.columns else None

        if has_legacy:
            feature_list += ['temperature','humidity','ph','rainfall','nitrogen','phosphorus','potassium']
        elif has_extended:
            # Encode season/state
            from sklearn.preprocessing import LabelEncoder as _LE
            season_le = _LE(); state_le = _LE()
            df_copy['season_encoded'] = season_le.fit_transform(df_copy['season'].astype(str))
            df_copy['state_encoded'] = state_le.fit_transform(df_copy['state'].astype(str))
            self.additional_encoders = {
                'season': season_le,
                'state': state_le
            }
            feature_list += ['season_encoded','state_encoded','annual_rainfall','fertilizer_input','pesticide_input','area']
            # Ensure area exists
            if 'area' not in df_copy.columns:
                df_copy['area'] = 0.0
        else:
            # Minimal fallback: just crop type
            pass

        X = df_copy[feature_list]
        y = df_copy[target_col] if target_col else None
        return X, y, feature_list
    
    def train_model(self):
        """Train the Random Forest model with data from database"""
        try:
            # Load data
            df = self.load_data_from_db()
            if df.empty:
                raise ValueError("No training data available in database")
            
            # Prepare features
            X, y, feature_list = self.prepare_features(df)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Train model
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            self.is_trained = True
            
            # Save model and encoder
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.label_encoder, self.encoder_path)
            
            return {
                'success': True,
                'mse': float(mse),
                'r2_score': float(r2),
                'message': 'Model trained successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def load_model(self):
        """Load trained model and encoder"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.encoder_path):
                self.model = joblib.load(self.model_path)
                self.label_encoder = joblib.load(self.encoder_path)
                # Attempt to load meta for extended feature ordering
                meta_path = 'crop_yield_model_meta.json'
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path,'r',encoding='utf-8') as f:
                            self.model_meta = json.load(f)
                            self.target_transform = self.model_meta.get('target_transform')
                            self.calibration = self.model_meta.get('calibration')
                            # Reconstruct season/state encoders' classes for consistent encoding
                            enc = self.model_meta.get('encoders', {})
                            try:
                                from sklearn.preprocessing import LabelEncoder as _LE
                                if enc.get('season_classes'):
                                    le_season = _LE(); le_season.classes_ = np.array(enc['season_classes'])
                                else:
                                    le_season = None
                                if enc.get('state_classes'):
                                    le_state = _LE(); le_state.classes_ = np.array(enc['state_classes'])
                                else:
                                    le_state = None
                                self.additional_encoders = {'season': le_season, 'state': le_state}
                            except Exception:
                                pass
                    except Exception:
                        self.model_meta = None
                        self.target_transform = None
                else:
                    self.model_meta = None
                    self.target_transform = None
                    self.calibration = None
                self.is_trained = True
                return True
            return False
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def predict_yield(self, crop_data):
        """Predict crop yield based on input parameters"""
        try:
            if not self.is_trained and not self.load_model():
                # Train model if not already trained
                train_result = self.train_model()
                if not train_result['success']:
                    return train_result
            
            # Prepare input data
            input_df = pd.DataFrame([crop_data])
            
            # Check if crop type exists in encoder
            rare_flag = False
            if crop_data['crop_type'] not in self.label_encoder.classes_:
                # Fallback to most frequent known crop (approx) -> use first class
                rare_flag = True
                original_crop = crop_data['crop_type']
                crop_data['crop_type'] = self.label_encoder.classes_[0]
            
            input_df['crop_type_encoded'] = self.label_encoder.transform([crop_data['crop_type']])
            
            # Derive normalized ratios if extended-style inputs present
            if 'fertilizer_input' in input_df.columns and 'area' in input_df.columns and 'fertilizer_per_area' not in input_df.columns:
                with np.errstate(divide='ignore', invalid='ignore'):
                    input_df['fertilizer_per_area'] = np.where(input_df['area']>0, input_df['fertilizer_input']/input_df['area'], 0.0)
            if 'pesticide_input' in input_df.columns and 'area' in input_df.columns and 'pesticide_per_area' not in input_df.columns:
                with np.errstate(divide='ignore', invalid='ignore'):
                    input_df['pesticide_per_area'] = np.where(input_df['area']>0, input_df['pesticide_input']/input_df['area'], 0.0)

            # Use meta features if available (extended model)
            meta_features = getattr(self, 'model_meta', {}).get('features') if hasattr(self, 'model_meta') and self.model_meta else None
            if meta_features:
                # Provide missing engineered encodings / defaults
                if 'season_encoded' in meta_features and 'season_encoded' not in input_df.columns:
                    if self.additional_encoders.get('season') and 'season' in input_df.columns:
                        # Normalize season text to Title case (training normalization) and attempt encoding
                        enc = self.additional_encoders['season']
                        input_df['season'] = input_df['season'].astype(str).str.strip().str.title()
                        try:
                            input_df['season_encoded'] = enc.transform(input_df['season'])
                        except Exception:
                            # Fallback to 0 if unseen label
                            input_df['season_encoded'] = 0
                            rare_flag = True
                    else:
                        input_df['season_encoded'] = 0
                if 'state_encoded' in meta_features and 'state_encoded' not in input_df.columns:
                    if self.additional_encoders.get('state') and 'state' in input_df.columns:
                        encs = self.additional_encoders['state']
                        input_df['state'] = input_df['state'].astype(str).str.strip().str.title()
                        try:
                            input_df['state_encoded'] = encs.transform(input_df['state'])
                        except Exception:
                            input_df['state_encoded'] = 0
                            rare_flag = True
                    else:
                        input_df['state_encoded'] = 0
                for f in meta_features:
                    if f not in input_df.columns:
                        input_df[f] = 0
                features = meta_features
            else:
                legacy_fields = ['temperature','humidity','ph','rainfall','nitrogen','phosphorus','potassium']
                for f in legacy_fields:
                    if f not in input_df.columns:
                        input_df[f] = 0
                features = ['crop_type_encoded'] + legacy_fields
            X_input = input_df[features]
            
            # Make prediction
            prediction = self.model.predict(X_input)
            raw_prediction = prediction.copy()
            # Inverse transform if model trained on transformed target
            if getattr(self, 'target_transform', None) == 'log1p':
                try:
                    prediction = np.expm1(prediction)
                except Exception:
                    pass

            # Apply per-crop calibration scaling if available and crop_type present
            calibration_factor = 1.0
            if self.calibration and isinstance(self.calibration, dict):
                per_crop = self.calibration.get('per_crop_scale') or {}
                crop_name = crop_data.get('crop_type')
                if crop_name in per_crop:
                    calibration_factor = per_crop[crop_name]
                    prediction = prediction * calibration_factor
            
            # Get feature importance
            # Determine feature names used
            features_used = X_input.columns.tolist()
            feature_importance = dict(zip(features_used, getattr(self.model, 'feature_importances_', [0]*len(features_used))))
            
            response = {
                'success': True,
                'predicted_yield': float(prediction[0]),  # original (human) scale
                'raw_predicted_yield': float(raw_prediction[0]) if getattr(self, 'target_transform', None) else float(prediction[0]),
                'feature_importance': {k: float(v) for k, v in feature_importance.items()},
                'confidence_interval': self._calculate_confidence_interval(X_input, transform=getattr(self, 'target_transform', None)),
                'schema': 'extended' if meta_features else 'legacy',
                # Dataset yields represent tonnes per hectare (t/ha) for most crops historically
                'yield_unit': 't/ha'
            }
            if getattr(self, 'target_transform', None):
                response['target_transform'] = self.target_transform
            if calibration_factor != 1.0:
                response['calibration_factor'] = float(calibration_factor)
            if rare_flag:
                response['note'] = 'Input crop not in trained classes; substituted with approximate class.'
            return response
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_confidence_interval(self, X_input, confidence=0.95, transform=None):
        """Calculate prediction confidence interval"""
        try:
            # Get predictions from all trees
            predictions = np.array([tree.predict(X_input)[0] for tree in self.model.estimators_])
            # If target trained in log space, invert each tree prediction for interval on original scale
            if transform == 'log1p':
                with np.errstate(over='ignore'):
                    predictions = np.expm1(predictions)
            
            # Calculate confidence interval
            alpha = 1 - confidence
            lower = np.percentile(predictions, (alpha/2) * 100)
            upper = np.percentile(predictions, (1 - alpha/2) * 100)
            
            return {
                'lower': float(lower),
                'upper': float(upper),
                'std': float(np.std(predictions))
            }
        except:
            return {'lower': 0, 'upper': 0, 'std': 0}

# Initialize predictor instance
crop_predictor = CropYieldPredictor()

def generate_shap_explanation(predictor: CropYieldPredictor, crop_data: dict):
    """Generate SHAP values for a single prediction.

    Loads model if needed, constructs the feature row in the same order as training meta,
    and returns base_value, shap_values per feature, and predicted_yield.
    """
    # Ensure model & meta loaded
    predictor.load_model()
    meta_features = getattr(predictor, 'model_meta', {}).get('features') if getattr(predictor, 'model_meta', None) else None
    if not meta_features:
        return {'success': False, 'error': 'Model metadata with feature list not available for SHAP.'}

    # Prepare prediction path (reuse predict to ensure encodings & defaults)
    pred_result = predictor.predict_yield(crop_data)
    if not pred_result.get('success'):
        return pred_result

    # Build DataFrame for SHAP with one row
    row_df = pd.DataFrame([crop_data])
    # Reproduce encodings/engineered columns
    if 'crop_type' in row_df.columns and crop_data['crop_type'] not in predictor.label_encoder.classes_:
        row_df['crop_type'] = ['wheat']
    row_df['crop_type_encoded'] = predictor.label_encoder.transform(row_df['crop_type'])
    if 'season_encoded' in meta_features and 'season_encoded' not in row_df.columns:
        row_df['season_encoded'] = 0
    if 'state_encoded' in meta_features and 'state_encoded' not in row_df.columns:
        row_df['state_encoded'] = 0
    if 'area' not in row_df.columns:
        row_df['area'] = 0
    if 'annual_rainfall' not in row_df.columns:
        row_df['annual_rainfall'] = 0
    if 'fertilizer_input' not in row_df.columns:
        row_df['fertilizer_input'] = 0
    if 'pesticide_input' not in row_df.columns:
        row_df['pesticide_input'] = 0
    if 'fertilizer_per_area' not in row_df.columns:
        row_df['fertilizer_per_area'] = np.where(row_df['area']>0, row_df['fertilizer_input']/row_df['area'], 0.0)
    if 'pesticide_per_area' not in row_df.columns:
        row_df['pesticide_per_area'] = np.where(row_df['area']>0, row_df['pesticide_input']/row_df['area'], 0.0)
    for f in meta_features:
        if f not in row_df.columns:
            row_df[f] = 0

    X = row_df[meta_features]
    # Use a small background sample for TreeExplainer base value (first 50 rows from DB if available)
    background = None
    try:
        df_full = predictor.load_data_from_db()
        if not df_full.empty:
            # Mirror feature engineering minimal subset
            if 'crop_type' in df_full.columns:
                df_full['crop_type_encoded'] = predictor.label_encoder.fit_transform(df_full['crop_type'].astype(str))
            if 'fertilizer_input' in df_full.columns and 'area' in df_full.columns:
                df_full['fertilizer_per_area'] = np.where(df_full['area']>0, df_full['fertilizer_input']/df_full['area'], 0.0)
            if 'pesticide_input' in df_full.columns and 'area' in df_full.columns:
                df_full['pesticide_per_area'] = np.where(df_full['area']>0, df_full['pesticide_input']/df_full['area'], 0.0)
            background = df_full[meta_features].head(50)
    except Exception:
        pass
    # Reuse cached explainer if valid
    if predictor._shap_explainer is None or predictor._shap_features_sig != tuple(meta_features):
        predictor._shap_explainer = shap.TreeExplainer(
            predictor.model,
            data=background,
            feature_perturbation="tree_path_dependent"
        )
        predictor._shap_features_sig = tuple(meta_features)
    explainer = predictor._shap_explainer
    shap_vals = explainer.shap_values(X)
    base = explainer.expected_value
    contrib_array = shap_vals[0]
    contribs = dict(zip(meta_features, [float(v) for v in contrib_array]))

    result = {
        'success': True,
        # Already inverse-transformed in pred_result if needed
        'predicted_yield': pred_result.get('predicted_yield'),
        'base_value': float(base if not isinstance(base, (list, np.ndarray)) else base[0]),
        'shap_values': contribs,
        'features': meta_features,
        'target_transform': predictor.target_transform
    }
    if predictor.target_transform == 'log1p':
        # Provide raw (log space) prediction components for transparency
        result['raw_predicted_yield'] = pred_result.get('raw_predicted_yield')
        result['note'] = 'Model trained on log1p(yield); base_value and shap_values are in log space. Predicted_yield shown after inverse expm1 transform.'
    return result