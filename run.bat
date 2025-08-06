@echo off
echo ========================================
echo   Auto Shorts Generator
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created.
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if requirements are installed
pip show opencv-python >nul 2>&1
if errorlevel 1 (
    echo Installing requirements...
    pip install -r requirements.txt
    echo.
)

REM Run the example script
echo Running Auto Shorts Generator...
echo.
python run_example.py

REM Deactivate virtual environment
deactivate

echo.
echo Press any key to exit...
pause >nul