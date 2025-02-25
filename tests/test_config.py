from app.config import settings
from app.utils.file_ops import get_data_file_path, get_model_file_path, setup_logging
import logging
import pandas as pd
import json

def test_directory_structure():
    """Test that all required directories exist"""
    print("\n1. Testing Directory Structure:")
    directories = [
        settings.PROJECT_ROOT,
        settings.DATA_DIR,
        settings.MODELS_DIR,
        settings.LOGS_DIR
    ]
    
    for directory in directories:
        exists = directory.exists()
        print(f"Directory {directory}: {'✓ exists' if exists else '✗ missing'}")
        assert exists, f"Directory {directory} does not exist"

def test_file_operations():
    """Test file operations with test data"""
    print("\n2. Testing File Operations:")
    
    # Create a test CSV file
    test_data = pd.DataFrame({
        'test_column': ['test_value']
    })
    
    # Test data file operations
    data_path = get_data_file_path("test.csv")
    test_data.to_csv(data_path, index=False)
    print(f"✓ Created test CSV at {data_path}")
    
    # Test model file operations
    model_path = get_model_file_path("test_model.json")
    test_model = {'test': 'model'}
    with open(model_path, 'w') as f:
        json.dump(test_model, f)
    print(f"✓ Created test model at {model_path}")

def test_logging():
    """Test logging configuration"""
    print("\n3. Testing Logging:")
    setup_logging()
    logging.info("Test log message")
    log_file = settings.LOGS_DIR / "app.log"
    
    exists = log_file.exists()
    print(f"Log file {log_file}: {'✓ exists' if exists else '✗ missing'}")
    assert exists, "Log file was not created"

def main():
    """Run all tests"""
    print("Starting Configuration Tests")
    print("=" * 50)
    
    try:
        test_directory_structure()
        test_file_operations()
        test_logging()
        print("\n✓ All tests passed successfully!")
    except AssertionError as e:
        print(f"\n✗ Test failed: {str(e)}")
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main() 