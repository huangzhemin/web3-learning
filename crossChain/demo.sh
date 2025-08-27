#!/bin/bash

echo "🚀 Cross-Chain Transfer Simulator Demo"
echo "======================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:8081/api/v1/stats > /dev/null; then
    echo "❌ Server is not running. Please start the simulator first:"
    echo "   cd crossChain && go run main.go"
    exit 1
fi

echo "✅ Server is running on http://localhost:8081"
echo ""

# 1. Show available networks
echo "📊 1. Available Blockchain Networks:"
echo "-----------------------------------"
curl -s http://localhost:8081/api/v1/networks | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8081/api/v1/networks
echo ""

# 2. Show system statistics
echo "📈 2. System Statistics:"
echo "----------------------"
curl -s http://localhost:8081/api/v1/stats | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8081/api/v1/stats
echo ""

# 3. Create test accounts (simulated)
echo "👤 3. Creating Test Accounts..."
echo "-------------------------------"
echo "Note: In a real implementation, accounts would be created via API"
echo "For demo purposes, we'll simulate account creation"
echo ""

# 4. Show transfer history
echo "📋 4. Transfer History:"
echo "---------------------"
curl -s http://localhost:8081/api/v1/transfers | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8081/api/v1/transfers
echo ""

# 5. Web Interface
echo "🌐 5. Web Interface:"
echo "------------------"
echo "Open your browser and navigate to: http://localhost:8081"
echo "The web interface provides:"
echo "  • Real-time network monitoring"
echo "  • Cross-chain transfer initiation"
echo "  • Transfer history and status tracking"
echo "  • WebSocket real-time updates"
echo ""

# 6. API Documentation
echo "📚 6. Available API Endpoints:"
echo "----------------------------"
echo "GET  /api/v1/networks              - List all networks"
echo "GET  /api/v1/networks/{id}         - Get specific network info"
echo "GET  /api/v1/stats                 - Get system statistics"
echo "GET  /api/v1/transfers             - List all transfers"
echo "POST /api/v1/transfers             - Initiate cross-chain transfer"
echo "GET  /api/v1/transfers/{id}        - Get specific transfer"
echo "WS   /api/v1/ws                    - WebSocket for real-time updates"
echo ""

# 7. Example transfer request
echo "💡 7. Example Cross-Chain Transfer Request:"
echo "------------------------------------------"
echo 'curl -X POST http://localhost:8081/api/v1/transfers \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
echo '    "source_network": "ethereum-mainnet",
echo '    "target_network": "polygon-mainnet",
echo '    "source_address": "0x1234567890123456789012345678901234567890",
echo '    "target_address": "0x0987654321098765432109876543210987654321",
echo '    "amount": "1000000000000000000"
echo '  }'"'"''
echo ""

echo "🎉 Demo completed! The Cross-Chain Transfer Simulator is ready to use."
echo "Visit http://localhost:8081 to access the web interface." 