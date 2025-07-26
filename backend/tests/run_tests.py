#!/usr/bin/env python3
"""
Test runner for MercadoSniper backend tests.

This script provides convenient ways to run different test suites:
- All tests
- Unit tests only  
- Integration tests only
- Canonical vehicle tests only
- Specific test files or functions

Usage:
    python tests/run_tests.py                    # Run all tests
    python tests/run_tests.py --unit             # Run unit tests only
    python tests/run_tests.py --integration      # Run integration tests only
    python tests/run_tests.py --canonical        # Run canonical vehicle tests only
    python tests/run_tests.py --file test_canonical_vehicle_service.py  # Run specific file
    python tests/run_tests.py --coverage         # Run with coverage report
    python tests/run_tests.py --verbose          # Run with verbose output
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


def run_command(cmd, description):
    """Run a command and handle the result"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, cwd=backend_dir, check=True)
        print(f"\n✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"\n❌ pytest not found. Please install it with: pip install pytest pytest-asyncio")
        return False


def main():
    """Main test runner function"""
    parser = argparse.ArgumentParser(description="MercadoSniper test runner")
    
    # Test selection options
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--canonical", action="store_true", help="Run canonical vehicle tests only")
    parser.add_argument("--file", help="Run specific test file")
    parser.add_argument("--function", help="Run specific test function")
    
    # Output options
    parser.add_argument("--coverage", action="store_true", help="Run with coverage report")
    parser.add_argument("--verbose", action="store_true", help="Run with verbose output")
    parser.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    parser.add_argument("--fast", action="store_true", help="Run tests in fast mode (skip slow tests)")
    
    args = parser.parse_args()
    
    # Check if pytest is available
    try:
        subprocess.run(["python", "-m", "pytest", "--version"], 
                      capture_output=True, check=True, cwd=backend_dir)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ pytest not found. Installing required packages...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "pytest", "pytest-asyncio", "pytest-cov"], 
                          check=True, cwd=backend_dir)
            print("✅ Test dependencies installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install test dependencies. Please install manually:")
            print("   pip install pytest pytest-asyncio pytest-cov")
            return False
    
    # Build pytest command
    cmd = ["python", "-m", "pytest"]
    
    # Add test selection
    if args.unit:
        cmd.extend(["-m", "unit"])
        description = "Unit Tests"
    elif args.integration:
        cmd.extend(["-m", "integration"])
        description = "Integration Tests"
    elif args.canonical:
        cmd.extend(["-k", "canonical"])
        description = "Canonical Vehicle Tests"
    elif args.file:
        cmd.append(f"tests/{args.file}")
        description = f"Tests in {args.file}"
    elif args.function:
        cmd.extend(["-k", args.function])
        description = f"Test function: {args.function}"
    else:
        cmd.append("tests/")
        description = "All Tests"
    
    # Add output options
    if args.coverage:
        cmd.extend(["--cov=services", "--cov=models", "--cov=api", 
                   "--cov-report=html", "--cov-report=term-missing"])
        description += " (with coverage)"
    
    if args.verbose:
        cmd.append("-v")
        description += " (verbose)"
    
    if args.parallel:
        cmd.extend(["-n", "auto"])
        description += " (parallel)"
    
    if args.fast:
        cmd.extend(["-m", "not slow"])
        description += " (fast mode)"
    
    # Add configuration
    cmd.extend(["--tb=short", "--disable-warnings"])
    
    # Run the tests
    success = run_command(cmd, description)
    
    if success:
        print(f"\n🎉 All tests passed!")
        if args.coverage:
            print(f"📊 Coverage report generated in: {backend_dir}/htmlcov/index.html")
    else:
        print(f"\n💥 Some tests failed. Check the output above for details.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 