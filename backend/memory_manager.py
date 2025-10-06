"""Memory management utilities for RAM-constrained deployments."""
import os
import gc
import psutil
from functools import wraps
import traceback


def get_memory_usage_mb():
    """Get current memory usage in MB."""
    try:
        process = psutil.Process()
        return process.memory_info().rss / (1024 * 1024)
    except Exception:
        return 0


def log_memory(label=""):
    """Log current memory usage."""
    mem_mb = get_memory_usage_mb()
    print(f"[Memory] {label}: {mem_mb:.2f} MB")
    return mem_mb


def cleanup_model(model_obj, model_name="model"):
    """Explicitly cleanup a model and force garbage collection."""
    if model_obj is not None:
        try:
            # For TensorFlow/Keras models
            if hasattr(model_obj, 'clear_session'):
                model_obj.clear_session()
            
            # For scikit-learn models
            if hasattr(model_obj, '__dict__'):
                model_obj.__dict__.clear()
            
            del model_obj
            gc.collect()
            print(f"[Memory] Cleaned up {model_name}")
        except Exception as e:
            print(f"[Memory] Error cleaning {model_name}: {e}")


def with_memory_management(model_loader_func, model_name="model"):
    """Decorator for memory-managed model loading and cleanup.
    
    Args:
        model_loader_func: Function that loads and returns the model
        model_name: Name for logging purposes
    
    Usage:
        @with_memory_management(lambda: load_my_model(), "MyModel")
        def predict_endpoint():
            # model is available as a local variable
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check if demo mode is enabled
            demo_mode = os.environ.get('DEMO_MODE', 'false').lower() in ('true', '1', 'yes')
            
            if demo_mode:
                print(f"[Memory] DEMO_MODE enabled, skipping {model_name} loading")
                return func(*args, demo_mode=True, **kwargs)
            
            model = None
            try:
                mem_before = log_memory(f"Before loading {model_name}")
                
                # Load model
                model = model_loader_func()
                
                mem_after = log_memory(f"After loading {model_name}")
                print(f"[Memory] {model_name} loaded, used {mem_after - mem_before:.2f} MB")
                
                # Call the wrapped function with the model
                result = func(*args, model=model, demo_mode=False, **kwargs)
                
                return result
            finally:
                # Always cleanup
                if model is not None:
                    cleanup_model(model, model_name)
                    log_memory(f"After cleanup {model_name}")
        
        return wrapper
    return decorator


class LazyModelLoader:
    """Base class for lazy-loaded models."""
    
    def __init__(self, model_name, loader_func):
        self.model_name = model_name
        self.loader_func = loader_func
        self._model = None
        self._loaded = False
    
    def load(self):
        """Load the model if not already loaded."""
        if self._loaded and self._model is not None:
            return self._model
        
        try:
            mem_before = log_memory(f"Before loading {self.model_name}")
            self._model = self.loader_func()
            self._loaded = True
            mem_after = log_memory(f"After loading {self.model_name}")
            print(f"[Memory] {self.model_name} loaded, used {mem_after - mem_before:.2f} MB")
            return self._model
        except Exception as e:
            print(f"[Memory] Error loading {self.model_name}: {e}")
            traceback.print_exc()
            self._loaded = False
            self._model = None
            raise
    
    def unload(self):
        """Explicitly unload the model and free memory."""
        if self._model is not None:
            cleanup_model(self._model, self.model_name)
            self._model = None
            self._loaded = False
    
    def __enter__(self):
        """Context manager entry."""
        return self.load()
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup."""
        self.unload()


def is_demo_mode():
    """Check if demo mode is enabled."""
    return os.environ.get('DEMO_MODE', 'false').lower() in ('true', '1', 'yes')


def get_demo_response(endpoint_type, input_data=None):
    """Generate demo responses for different endpoint types."""
    
    if endpoint_type == 'crop_prediction':
        return {
            'success': True,
            'predicted_yield': 4.25,
            'yield_unit': 'ton/hectare',
            'model_confidence': 0.92,
            'feature_count': 18,
            'target_mean': 3.8,
            'target_std': 0.6,
            'comparison_to_average_percent': 11.84,
            'yield_category': 'above_average',
            'yield_category_label': 'Above average',
            'confidence_interval': {
                'lower': 3.8,
                'upper': 4.7
            },
            'demo_mode': True,
            'note': 'This is a demo response. Set DEMO_MODE=false to use actual ML models.'
        }
    
    elif endpoint_type == 'disease_detection':
        return {
            'success': True,
            'prediction': {
                'plant_type': 'Tomato',
                'condition': 'Early blight',
                'confidence': 0.87,
                'is_healthy': False,
                'severity': 'Medium',
                'plant_likelihood': 0.95
            },
            'top_predictions': [
                {
                    'class': 'Tomato___Early_blight',
                    'plant_type': 'Tomato',
                    'confidence': 0.87
                },
                {
                    'class': 'Tomato___Late_blight',
                    'plant_type': 'Tomato',
                    'confidence': 0.08
                },
                {
                    'class': 'Tomato___healthy',
                    'plant_type': 'Tomato',
                    'confidence': 0.05
                }
            ],
            'recommendations': {
                'immediate_actions': [
                    'Isolate affected plants if possible',
                    'Remove infected plant parts',
                    'Improve air circulation around plants'
                ],
                'preventive_measures': [
                    'Apply preventive fungicide spray',
                    'Avoid overhead watering',
                    'Clean garden tools between uses'
                ],
                'treatment_options': [
                    'Use neem oil or copper fungicides',
                    'Apply appropriate fungicide treatment',
                    'Consult local agricultural extension office'
                ]
            },
            'demo_mode': True,
            'note': 'This is a demo response. Set DEMO_MODE=false to use actual ML models.'
        }
    
    return {
        'success': False,
        'error': 'Unknown demo endpoint type',
        'demo_mode': True
    }
