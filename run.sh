#!/bin/bash

echo "========================================"
echo "   Auto Shorts Generator"
echo "========================================"
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created."
    echo
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if ! pip show opencv-python &> /dev/null; then
    echo "Installing requirements..."
    pip install -r requirements.txt
    echo
fi

# Run the example script
echo "Running Auto Shorts Generator..."
echo
python run_example.py

# Deactivate virtual environment
deactivate

echo
echo "Press Enter to exit..."
read