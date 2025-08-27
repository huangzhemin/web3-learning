package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"crosschain-simulator/internal/api"
	"crosschain-simulator/internal/blockchain"
	"crosschain-simulator/internal/simulator"
)

func main() {
	// Initialize logger
	logger := log.New(os.Stdout, "[CROSS-CHAIN] ", log.LstdFlags)
	logger.Println("Starting Cross-Chain Transfer Simulator...")

	// Initialize blockchain networks
	networks := blockchain.InitializeNetworks()

	// Initialize cross-chain simulator
	sim := simulator.NewCrossChainSimulator(networks, logger)

	// Initialize API server
	server := api.NewServer(sim, logger)

	// Start the server
	go func() {
		logger.Println("Starting HTTP server on :8081")
		if err := server.Start(":8081"); err != nil {
			logger.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logger.Println("Shutting down Cross-Chain Transfer Simulator...")
}
