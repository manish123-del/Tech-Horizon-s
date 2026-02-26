#!/bin/bash
# AI Voice Chatbot Setup Script for macOS/Linux

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  AI VOICE CHATBOT - SETUP SCRIPT FOR macOS/LINUX"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found!"
    echo "  Install with: brew install python3 (macOS) or sudo apt-get install python3 (Linux)"
    exit 1
fi

echo "✓ Python found!"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv chatbot_env

if [ $? -ne 0 ]; then
    echo "✗ Failed to create virtual environment"
    exit 1
fi

echo "✓ Virtual environment created!"
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source chatbot_env/bin/activate

if [ $? -ne 0 ]; then
    echo "✗ Failed to activate virtual environment"
    exit 1
fi

echo "✓ Virtual environment activated!"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

echo ""
echo "Installing dependencies..."
echo "This may take a few minutes..."
echo ""

# Install requirements
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✓ SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Virtual environment is activated"
echo "2. Run: python main.py"
echo "3. Select Voice Mode when prompted"
echo ""
echo "To manually activate virtual environment later:"
echo "   source chatbot_env/bin/activate"
echo ""
