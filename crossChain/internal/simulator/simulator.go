package simulator

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"sync"
	"time"

	"crosschain-simulator/internal/blockchain"
)

// CrossChainSimulator handles cross-chain transfers
type CrossChainSimulator struct {
	networks   *blockchain.NetworkManager
	transfers  map[string]*blockchain.CrossChainTransfer
	mu         sync.RWMutex
	logger     *log.Logger
	bridgeFees map[string]*big.Int // Network ID -> bridge fee
	processing chan *blockchain.CrossChainTransfer
}

// NewCrossChainSimulator creates a new cross-chain simulator
func NewCrossChainSimulator(networks *blockchain.NetworkManager, logger *log.Logger) *CrossChainSimulator {
	sim := &CrossChainSimulator{
		networks:   networks,
		transfers:  make(map[string]*blockchain.CrossChainTransfer),
		logger:     logger,
		bridgeFees: make(map[string]*big.Int),
		processing: make(chan *blockchain.CrossChainTransfer, 100),
	}

	// Initialize bridge fees
	sim.initializeBridgeFees()

	// Start processing transfers
	go sim.processTransfers()

	return sim
}

// initializeBridgeFees sets up bridge fees for different networks
func (sim *CrossChainSimulator) initializeBridgeFees() {
	// Bridge fees in wei (simplified)
	sim.bridgeFees["ethereum-mainnet"] = big.NewInt(1000000000000000000) // 1 ETH
	sim.bridgeFees["polygon-mainnet"] = big.NewInt(100000000000000000)   // 0.1 MATIC
	sim.bridgeFees["bsc-mainnet"] = big.NewInt(50000000000000000)        // 0.05 BNB
	sim.bridgeFees["avalanche-mainnet"] = big.NewInt(100000000000000000) // 0.1 AVAX
	sim.bridgeFees["arbitrum-mainnet"] = big.NewInt(500000000000000000)  // 0.5 ETH
}

// InitiateTransfer starts a cross-chain transfer
func (sim *CrossChainSimulator) InitiateTransfer(
	sourceNetwork, targetNetwork, sourceAddress, targetAddress string,
	amount *big.Int,
) (*blockchain.CrossChainTransfer, error) {
	sim.mu.Lock()
	defer sim.mu.Unlock()

	// Validate networks
	sourceNet, exists := sim.networks.GetNetwork(sourceNetwork)
	if !exists {
		return nil, fmt.Errorf("source network %s not found", sourceNetwork)
	}

	_, exists = sim.networks.GetNetwork(targetNetwork)
	if !exists {
		return nil, fmt.Errorf("target network %s not found", targetNetwork)
	}

	if sourceNetwork == targetNetwork {
		return nil, fmt.Errorf("source and target networks must be different")
	}

	// Validate source account
	sourceAccount, exists := sourceNet.GetAccount(sourceAddress)
	if !exists {
		return nil, fmt.Errorf("source account %s not found", sourceAddress)
	}

	// Calculate total amount needed (transfer + bridge fee)
	bridgeFee := sim.getBridgeFee(sourceNetwork)
	totalAmount := new(big.Int).Add(amount, bridgeFee)

	// Check balance
	if sourceAccount.Balance.Cmp(totalAmount) < 0 {
		return nil, fmt.Errorf("insufficient balance. Need %s, have %s",
			totalAmount.String(), sourceAccount.Balance.String())
	}

	// Create transfer record
	transferID := generateTransferID()
	transfer := &blockchain.CrossChainTransfer{
		ID:            transferID,
		SourceNetwork: sourceNetwork,
		TargetNetwork: targetNetwork,
		SourceAddress: sourceAddress,
		TargetAddress: targetAddress,
		Amount:        amount,
		Status:        "pending",
		CreatedAt:     time.Now(),
		BridgeFee:     bridgeFee,
	}

	sim.transfers[transferID] = transfer

	// Deduct amount from source account
	sourceAccount.Balance.Sub(sourceAccount.Balance, totalAmount)
	sourceAccount.Nonce++

	// Create source transaction
	sourceTx, err := sourceNet.Transfer(sourceAddress, "0x0000000000000000000000000000000000000000", totalAmount)
	if err != nil {
		return nil, fmt.Errorf("failed to create source transaction: %v", err)
	}

	transfer.SourceTxHash = sourceTx.Hash
	transfer.Status = "processing"

	sim.logger.Printf("Cross-chain transfer initiated: %s from %s to %s",
		transferID, sourceNetwork, targetNetwork)

	// Send to processing queue
	sim.processing <- transfer

	return transfer, nil
}

