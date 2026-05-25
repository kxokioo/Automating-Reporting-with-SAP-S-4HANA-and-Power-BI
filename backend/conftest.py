"""
Pytest configuration and shared fixtures
"""
import os
import pytest

# Set pytest environment variable so middleware knows we're in test mode
@pytest.fixture(scope="session", autouse=True)
def set_test_mode():
    original_value = os.environ.get("PYTEST_CURRENT_TEST")
    os.environ["PYTEST_CURRENT_TEST"] = "true"
    yield
    # Restore original value or remove if it wasn't set before
    if original_value is None:
        os.environ.pop("PYTEST_CURRENT_TEST", None)
    else:
        os.environ["PYTEST_CURRENT_TEST"] = original_value
