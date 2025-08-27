#!/bin/bash

echo "🚀 Starting Cross-Chain Transfer Simulator..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "go.mod" ]; then
    echo "❌ Please run this script from the crossChain directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
go mod tidy

# Run tests
echo "🧪 Running tests..."
go test ./test/...

# Start the simulator
echo "🌟 Starting simulator on http://localhost:8080"
echo "📱 Open your browser and navigate to: http://localhost:8080"
echo "🛑 Press Ctrl+C to stop the simulator"
echo ""

go run main.go 