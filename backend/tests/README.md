# MercadoSniper Backend Tests

This directory contains comprehensive tests for the MercadoSniper backend application, with a focus on the canonical vehicle system.

## 📁 Test Structure

```
tests/
├── __init__.py                           # Package initialization
├── conftest.py                          # Pytest configuration and fixtures
├── pytest.ini                          # Pytest configuration file
├── run_tests.py                         # Test runner script
├── README.md                            # This file
├── TEST_RESULTS.md                      # Test results and system status
├── test_canonical_vehicle_service.py   # Unit tests for canonical vehicle service
├── test_vehicle_service.py             # Unit tests for vehicle service
├── test_integration.py                 # Integration tests
└── test_canonical_grouping_demo.py     # Demo/manual test script
```

## 🏃‍♂️ Running Tests

### Quick Start

```bash
# Run all tests
python tests/run_tests.py

# Run with verbose output
python tests/run_tests.py --verbose

# Run with coverage report
python tests/run_tests.py --coverage
```

### Test Categories

```bash
# Unit tests only
python tests/run_tests.py --unit

# Integration tests only  
python tests/run_tests.py --integration

# Canonical vehicle tests only
python tests/run_tests.py --canonical

# Run specific test file
python tests/run_tests.py --file test_canonical_vehicle_service.py

# Run specific test function
python tests/run_tests.py --function test_similarity_calculation
```

### Manual Test Scripts

```bash
# Run the canonical grouping demo
python tests/test_canonical_grouping_demo.py
```

## 🧪 Test Categories

### Unit Tests

**Location**: `test_canonical_vehicle_service.py`, `test_vehicle_service.py`

Test individual functions and methods in isolation using mock databases:

- **Canonical Vehicle Service Tests**:
  - Vehicle similarity calculation
  - String normalization
  - Engine comparison
  - Canonical title generation
  - Body type extraction
  - Statistics updates

- **Vehicle Service Tests**:
  - CRUD operations
  - Search functionality
  - Price history recording
  - Pagination
  - Statistics calculation

### Integration Tests

**Location**: `test_integration.py`

Test complete workflows from end-to-end:

- **Full Grouping Workflow**: Vehicle creation → Canonical grouping → Statistics
- **Price Update Workflow**: Price changes → History recording → Stats update
- **Search Integration**: Multiple vehicle creation → Search → Filtering
- **Market Analysis**: Multiple listings → Statistics → Analysis

### Demo Tests

**Location**: `test_canonical_grouping_demo.py`

Manual demonstration script that shows:
- Similarity algorithm in action
- Real-world grouping scenarios
- Edge case handling
- Visual output of grouping results

## 🔧 Test Configuration

### Fixtures (conftest.py)

- **`mock_database`**: In-memory database mock for testing
- **`canonical_service`**: Canonical vehicle service instance
- **`vehicle_service`**: Vehicle service instance  
- **`sample_vehicle_data`**: Pre-configured test vehicle data
- **`sample_canonical_data`**: Pre-configured canonical vehicle data

### Mock Database

The test suite uses a comprehensive mock database that simulates:
- MongoDB collections (canonical_vehicles, vehicles, price_history, alerts)
- Async operations (find, find_one, insert_one, update_one, delete_one)
- Cursor operations (to_list)
- Query result simulation

## 📊 Test Coverage

Run tests with coverage to see code coverage:

```bash
python tests/run_tests.py --coverage
```

This generates:
- Terminal coverage report
- HTML coverage report in `htmlcov/index.html`

### Coverage Targets

- **Services**: `services/` directory
- **Models**: `models/` directory  
- **API Routes**: `api/` directory

## ✅ Test Scenarios

### Canonical Vehicle Grouping

**Similar Vehicles (Should Group Together)**:
```python
Honda Civic 2020 LX Automático
Honda Civic LX 2020 Turbo Automático  
HONDA CIVIC LX 2020 1.5 TURBO
```

