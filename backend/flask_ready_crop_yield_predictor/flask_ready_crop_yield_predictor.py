import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import warnings

# Suppress SettingWithCopyWarning, which is common in pandas operations
warnings.filterwarnings('ignore', category=pd.core.common.SettingWithCopyWarning)

class CropYieldPredictor:
    """
    A class to train a Random Forest model and predict crop yield.

    This class encapsulates the entire pipeline:
    1. Loading and preprocessing data.
    2. Training the model.
    3. Preprocessing new input data and making predictions.
    """
    def __init__(self):
        """
        Initializes the predictor with None for model and preprocessing objects.
        These will be populated during the training phase.
        """
        self.model = None
        self.encoders = {}
        self.feature_columns = None
        self.training_data_mean = None
        # --- Configuration Constants ---
        self.RANDOM_STATE = 42
        self.N_ESTIMATORS = 200
        self.OUTLIER_CAP_PERCENTILE = 0.99
        self.GDD_BASE_TEMP = 10

    def train(self, yield_data_path='crop_yield.csv', custom_data_path='Custom_Crops_yield_Historical_Dataset.csv'):
        """
        Loads data, preprocesses it, and trains the Random Forest Regressor model.
        The trained model, encoders, and feature columns are stored as class attributes.
        """
        # --- 1. Load Data ---
        try:
            df_yield = pd.read_csv(yield_data_path)
            df_custom = pd.read_csv(custom_data_path)
            print("Training data files loaded successfully.")
        except FileNotFoundError as e:
            print(f"Error loading training data: {e}")
            return

        # --- 2. Data Cleaning and Preprocessing ---
        df_yield.dropna(inplace=True)
        df_yield.rename(columns={'Crop_Year': 'Year', 'State': 'State Name', 'Yield': 'Yield_ton_per_hec'}, inplace=True)
        for col in ['Season', 'State Name', 'Crop']:
            if df_yield[col].dtype == 'object':
                df_yield[col] = df_yield[col].str.strip().str.lower()

        df_custom.rename(columns={'Area_ha': 'Area'}, inplace=True)
        custom_numeric_cols = [
            'N_req_kg_per_ha', 'P_req_kg_per_ha', 'K_req_kg_per_ha', 'Temperature_C',
            'Humidity_%', 'pH', 'Rainfall_mm', 'Wind_Speed_m_s', 'Solar_Radiation_MJ_m2_day'
        ]
        df_custom_agg = df_custom.groupby(['State Name', 'Year', 'Crop'])[custom_numeric_cols].mean().reset_index()
        df_custom_agg['State Name'] = df_custom_agg['State Name'].str.strip().str.lower()
        df_custom_agg['Crop'] = df_custom_agg['Crop'].str.strip().str.lower()

        # --- 3. Merge Datasets ---
        merged_df = pd.merge(df_yield, df_custom_agg, on=['State Name', 'Year', 'Crop'], how='left')

        # --- 4. Feature Engineering ---
        if 'Production' in merged_df.columns:
            merged_df = merged_df.drop('Production', axis=1)
        
        merged_df['Temp_Rain_Interaction'] = merged_df['Temperature_C'] * merged_df['Rainfall_mm']
        merged_df['Humidity_pH_Interaction'] = merged_df['Humidity_%'] * merged_df['pH']
        merged_df['Fertilizer_Pesticide_Interaction'] = merged_df['Fertilizer'] * merged_df['Pesticide']
        merged_df['Temperature_C_sq'] = merged_df['Temperature_C']**2
        merged_df['GDD'] = (merged_df['Temperature_C'] - self.GDD_BASE_TEMP).apply(lambda x: max(0, x))
        merged_df['Rainfall_mm_sq'] = merged_df['Rainfall_mm']**2
        merged_df['pH_sq'] = merged_df['pH']**2

        # --- 5. Handle Missing Values and Outliers ---
        numerical_cols = merged_df.select_dtypes(include=np.number).columns
        self.training_data_mean = merged_df[numerical_cols].mean()
        merged_df[numerical_cols] = merged_df[numerical_cols].fillna(self.training_data_mean)

        for col in merged_df.select_dtypes(include=np.number).columns:
            upper_limit = merged_df[col].quantile(self.OUTLIER_CAP_PERCENTILE)
            merged_df[col] = merged_df[col].clip(upper=upper_limit)

        # --- 6. Encode Categorical Features ---
        categorical_features = ['State Name', 'Season', 'Crop']
        for col in categorical_features:
            le = LabelEncoder()
            merged_df[col] = le.fit_transform(merged_df[col])
            self.encoders[col] = le

        # --- 7. Define Features (X) and Target (y) ---
        X = merged_df.drop('Yield_ton_per_hec', axis=1)
        y = merged_df['Yield_ton_per_hec']
        self.feature_columns = X.columns.tolist() # Store the final feature columns

        # --- 8. Train and Store the Final Model ---
        self.model = RandomForestRegressor(
            n_estimators=self.N_ESTIMATORS,
            random_state=self.RANDOM_STATE,
            n_jobs=-1,
            oob_score=True
        )
        self.model.fit(X, y)
        print("Model training complete.")
        print(f"Model OOB Score: {self.model.oob_score_:.4f}")

    def predict(self, custom_input):
        """
        Makes a yield prediction based on a dictionary of custom input values.
        """
        if self.model is None:
            raise RuntimeError("Model has not been trained yet. Please call the 'train' method first.")

        # --- 1. Create DataFrame from input ---
        custom_df = pd.DataFrame([custom_input])

        # --- 2. Preprocess Input Data ---
        for col in ['State Name', 'Season', 'Crop']:
            if col in custom_df.columns:
                custom_df[col] = custom_df[col].str.strip().str.lower()
                
                # Handle unseen labels
                unseen_labels = set(custom_df[col]) - set(self.encoders[col].classes_)
                if unseen_labels:
                    print(f"Warning: Unseen label '{list(unseen_labels)[0]}' in column '{col}'. Replacing with most frequent value.")
                    # Replace with the first class (often the most frequent)
                    known_label = self.encoders[col].classes_[0]
                    custom_df[col] = custom_df[col].replace(list(unseen_labels), known_label)
                
                # Apply fitted encoder
                custom_df[col] = self.encoders[col].transform(custom_df[col])

        # --- 3. Feature Engineering ---
        custom_df['Temp_Rain_Interaction'] = custom_df['Temperature_C'] * custom_df['Rainfall_mm']
        custom_df['Humidity_pH_Interaction'] = custom_df['Humidity_%'] * custom_df['pH']
        custom_df['Fertilizer_Pesticide_Interaction'] = custom_df['Fertilizer'] * custom_df['Pesticide']
        custom_df['Temperature_C_sq'] = custom_df['Temperature_C']**2
        custom_df['GDD'] = (custom_df['Temperature_C'] - self.GDD_BASE_TEMP).apply(lambda x: max(0, x))
        custom_df['Rainfall_mm_sq'] = custom_df['Rainfall_mm']**2
        custom_df['pH_sq'] = custom_df['pH']**2

        # --- 4. Align Columns with Training Data ---
        # Add missing columns and fill with training data's mean
        for col in self.feature_columns:
            if col not in custom_df.columns:
                custom_df[col] = self.training_data_mean[col]

        # Ensure the column order is exactly the same as during training
        custom_df = custom_df[self.feature_columns]
        
        # --- 5. Make Prediction ---
        prediction = self.model.predict(custom_df)
        
        # Ensure prediction is non-negative
        final_prediction = max(0, prediction[0])
        
        return final_prediction

