package blockchain

import (
	"fmt"
	"log"
	"math/big"
	"sync"
	"time"
)

// NetworkManager manages multiple blockchain networks
type NetworkManager struct {
	networks map[string]*Network
	mu       sync.RWMutex
	logger   *log.Logger
}

// NewNetworkManager creates a new network manager
func NewNetworkManager(logger *log.Logger) *NetworkManager {
	return &NetworkManager{
		networks: make(map[string]*Network),
		logger:   logger,
	}
}

// AddNetwork adds a new network to the manager
func (nm *NetworkManager) AddNetwork(network *Network) {
	nm.mu.Lock()
	defer nm.mu.Unlock()
	nm.networks[network.ID] = network
	nm.logger.Printf("Added network: %s (%s)", network.Name, network.ID)
}

// GetNetwork retrieves a network by ID
func (nm *NetworkManager) GetNetwork(id string) (*Network, bool) {
	nm.mu.RLock()
	defer nm.mu.RUnlock()
	network, exists := nm.networks[id]
	return network, exists
}

// GetAllNetworks returns all networks
func (nm *NetworkManager) GetAllNetworks() map[string]*Network {
	nm.mu.RLock()
	defer nm.mu.RUnlock()

	networks := make(map[string]*Network)
	for id, network := range nm.networks {
		networks[id] = network
	}
	return networks
}

// GetNetworkList returns a list of all network IDs
func (nm *NetworkManager) GetNetworkList() []string {
	nm.mu.RLock()
	defer nm.mu.RUnlock()

	var ids []string
	for id := range nm.networks {
		ids = append(ids, id)
	}
	return ids
}

// InitializeNetworks creates and initializes all supported networks
func InitializeNetworks() *NetworkManager {
	logger := log.New(log.Writer(), "[NETWORK-MANAGER] ", log.LstdFlags)
	manager := NewNetworkManager(logger)

	// Initialize Ethereum Mainnet
	ethereum := NewNetwork(
		"ethereum-mainnet",
		"Ethereum Mainnet",
		Ethereum,
		1,
		12*time.Second,
	)
	ethereum.GasPrice = big.NewInt(25000000000) // 25 gwei
	manager.AddNetwork(ethereum)

	// Initialize Polygon
	polygon := NewNetwork(
		"polygon-mainnet",
		"Polygon Mainnet",
		Polygon,
		137,
		2*time.Second,
	)
	polygon.GasPrice = big.NewInt(30000000000) // 30 gwei
	manager.AddNetwork(polygon)

	// Initialize BSC
	bsc := NewNetwork(
		"bsc-mainnet",
		"Binance Smart Chain",
		BSC,
		56,
		3*time.Second,
	)
	bsc.GasPrice = big.NewInt(5000000000) // 5 gwei
	manager.AddNetwork(bsc)

	// Initialize Avalanche
	avalanche := NewNetwork(
		"avalanche-mainnet",
		"Avalanche C-Chain",
		Avalanche,
		43114,
		2*time.Second,
	)
	avalanche.GasPrice = big.NewInt(25000000000) // 25 gwei
	manager.AddNetwork(avalanche)

	// Initialize Arbitrum
	arbitrum := NewNetwork(
		"arbitrum-mainnet",
		"Arbitrum One",
		Arbitrum,
		42161,
		1*time.Second,
	)
	arbitrum.GasPrice = big.NewInt(100000000) // 0.1 gwei
	manager.AddNetwork(arbitrum)

	logger.Println("All networks initialized successfully")
	return manager
}

// StartBlockProduction starts block production for all networks
func (nm *NetworkManager) StartBlockProduction() {
	nm.mu.RLock()
	defer nm.mu.RUnlock()

	for _, network := range nm.networks {
		go nm.produceBlocks(network)
	}
	nm.logger.Println("Block production started for all networks")
}

// produceBlocks continuously produces blocks for a network
func (nm *NetworkManager) produceBlocks(network *Network) {
	ticker := time.NewTicker(network.BlockTime)
	defer ticker.Stop()

	blockNumber := uint64(0)
	for range ticker.C {
		network.mu.Lock()

		// Create new block
		block := &Block{
			Number:       blockNumber,
			Hash:         generateBlockHash(network.ID, blockNumber),
			Timestamp:    time.Now(),
			Transactions: make([]*Transaction, 0),
		}

		network.blocks = append(network.blocks, block)
		blockNumber++

		network.mu.Unlock()

		nm.logger.Printf("New block %d created on %s", blockNumber-1, network.Name)
	}
}

// generateBlockHash generates a block hash
func generateBlockHash(networkID string, blockNumber uint64) string {
	// Simple hash generation for simulation
	return fmt.Sprintf("0x%s_%d", networkID, blockNumber)
}
