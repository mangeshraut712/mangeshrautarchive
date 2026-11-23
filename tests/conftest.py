"""Isolate before test-module imports, including direct pytest invocations."""
import os
from api.local_safety import assert_local_database_environment, install_local_network_guard

assert_local_database_environment()
for name in list(os.environ):
    if any(part in name.upper() for part in ("TOKEN", "SECRET", "PASSWORD", "API_KEY", "SERVICE_ROLE", "CREDENTIAL")):
        os.environ.pop(name, None)
os.environ["PORTFOLIO_LOCAL_ONLY"] = "1"
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
install_local_network_guard()