# --- Example of how to use the class ---
if __name__ == '__main__':
    # 1. Initialize the predictor
    predictor = CropYieldPredictor()

    # 2. Train the model (this should be done once when your Flask app starts)
    # Make sure 'crop_yield.csv' and 'Custom_Crops_yield_Historical_Dataset.csv' are present
    predictor.train()

    # 3. Define a custom input for prediction
    # This dictionary would come from your Flask API request (e.g., request.json)
    custom_input = {
        'Crop': 'rice',
        'Year': 2024,
        'Season': 'kharif',
        'State Name': 'andhra pradesh',
        'Area': 1500.0,
        'Annual_Rainfall': 1300.0,
        'Fertilizer': 6000000.0,
        'Pesticide': 12000.0,
        'N_req_kg_per_ha': 80.0,
        'P_req_kg_per_ha': 35.0,
        'K_req_kg_per_ha': 55.0,
        'Temperature_C': 26.0,
        'Humidity_%': 72.0,
        'pH': 6.8,
        'Rainfall_mm': 1200.0,
        'Wind_Speed_m_s': 2.8,
        'Solar_Radiation_MJ_m2_day': 20.0
    }

    # 4. Make a prediction
    predicted_yield = predictor.predict(custom_input)

    print("\n--- Custom Input Prediction ---")
    print(f"Predicted Yield: {predicted_yield:.4f} ton/hec")
    print("-----------------------------\n")

    # Example with an unseen state to test the warning
    custom_input_unseen = custom_input.copy()
    custom_input_unseen['State Name'] = 'new york' # This state was not in the training data
    predicted_yield_unseen = predictor.predict(custom_input_unseen)
    
    print("\n--- Prediction with Unseen State ---")
    print(f"Predicted Yield: {predicted_yield_unseen:.4f} ton/hec")
    print("------------------------------------\n")
```

### How to Integrate into Flask

1.  **Save the file:** Save the code above as `crop_yield_model.py` in your Flask project directory.
2.  **Modify your main Flask app file (e.g., `app.py`):**

    ```python
    # app.py

    from flask import Flask, request, jsonify
    from crop_yield_model import CropYieldPredictor
    import os

    app = Flask(__name__)

    # --- Global Model Object ---
    # Create a single instance of our predictor
    # This will be shared across all requests
    predictor = None

    def initialize_model():
        """
        Initializes and trains the model.
        This function is called once when the application starts.
        """
        global predictor
        if predictor is None:
            print(" * Initializing and training model...")
            predictor = CropYieldPredictor()
            
            # Make sure the data files are in the same directory
            yield_data_path = 'crop_yield.csv'
            custom_data_path = 'Custom_Crops_yield_Historical_Dataset.csv'
            
            if not os.path.exists(yield_data_path) or not os.path.exists(custom_data_path):
                 raise FileNotFoundError(
                    "Model training files not found. Ensure 'crop_yield.csv' and "
                    "'Custom_Crops_yield_Historical_Dataset.csv' are in the project directory."
                )
                
            predictor.train(yield_data_path, custom_data_path)
            print(" * Model trained and ready.")

    @app.route('/predict', methods=['POST'])
    def predict_yield():
        """
        API endpoint to predict crop yield.
        Expects a JSON payload with the required features.
        """
        if predictor is None:
            return jsonify({'error': 'Model is not initialized.'}), 503

        try:
            # Get the JSON data from the request
            input_data = request.json
            
            # Make a prediction
            predicted_yield = predictor.predict(input_data)
            
            # Return the prediction as a JSON response
            return jsonify({
                'predicted_yield_ton_per_hec': predicted_yield
            })

        except Exception as e:
            # Handle potential errors (e.g., missing keys in JSON)
            return jsonify({'error': str(e)}), 400

    if __name__ == '__main__':
        # Initialize the model before starting the app
        initialize_model()
        # Run the Flask app
        app.run(debug=True)
    
