import os
import pytest
import uuid

@pytest.fixture
def unique_email():
    return f"tester_{uuid.uuid4().hex[:8]}@axion.ng"
