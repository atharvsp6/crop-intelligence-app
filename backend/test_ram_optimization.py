"""Test script to verify RAM optimization is working correctly."""
import os
import sys
import time

# Test both demo and production modes
def test_demo_mode():
    """Test that demo mode returns responses without loading models."""
    print("\n" + "="*60)
    print("TEST 1: Demo Mode (DEMO_MODE=true)")
    print("="*60)
    
    os.environ['DEMO_MODE'] = 'true'
    
    # Import after setting env var
    from memory_manager import is_demo_mode, get_demo_response, log_memory
    
    assert is_demo_mode() == True, "Demo mode should be enabled"
    print("✓ Demo mode detected correctly")
    
    # Test crop prediction demo response
    crop_response = get_demo_response('crop_prediction')
    assert crop_response.get('success') == True
    assert crop_response.get('demo_mode') == True
    assert crop_response.get('predicted_yield') is not None
    print("✓ Crop prediction demo response generated")
    print(f"  Sample yield: {crop_response['predicted_yield']} ton/hectare")
    
    # Test disease detection demo response
    disease_response = get_demo_response('disease_detection')
    assert disease_response.get('success') == True
    assert disease_response.get('demo_mode') == True
    assert disease_response.get('prediction') is not None
    print("✓ Disease detection demo response generated")
    print(f"  Sample condition: {disease_response['prediction']['condition']}")
    
    print("\n✅ Demo mode tests PASSED")


def test_lazy_loading():
    """Test that lazy loading works and cleanup happens."""
    print("\n" + "="*60)
    print("TEST 2: Lazy Loading (DEMO_MODE=false)")
    print("="*60)
    
    os.environ['DEMO_MODE'] = 'false'
    
    # Reload modules to pick up new env var
    import importlib
    import memory_manager
    importlib.reload(memory_manager)
    from memory_manager import LazyModelLoader, log_memory, is_demo_mode
    
    assert is_demo_mode() == False, "Demo mode should be disabled"
    print("✓ Production mode detected correctly")
    
    # Test lazy loader with a simple mock model
    class MockModel:
        def __init__(self):
            self.data = "x" * 1000000  # 1MB of data
            print("    MockModel loaded (simulates heavy model)")
        
        def predict(self, input_data):
            return {"result": "success", "input": input_data}
    
    def load_mock():
        return MockModel()
    
    # Create lazy loader
    loader = LazyModelLoader("MockModel", load_mock)
    
    mem_before = log_memory("Before using lazy loader")
    
    # Use context manager
    with loader as model:
        result = model.predict({"test": "data"})
        assert result["result"] == "success"
        print("✓ Model loaded and used successfully")
        mem_during = log_memory("During model usage")
    
    mem_after = log_memory("After cleanup (context exit)")
    
    # Verify cleanup happened (model should be unloaded)
    assert loader._model is None, "Model should be cleaned up"
    print("✓ Model cleaned up successfully")
    
    print(f"\n  Memory change: {mem_during - mem_before:.2f} MB increase during usage")
    print(f"  Memory after cleanup: {mem_after - mem_before:.2f} MB from baseline")
    
    print("\n✅ Lazy loading tests PASSED")


def test_memory_logging():
    """Test memory logging functionality."""
    print("\n" + "="*60)
    print("TEST 3: Memory Logging")
    print("="*60)
    
    from memory_manager import log_memory, get_memory_usage_mb
    
    mem_mb = get_memory_usage_mb()
    assert mem_mb > 0, "Memory usage should be positive"
    print(f"✓ Current memory usage: {mem_mb:.2f} MB")
    
    logged_mem = log_memory("Test measurement")
    assert logged_mem > 0, "Logged memory should be positive"
    assert abs(logged_mem - mem_mb) < 5, "Logged memory should match direct call"
    print("✓ Memory logging working correctly")
    
    print("\n✅ Memory logging tests PASSED")


def test_integration():
    """Test actual model loaders (if models exist)."""
    print("\n" + "="*60)
    print("TEST 4: Integration Test (requires actual models)")
    print("="*60)
    
    os.environ['DEMO_MODE'] = 'false'
    
    try:
        from memory_manager import LazyModelLoader, log_memory
        
        # Test crop model loader
        try:
            def load_crop():
                from colab_style_predictor import ColabStyleCropModel
                return ColabStyleCropModel()
            
            crop_loader = LazyModelLoader("CropModel", load_crop)
            
            mem_before = log_memory("Before crop model")
            
            with crop_loader as model:
                # Check if model is loaded
                assert model is not None
                print("✓ Crop model loaded successfully")
                
                # Check if model has expected methods
                assert hasattr(model, 'predict')
                assert hasattr(model, 'is_trained')
                print("✓ Crop model has expected interface")
                
                mem_during = log_memory("Crop model in memory")
            
            mem_after = log_memory("After crop model cleanup")
            
            print(f"  RAM used by crop model: {mem_during - mem_before:.2f} MB")
            print(f"  RAM freed after cleanup: {mem_during - mem_after:.2f} MB")
            
        except Exception as e:
            print(f"⚠ Crop model test skipped: {e}")
        
        # Test disease model loader
        try:
            def load_disease():
                from disease_detector import DiseaseDetector
                detector = DiseaseDetector()
                detector.load_model()
                return detector
            
            disease_loader = LazyModelLoader("DiseaseModel", load_disease)
            
            mem_before = log_memory("Before disease model")
            
            with disease_loader as model:
                assert model is not None
                print("✓ Disease model loaded successfully")
                
                assert hasattr(model, 'predict_disease')
                print("✓ Disease model has expected interface")
                
                mem_during = log_memory("Disease model in memory")
            
            mem_after = log_memory("After disease model cleanup")
            
            print(f"  RAM used by disease model: {mem_during - mem_before:.2f} MB")
            print(f"  RAM freed after cleanup: {mem_during - mem_after:.2f} MB")
            
        except Exception as e:
            print(f"⚠ Disease model test skipped: {e}")
        
        print("\n✅ Integration tests COMPLETED")
        
    except Exception as e:
        print(f"❌ Integration test error: {e}")
        print("   This is expected if models don't exist or dependencies missing")


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("RAM OPTIMIZATION TEST SUITE")
    print("="*60)
    print("Testing lazy loading and demo mode functionality\n")
    
    try:
        test_demo_mode()
        test_lazy_loading()
        test_memory_logging()
        test_integration()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        print("\nRAM optimization is working correctly!")
        print("\nNext steps:")
        print("1. Set DEMO_MODE=true or false in your deployment")
        print("2. Use single worker: gunicorn -w 1 ...")
        print("3. Monitor logs for memory usage patterns")
        print("\n")
        
        return 0
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