**Different Vehicles (Should Stay Separate)**:
```python
Honda Civic 2020 LX        # Base case
Honda Civic 2019 LX        # Different year
Honda Civic 2020 Sport     # Different edition
Toyota Corolla 2020 XEI    # Different brand/model
Honda Accord 2020 EX-L     # Different model
```

### Similarity Algorithm Testing

- **Exact Match**: 100% similarity
- **Same brand/model, different edition**: ~90% similarity
- **Same brand/model, different year**: ~90% similarity
- **Different model, same brand**: ~70% similarity
- **Different brand**: ~40% similarity

### String Normalization Testing

- Case variations: `HONDA` = `Honda` = `honda`
- Hyphen handling: `Honda-Civic` → `honda civic`
- Whitespace: `  Honda  Civic  ` → `honda civic`
- Special characters: Removed appropriately

## 🐛 Debugging Tests

### Verbose Output

```bash
python tests/run_tests.py --verbose
```

### Running Single Tests

```bash
# Run just similarity tests
python tests/run_tests.py --function similarity

# Run just integration tests
python tests/run_tests.py --integration
```

### Debug Mode

Add debug prints or breakpoints in test files:

```python
import pdb; pdb.set_trace()  # Add breakpoint
print(f"Debug: {variable}")   # Add debug output
```

## 📈 Performance Testing

### Fast Mode

Skip slow tests:

```bash
python tests/run_tests.py --fast
```

### Parallel Testing

Run tests in parallel (requires pytest-xdist):

```bash
python tests/run_tests.py --parallel
```

## 🔍 Test Development Guidelines

### Writing New Tests

1. **Follow naming convention**: `test_<functionality>.py`
2. **Use descriptive test names**: `test_create_canonical_vehicle_with_valid_data`
3. **Use appropriate fixtures**: Leverage existing fixtures in `conftest.py`
4. **Add docstrings**: Explain what the test verifies
5. **Use assertions effectively**: Clear, specific assertions

### Example Test Structure

```python
@pytest.mark.asyncio
async def test_vehicle_grouping_similar_vehicles(self, canonical_service, sample_vehicle_data):
    """Test that similar vehicles are grouped under the same canonical vehicle"""
    # Arrange
    vehicle1 = sample_vehicle_data[0]
    vehicle2 = sample_vehicle_data[1]  # Similar to vehicle1
    
    # Act
    canonical_id1 = await canonical_service.find_or_create_canonical_vehicle(vehicle1)
    canonical_id2 = await canonical_service.find_or_create_canonical_vehicle(vehicle2)
    
    # Assert
    assert canonical_id1 == canonical_id2
    assert canonical_id1 is not None
```

### Test Markers

Use pytest markers to categorize tests:

```python
@pytest.mark.unit
@pytest.mark.canonical
@pytest.mark.slow
async def test_complex_functionality(...):
    ...
```

## 🚀 Continuous Integration

Tests are designed to run in CI/CD environments:

- **No external dependencies**: Uses mock database
- **Fast execution**: Unit tests complete quickly
- **Comprehensive coverage**: Tests critical business logic
- **Clear output**: Easy to identify failures

## 📋 Test Checklist

Before deploying canonical vehicle system:

- [ ] All unit tests pass
- [ ] All integration tests pass  
- [ ] Coverage above 80%
- [ ] Demo script shows correct grouping
- [ ] No test warnings or errors
- [ ] Performance tests within acceptable limits

## 🆘 Common Issues

### Import Errors

If you see import errors, ensure you're running from the backend directory:

```bash
cd backend
python tests/run_tests.py
```

### Async Issues

Make sure async tests use `@pytest.mark.asyncio`:

```python
@pytest.mark.asyncio
async def test_async_function(...):
    result = await some_async_function()
    assert result is not None
```

### Mock Database Issues

If mock database isn't working, check:
1. Fixture is properly imported
2. Async methods are awaited
3. Mock methods return expected data types

## 📞 Support

For test-related issues:

1. Check test output for specific error messages
2. Run tests with `--verbose` flag for more details
3. Check that all dependencies are installed
4. Verify you're in the correct directory (`backend/`)
5. Review the test documentation above 