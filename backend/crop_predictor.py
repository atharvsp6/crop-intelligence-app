import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from database import get_collection

class CropYieldPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.model_path = 'crop_yield_model.joblib'
        self.encoder_path = 'crop_label_encoder.joblib'
        
    def load_data_from_db(self):
        """Load crop yield data from MongoDB"""
        collection = get_collection('crop_yield_data')
        data = list(collection.find({}, {'_id': 0}))
        return pd.DataFrame(data)
    
    def prepare_features(self, df):
        """Prepare features for training/prediction"""
        # Encode crop types
        df_copy = df.copy()
        df_copy['crop_type_encoded'] = self.label_encoder.fit_transform(df_copy['crop_type'])
        
        # Select features
        features = ['crop_type_encoded', 'temperature', 'humidity', 'ph', 
                   'rainfall', 'nitrogen', 'phosphorus', 'potassium']
        
        X = df_copy[features]
        y = df_copy['yield'] if 'yield' in df_copy.columns else None
        
        return X, y
    
    def train_model(self):
        """Train the Random Forest model with data from database"""
        try:
            # Load data
            df = self.load_data_from_db()
            if df.empty:
                raise ValueError("No training data available in database")
            
            # Prepare features
            X, y = self.prepare_features(df)
            
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
            if crop_data['crop_type'] not in self.label_encoder.classes_:
                # Add new crop type or use most similar
                crop_data['crop_type'] = 'wheat'  # Default fallback
            
            input_df['crop_type_encoded'] = self.label_encoder.transform([crop_data['crop_type']])
            
            # Select features in correct order
            features = ['crop_type_encoded', 'temperature', 'humidity', 'ph', 
                       'rainfall', 'nitrogen', 'phosphorus', 'potassium']
            X_input = input_df[features]
            
            # Make prediction
            prediction = self.model.predict(X_input)
            
            # Get feature importance
            feature_importance = dict(zip(features, self.model.feature_importances_))
            
            return {
                'success': True,
                'predicted_yield': float(prediction[0]),
                'feature_importance': {k: float(v) for k, v in feature_importance.items()},
                'confidence_interval': self._calculate_confidence_interval(X_input)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_confidence_interval(self, X_input, confidence=0.95):
        """Calculate prediction confidence interval"""
        try:
            # Get predictions from all trees
            predictions = np.array([tree.predict(X_input)[0] for tree in self.model.estimators_])
            
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