#!/usr/bin/env python
import subprocess
import sys

# Upgrade pip first
subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip", "wheel", "setuptools"])

# Install requirements
subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "-r", "requirements.txt"])

print("\n✓ Dependencies upgraded successfully!")
