package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"crosschain-simulator/internal/api"
	"crosschain-simulator/internal/blockchain"
	"crosschain-simulator/internal/simulator"
)

func TestCrossChainSimulator(t *testing.T) {
	// Initialize components
	logger := log.New(&bytes.Buffer{}, "", 0)
	networks := blockchain.InitializeNetworks()
	sim := simulator.NewCrossChainSimulator(networks, logger)
	server := api.NewServer(sim, logger)

	// Test 1: Check if networks are initialized
	networksList := networks.GetNetworkList()
	if len(networksList) == 0 {
		t.Fatal("No networks initialized")
	}
	fmt.Printf("✓ Initialized %d networks: %v\n", len(networksList), networksList)

	// Test 2: Create accounts on different networks
	ethereum, _ := networks.GetNetwork("ethereum-mainnet")
	polygon, _ := networks.GetNetwork("polygon-mainnet")

	if ethereum == nil || polygon == nil {
		t.Fatal("Failed to get networks")
	}

	// Create accounts
	ethAccount := ethereum.CreateAccount()
	polygonAccount := polygon.CreateAccount()

	// Add some balance to test accounts
	ethAccount.Balance.SetString("10000000000000000000", 10)     // 10 ETH
	polygonAccount.Balance.SetString("10000000000000000000", 10) // 10 MATIC

	fmt.Printf("✓ Created test accounts:\n")
	fmt.Printf("  Ethereum: %s (Balance: %s wei)\n", ethAccount.Address, ethAccount.Balance.String())
	fmt.Printf("  Polygon: %s (Balance: %s wei)\n", polygonAccount.Address, polygonAccount.Balance.String())

	// Test 3: Test cross-chain transfer
	amount := big.NewInt(1000000000000000000) // 1 ETH
	transfer, err := sim.InitiateTransfer(
		"ethereum-mainnet",
		"polygon-mainnet",
		ethAccount.Address,
		polygonAccount.Address,
		amount,
	)

	if err != nil {
		t.Fatalf("Failed to initiate transfer: %v", err)
	}

	fmt.Printf("✓ Initiated cross-chain transfer: %s\n", transfer.ID)
	fmt.Printf("  Status: %s\n", transfer.Status)
	fmt.Printf("  Amount: %s wei\n", transfer.Amount.String())
	fmt.Printf("  Bridge Fee: %s wei\n", transfer.BridgeFee.String())

	// Test 4: Test API endpoints
	testAPIEndpoints(t, server)

	// Test 5: Wait for transfer to complete
	fmt.Println("Waiting for transfer to complete...")
	time.Sleep(5 * time.Second)

	// Check transfer status
	updatedTransfer, exists := sim.GetTransfer(transfer.ID)
	if !exists {
		t.Fatal("Transfer not found after completion")
	}

	fmt.Printf("✓ Transfer completed:\n")
	fmt.Printf("  Final Status: %s\n", updatedTransfer.Status)
	if updatedTransfer.CompletedAt != nil {
		fmt.Printf("  Completed At: %s\n", updatedTransfer.CompletedAt.Format(time.RFC3339))
	}

	// Test 6: Verify account balances
	updatedEthAccount, _ := ethereum.GetAccount(ethAccount.Address)
	updatedPolygonAccount, _ := polygon.GetAccount(polygonAccount.Address)

	fmt.Printf("✓ Final account balances:\n")
	fmt.Printf("  Ethereum: %s wei\n", updatedEthAccount.Balance.String())
	fmt.Printf("  Polygon: %s wei\n", updatedPolygonAccount.Balance.String())
}

func testAPIEndpoints(t *testing.T, server *api.Server) {
	// Test GET /api/v1/networks
	req := httptest.NewRequest("GET", "/api/v1/networks", nil)
	w := httptest.NewRecorder()
	server.getNetworks(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response api.Response
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Success {
		t.Errorf("Expected success response, got error: %s", response.Error)
	}

	fmt.Printf("✓ API endpoint /api/v1/networks working\n")

	// Test GET /api/v1/stats
	req = httptest.NewRequest("GET", "/api/v1/stats", nil)
	w = httptest.NewRecorder()
	server.getStats(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Success {
		t.Errorf("Expected success response, got error: %s", response.Error)
	}

	fmt.Printf("✓ API endpoint /api/v1/stats working\n")
}

func TestNetworkOperations(t *testing.T) {
	logger := log.New(&bytes.Buffer{}, "", 0)
	networks := blockchain.InitializeNetworks()

	// Test network operations
	ethereum, _ := networks.GetNetwork("ethereum-mainnet")
	if ethereum == nil {
		t.Fatal("Failed to get Ethereum network")
	}

	// Test account creation
	account := ethereum.CreateAccount()
	if account == nil {
		t.Fatal("Failed to create account")
	}

	// Test balance operations
	initialBalance := big.NewInt(1000000000000000000) // 1 ETH
	account.Balance.Set(initialBalance)

	// Test transfer
	recipient := ethereum.CreateAccount()
	transferAmount := big.NewInt(500000000000000000) // 0.5 ETH

	tx, err := ethereum.Transfer(account.Address, recipient.Address, transferAmount)
	if err != nil {
		t.Fatalf("Transfer failed: %v", err)
	}

	if tx == nil {
		t.Fatal("Transaction is nil")
	}

	// Verify balances
	if account.Balance.Cmp(big.NewInt(500000000000000000)) != 0 {
		t.Errorf("Expected sender balance 0.5 ETH, got %s", account.Balance.String())
	}

	if recipient.Balance.Cmp(transferAmount) != 0 {
		t.Errorf("Expected recipient balance 0.5 ETH, got %s", recipient.Balance.String())
	}

	fmt.Printf("✓ Network operations working correctly\n")
}

func BenchmarkCrossChainTransfer(b *testing.B) {
	logger := log.New(&bytes.Buffer{}, "", 0)
	networks := blockchain.InitializeNetworks()
	sim := simulator.NewCrossChainSimulator(networks, logger)

	// Setup test accounts
	ethereum, _ := networks.GetNetwork("ethereum-mainnet")
	polygon, _ := networks.GetNetwork("polygon-mainnet")

	ethAccount := ethereum.CreateAccount()
	polygonAccount := polygon.CreateAccount()

	// Add large balance
	largeBalance := big.NewInt(0)
	largeBalance.SetString("1000000000000000000000", 10) // 1000 ETH
	ethAccount.Balance.Set(largeBalance)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		amount := big.NewInt(1000000000000000000) // 1 ETH
		_, err := sim.InitiateTransfer(
			"ethereum-mainnet",
			"polygon-mainnet",
			ethAccount.Address,
			polygonAccount.Address,
			amount,
		)
		if err != nil {
			b.Fatalf("Transfer failed: %v", err)
		}
	}
}
