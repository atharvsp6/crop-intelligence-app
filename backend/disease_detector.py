import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import base64
import os
import json

class DiseaseDetector:
    def __init__(self):
        self.model = None
        self.class_names = [
            'Apple___Apple_scab',
            'Apple___Black_rot',
            'Apple___Cedar_apple_rust',
            'Apple___healthy',
            'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
            'Corn_(maize)___Common_rust_',
            'Corn_(maize)___Northern_Leaf_Blight',
            'Corn_(maize)___healthy',
            'Tomato___Bacterial_spot',
            'Tomato___Early_blight',
            'Tomato___Late_blight',
            'Tomato___Leaf_Mold',
            'Tomato___healthy'
        ]
        self.model_path = '../model/plant_disease_model.h5'
        self.confidence_threshold = 0.7
        
    def create_sample_model(self):
        """Create a sample disease detection model if none exists"""
        try:
            # Create a simple CNN model for demonstration
            model = keras.Sequential([
                keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
                keras.layers.MaxPooling2D(2, 2),
                keras.layers.Conv2D(64, (3, 3), activation='relu'),
                keras.layers.MaxPooling2D(2, 2),
                keras.layers.Conv2D(128, (3, 3), activation='relu'),
                keras.layers.MaxPooling2D(2, 2),
                keras.layers.Flatten(),
                keras.layers.Dropout(0.5),
                keras.layers.Dense(512, activation='relu'),
                keras.layers.Dense(len(self.class_names), activation='softmax')
            ])
            
            model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Create dummy training data for the model
            dummy_x = np.random.random((100, 224, 224, 3))
            dummy_y = keras.utils.to_categorical(
                np.random.randint(0, len(self.class_names), 100), 
                len(self.class_names)
            )
            
            # Train briefly to initialize weights
            model.fit(dummy_x, dummy_y, epochs=1, verbose=0)
            
            # Save the model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            model.save(self.model_path)
            
            return True
        except Exception as e:
            print(f"Error creating sample model: {e}")
            return False
    
    def load_model(self):
        """Load the disease detection model"""
        try:
            if not os.path.exists(self.model_path):
                print("Model not found, creating sample model...")
                if not self.create_sample_model():
                    return False
            
            self.model = keras.models.load_model(self.model_path)
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def preprocess_image(self, image_data):
        """Preprocess image for model prediction.

        Accepts either a base64 string (optionally prefixed with data URI) or raw bytes.
        Returns: (image_array, plant_likelihood)
        """
        try:
            # If bytes provided convert to base64 handling uniformly
            if isinstance(image_data, bytes):
                image_bytes = image_data
            else:
                if image_data.startswith('data:image'):
                    # Remove data URL prefix
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)

            image = Image.open(io.BytesIO(image_bytes))

            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Compute a simple "plant likelihood" heuristic on original (or current) image
            plant_likelihood = self._estimate_plant_likelihood(image)

            # Resize to model input size
            image_resized = image.resize((224, 224))

            # Convert to array and normalize
            image_array = np.array(image_resized) / 255.0
            image_array = np.expand_dims(image_array, axis=0)

            return image_array, plant_likelihood
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {e}")

    def _estimate_plant_likelihood(self, image):
        """Estimate how likely the image contains plant foliage.

        Heuristic: proportion of pixels where green channel dominates red & blue and is above a brightness threshold.
        Returns float in [0,1].
        """
        try:
            np_img = np.array(image)
            if len(np_img.shape) != 3 or np_img.shape[2] < 3:
                return 0.0
            r = np_img[:, :, 0].astype(np.int32)
            g = np_img[:, :, 1].astype(np.int32)
            b = np_img[:, :, 2].astype(np.int32)
            green_dom = (g > r + 5) & (g > b + 5) & (g > 60)
            plant_likelihood = float(green_dom.mean())
            return plant_likelihood
        except Exception:
            return 0.0
    
    def predict_disease(self, image_data):
        """Predict plant disease from image"""
        try:
            # Load model if not already loaded
            if self.model is None:
                if not self.load_model():
                    return {
                        'success': False,
                        'error': 'Failed to load disease detection model'
                    }
            
            # Preprocess image & estimate plant likelihood
            processed_image, plant_likelihood = self.preprocess_image(image_data)

            # Reject if plant likelihood too low
            if plant_likelihood < 0.12:  # threshold can be tuned
                return {
                    'success': False,
                    'error': 'Image does not appear to contain a plant. Please upload a clear plant image (leaves, stem, fruit).',
                    'plant_likelihood': plant_likelihood
                }
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            predicted_class_index = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_index])
            
            # Get predicted class name
            predicted_class = self.class_names[predicted_class_index]
            
            # Extract plant type and condition
            parts = predicted_class.split('___')
            plant_type = parts[0].replace('_', ' ')
            condition = parts[1].replace('_', ' ') if len(parts) > 1 else 'Unknown'
            
            # Get top 3 predictions
            top_3_indices = np.argsort(predictions[0])[-3:][::-1]
            top_3_predictions = [
                {
                    'class': self.class_names[i],
                    'plant_type': self.class_names[i].split('___')[0].replace('_', ' '),
                    'condition': self.class_names[i].split('___')[1].replace('_', ' ') if '___' in self.class_names[i] else 'Unknown',
                    'confidence': float(predictions[0][i])
                }
                for i in top_3_indices
            ]
            
            # Generate recommendations
            recommendations = self._get_treatment_recommendations(condition, confidence)
            
            return {
                'success': True,
                'prediction': {
                    'plant_type': plant_type,
                    'condition': condition,
                    'confidence': confidence,
                    'is_healthy': 'healthy' in condition.lower(),
                    'severity': self._assess_severity(condition, confidence),
                    'plant_likelihood': plant_likelihood
                },
                'top_predictions': top_3_predictions,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _assess_severity(self, condition, confidence):
        """Assess disease severity based on condition and confidence"""
        if 'healthy' in condition.lower():
            return 'None'
        elif confidence > 0.8:
            return 'High'
        elif confidence > 0.6:
            return 'Medium'
        else:
            return 'Low'
    
    def _get_treatment_recommendations(self, condition, confidence):
        """Get treatment recommendations based on detected condition"""
        recommendations = {
            'immediate_actions': [],
            'preventive_measures': [],
            'treatment_options': []
        }
        
        condition_lower = condition.lower()
        
        if 'healthy' in condition_lower:
            recommendations['immediate_actions'] = [
                'Continue current care practices',
                'Monitor plant regularly for any changes'
            ]
            recommendations['preventive_measures'] = [
                'Maintain proper watering schedule',
                'Ensure adequate spacing between plants',
                'Keep soil well-drained'
            ]
        else:
            # General disease recommendations
            recommendations['immediate_actions'] = [
                'Isolate affected plants if possible',
                'Remove infected plant parts',
                'Improve air circulation around plants'
            ]
            
            recommendations['preventive_measures'] = [
                'Apply preventive fungicide spray',
                'Avoid overhead watering',
                'Clean garden tools between uses',
                'Rotate crops annually'
            ]
            
            recommendations['treatment_options'] = [
                'Apply appropriate fungicide treatment',
                'Consult local agricultural extension office',
                'Consider organic treatment alternatives'
            ]
            
            # Specific recommendations based on disease type
            if 'blight' in condition_lower:
                recommendations['treatment_options'].append('Use copper-based fungicides')
                recommendations['preventive_measures'].append('Avoid watering leaves directly')
            
            elif 'rust' in condition_lower:
                recommendations['treatment_options'].append('Apply sulfur-based fungicides')
                recommendations['preventive_measures'].append('Increase spacing between plants')
            
            elif 'spot' in condition_lower:
                recommendations['treatment_options'].append('Use neem oil or copper fungicides')
                recommendations['preventive_measures'].append('Remove fallen leaves regularly')
        
        return recommendations

# Initialize detector instance
disease_detector = DiseaseDetector()