// GetTransfer retrieves a transfer by ID
func (sim *CrossChainSimulator) GetTransfer(id string) (*blockchain.CrossChainTransfer, bool) {
	sim.mu.RLock()
	defer sim.mu.RUnlock()
	transfer, exists := sim.transfers[id]
	return transfer, exists
}

// GetAllTransfers returns all transfers
func (sim *CrossChainSimulator) GetAllTransfers() []*blockchain.CrossChainTransfer {
	sim.mu.RLock()
	defer sim.mu.RUnlock()

	var transfers []*blockchain.CrossChainTransfer
	for _, transfer := range sim.transfers {
		transfers = append(transfers, transfer)
	}
	return transfers
}

// GetTransfersByStatus returns transfers filtered by status
func (sim *CrossChainSimulator) GetTransfersByStatus(status string) []*blockchain.CrossChainTransfer {
	sim.mu.RLock()
	defer sim.mu.RUnlock()

	var transfers []*blockchain.CrossChainTransfer
	for _, transfer := range sim.transfers {
		if transfer.Status == status {
			transfers = append(transfers, transfer)
		}
	}
	return transfers
}

// processTransfers handles the processing of cross-chain transfers
func (sim *CrossChainSimulator) processTransfers() {
	for transfer := range sim.processing {
		go sim.processTransfer(transfer)
	}
}

// processTransfer processes a single cross-chain transfer
func (sim *CrossChainSimulator) processTransfer(transfer *blockchain.CrossChainTransfer) {
	sim.logger.Printf("Processing transfer %s", transfer.ID)

	// Simulate processing time (2-5 seconds)
	processingTime := time.Duration(3) * time.Second
	time.Sleep(processingTime)

	// Get target network
	targetNet, exists := sim.networks.GetNetwork(transfer.TargetNetwork)
	if !exists {
		sim.updateTransferStatus(transfer.ID, "failed")
		sim.logger.Printf("Transfer %s failed: target network not found", transfer.ID)
		return
	}

	// Check if target account exists, create if not
	targetAccount, exists := targetNet.GetAccount(transfer.TargetAddress)
	if !exists {
		targetAccount = targetNet.CreateAccount()
		targetAccount.Address = transfer.TargetAddress
	}

	// Add amount to target account
	targetAccount.Balance.Add(targetAccount.Balance, transfer.Amount)

	// Create target transaction
	targetTx, err := targetNet.Transfer("0x0000000000000000000000000000000000000000",
		transfer.TargetAddress, transfer.Amount)
	if err != nil {
		sim.updateTransferStatus(transfer.ID, "failed")
		sim.logger.Printf("Transfer %s failed: %v", transfer.ID, err)
		return
	}

	// Update transfer status
	sim.mu.Lock()
	transfer.TargetTxHash = targetTx.Hash
	transfer.Status = "completed"
	now := time.Now()
	transfer.CompletedAt = &now
	sim.mu.Unlock()

	sim.logger.Printf("Transfer %s completed successfully", transfer.ID)
}

// updateTransferStatus updates the status of a transfer
func (sim *CrossChainSimulator) updateTransferStatus(transferID, status string) {
	sim.mu.Lock()
	defer sim.mu.Unlock()

	if transfer, exists := sim.transfers[transferID]; exists {
		transfer.Status = status
		if status == "completed" {
			now := time.Now()
			transfer.CompletedAt = &now
		}
	}
}

// getBridgeFee returns the bridge fee for a network
func (sim *CrossChainSimulator) getBridgeFee(networkID string) *big.Int {
	if fee, exists := sim.bridgeFees[networkID]; exists {
		return fee
	}
	return big.NewInt(1000000000000000000) // Default 1 ETH
}

// generateTransferID generates a unique transfer ID
func generateTransferID() string {
	idBytes := make([]byte, 16)
	rand.Read(idBytes)
	return hex.EncodeToString(idBytes)
}

// GetNetworkStats returns statistics for all networks
func (sim *CrossChainSimulator) GetNetworkStats() map[string]interface{} {
	stats := make(map[string]interface{})
	networks := sim.networks.GetAllNetworks()

	for id, network := range networks {
		networkStats := map[string]interface{}{
			"name":          network.Name,
			"type":          network.Type,
			"chain_id":      network.ChainID,
			"block_time":    network.BlockTime.String(),
			"gas_price":     network.GasPrice.String(),
			"is_active":     network.IsActive,
			"account_count": network.GetAccountCount(),
			"latest_block":  network.GetLatestBlock(),
		}
		stats[id] = networkStats
	}

	return stats
}
