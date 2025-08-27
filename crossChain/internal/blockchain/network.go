package blockchain

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"sync"
	"time"
)

// NetworkType represents different blockchain networks
type NetworkType string

const (
	Ethereum  NetworkType = "ethereum"
	Polygon   NetworkType = "polygon"
	BSC       NetworkType = "bsc"
	Avalanche NetworkType = "avalanche"
	Arbitrum  NetworkType = "arbitrum"
)

// Network represents a blockchain network
type Network struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Type         NetworkType   `json:"type"`
	ChainID      int64         `json:"chain_id"`
	BlockTime    time.Duration `json:"block_time"`
	GasPrice     *big.Int      `json:"gas_price"`
	IsActive     bool          `json:"is_active"`
	mu           sync.RWMutex
	accounts     map[string]*Account
	transactions map[string]*Transaction
	blocks       []*Block
}

// Account represents a blockchain account
type Account struct {
	Address string   `json:"address"`
	Balance *big.Int `json:"balance"`
	Nonce   uint64   `json:"nonce"`
}

// Transaction represents a blockchain transaction
type Transaction struct {
	Hash      string    `json:"hash"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Value     *big.Int  `json:"value"`
	GasPrice  *big.Int  `json:"gas_price"`
	GasUsed   uint64    `json:"gas_used"`
	Status    string    `json:"status"` // pending, confirmed, failed
	BlockNum  uint64    `json:"block_num"`
	Timestamp time.Time `json:"timestamp"`
}

// Block represents a blockchain block
type Block struct {
	Number       uint64         `json:"number"`
	Hash         string         `json:"hash"`
	Timestamp    time.Time      `json:"timestamp"`
	Transactions []*Transaction `json:"transactions"`
}

// CrossChainTransfer represents a cross-chain transfer
type CrossChainTransfer struct {
	ID            string     `json:"id"`
	SourceNetwork string     `json:"source_network"`
	TargetNetwork string     `json:"target_network"`
	SourceAddress string     `json:"source_address"`
	TargetAddress string     `json:"target_address"`
	Amount        *big.Int   `json:"amount"`
	Status        string     `json:"status"` // pending, processing, completed, failed
	SourceTxHash  string     `json:"source_tx_hash"`
	TargetTxHash  string     `json:"target_tx_hash"`
	CreatedAt     time.Time  `json:"created_at"`
	CompletedAt   *time.Time `json:"completed_at"`
	BridgeFee     *big.Int   `json:"bridge_fee"`
}

// NewNetwork creates a new blockchain network
func NewNetwork(id string, name string, networkType NetworkType, chainID int64, blockTime time.Duration) *Network {
	return &Network{
		ID:           id,
		Name:         name,
		Type:         networkType,
		ChainID:      chainID,
		BlockTime:    blockTime,
		GasPrice:     big.NewInt(20000000000), // 20 gwei default
		IsActive:     true,
		accounts:     make(map[string]*Account),
		transactions: make(map[string]*Transaction),
		blocks:       make([]*Block, 0),
	}
}

// CreateAccount creates a new account on the network
func (n *Network) CreateAccount() *Account {
	n.mu.Lock()
	defer n.mu.Unlock()

	// Generate random address
	addressBytes := make([]byte, 20)
	rand.Read(addressBytes)
	address := "0x" + hex.EncodeToString(addressBytes)

	account := &Account{
		Address: address,
		Balance: big.NewInt(0),
		Nonce:   0,
	}

	n.accounts[address] = account
	return account
}

// GetAccount retrieves an account by address
func (n *Network) GetAccount(address string) (*Account, bool) {
	n.mu.RLock()
	defer n.mu.RUnlock()
	account, exists := n.accounts[address]
	return account, exists
}

// Transfer performs a transfer between accounts on the same network
func (n *Network) Transfer(from, to string, amount *big.Int) (*Transaction, error) {
	n.mu.Lock()
	defer n.mu.Unlock()

	fromAccount, exists := n.accounts[from]
	if !exists {
		return nil, fmt.Errorf("account %s not found", from)
	}

	if fromAccount.Balance.Cmp(amount) < 0 {
		return nil, fmt.Errorf("insufficient balance")
	}

	// Update balances
	fromAccount.Balance.Sub(fromAccount.Balance, amount)
	fromAccount.Nonce++

	if toAccount, exists := n.accounts[to]; exists {
		toAccount.Balance.Add(toAccount.Balance, amount)
	} else {
		// Create new account if it doesn't exist
		n.accounts[to] = &Account{
			Address: to,
			Balance: new(big.Int).Set(amount),
			Nonce:   0,
		}
	}

	// Create transaction
	txHash := generateTxHash()
	tx := &Transaction{
		Hash:      txHash,
		From:      from,
		To:        to,
		Value:     amount,
		GasPrice:  n.GasPrice,
		GasUsed:   21000, // Standard transfer gas
		Status:    "confirmed",
		BlockNum:  uint64(len(n.blocks)),
		Timestamp: time.Now(),
	}

	n.transactions[txHash] = tx

	// Add to latest block
	if len(n.blocks) > 0 {
		n.blocks[len(n.blocks)-1].Transactions = append(n.blocks[len(n.blocks)-1].Transactions, tx)
	}

	return tx, nil
}

// GetLatestBlock returns the latest block
func (n *Network) GetLatestBlock() *Block {
	n.mu.RLock()
	defer n.mu.RUnlock()

	if len(n.blocks) == 0 {
		return nil
	}
	return n.blocks[len(n.blocks)-1]
}

// GetTransaction retrieves a transaction by hash
func (n *Network) GetTransaction(hash string) (*Transaction, bool) {
	n.mu.RLock()
	defer n.mu.RUnlock()
	tx, exists := n.transactions[hash]
	return tx, exists
}

// GetAccountCount returns the number of accounts on the network
func (n *Network) GetAccountCount() int {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return len(n.accounts)
}

// generateTxHash generates a random transaction hash
func generateTxHash() string {
	hashBytes := make([]byte, 32)
	rand.Read(hashBytes)
	return "0x" + hex.EncodeToString(hashBytes)
}
