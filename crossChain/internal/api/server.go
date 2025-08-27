package api

import (
	"encoding/json"
	"log"
	"math/big"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	"crosschain-simulator/internal/simulator"
)

// Server represents the HTTP API server
type Server struct {
	simulator *simulator.CrossChainSimulator
	logger    *log.Logger
	upgrader  websocket.Upgrader
}

// NewServer creates a new API server
func NewServer(sim *simulator.CrossChainSimulator, logger *log.Logger) *Server {
	return &Server{
		simulator: sim,
		logger:    logger,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for demo
			},
		},
	}
}

// Start starts the HTTP server
func (s *Server) Start(addr string) error {
	router := s.setupRoutes()
	return http.ListenAndServe(addr, router)
}

// setupRoutes configures all API routes
func (s *Server) setupRoutes() *mux.Router {
	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Network endpoints
	api.HandleFunc("/networks", s.getNetworks).Methods("GET")
	api.HandleFunc("/networks/{id}", s.getNetwork).Methods("GET")
	api.HandleFunc("/networks/{id}/accounts", s.createAccount).Methods("POST")
	api.HandleFunc("/networks/{id}/accounts/{address}", s.getAccount).Methods("GET")
	api.HandleFunc("/networks/{id}/transfer", s.transfer).Methods("POST")

	// Cross-chain transfer endpoints
	api.HandleFunc("/transfers", s.initiateTransfer).Methods("POST")
	api.HandleFunc("/transfers", s.getTransfers).Methods("GET")
	api.HandleFunc("/transfers/{id}", s.getTransfer).Methods("GET")
	api.HandleFunc("/transfers/status/{status}", s.getTransfersByStatus).Methods("GET")

	// Statistics endpoints
	api.HandleFunc("/stats", s.getStats).Methods("GET")

	// WebSocket endpoint
	api.HandleFunc("/ws", s.handleWebSocket)

	// Serve static files for web interface
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./web")))

	return router
}

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// TransferRequest represents a transfer request
type TransferRequest struct {
	From   string `json:"from"`
	To     string `json:"to"`
	Amount string `json:"amount"`
}

// CrossChainTransferRequest represents a cross-chain transfer request
type CrossChainTransferRequest struct {
	SourceNetwork string `json:"source_network"`
	TargetNetwork string `json:"target_network"`
	SourceAddress string `json:"source_address"`
	TargetAddress string `json:"target_address"`
	Amount        string `json:"amount"`
}

// getNetworks returns all available networks
func (s *Server) getNetworks(w http.ResponseWriter, r *http.Request) {
	networks := s.simulator.GetNetworkStats()
	s.sendJSON(w, Response{Success: true, Data: networks})
}

// getNetwork returns a specific network
func (s *Server) getNetwork(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	networkID := vars["id"]

	networks := s.simulator.GetNetworkStats()
	if network, exists := networks[networkID]; exists {
		s.sendJSON(w, Response{Success: true, Data: network})
	} else {
		s.sendJSON(w, Response{Success: false, Error: "Network not found"}, http.StatusNotFound)
	}
}

// createAccount creates a new account on a network
func (s *Server) createAccount(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	networkID := vars["id"]

	// This would need to be implemented in the simulator
	// For now, return a placeholder response
	s.sendJSON(w, Response{
		Success: true,
		Data: map[string]string{
			"network_id": networkID,
			"message":    "Account creation endpoint - implementation needed",
		},
	})
}

// getAccount returns account information
func (s *Server) getAccount(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	networkID := vars["id"]
	address := vars["address"]

	// This would need to be implemented in the simulator
	s.sendJSON(w, Response{
		Success: true,
		Data: map[string]interface{}{
			"network_id": networkID,
			"address":    address,
			"message":    "Account info endpoint - implementation needed",
		},
	})
}

// transfer performs a transfer on a single network
func (s *Server) transfer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	networkID := vars["id"]

	var req TransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendJSON(w, Response{Success: false, Error: "Invalid request body"}, http.StatusBadRequest)
		return
	}

	// Parse amount
	amount, ok := new(big.Int).SetString(req.Amount, 10)
	if !ok {
		s.sendJSON(w, Response{Success: false, Error: "Invalid amount"}, http.StatusBadRequest)
		return
	}

	// This would need to be implemented in the simulator
	s.sendJSON(w, Response{
		Success: true,
		Data: map[string]interface{}{
			"network_id": networkID,
			"from":       req.From,
			"to":         req.To,
			"amount":     amount.String(),
			"message":    "Transfer endpoint - implementation needed",
		},
	})
}

// initiateTransfer starts a cross-chain transfer
func (s *Server) initiateTransfer(w http.ResponseWriter, r *http.Request) {
	var req CrossChainTransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendJSON(w, Response{Success: false, Error: "Invalid request body"}, http.StatusBadRequest)
		return
	}

	// Parse amount
	amount, ok := new(big.Int).SetString(req.Amount, 10)
	if !ok {
		s.sendJSON(w, Response{Success: false, Error: "Invalid amount"}, http.StatusBadRequest)
		return
	}

	// Initiate transfer
	transfer, err := s.simulator.InitiateTransfer(
		req.SourceNetwork,
		req.TargetNetwork,
		req.SourceAddress,
		req.TargetAddress,
		amount,
	)

	if err != nil {
		s.sendJSON(w, Response{Success: false, Error: err.Error()}, http.StatusBadRequest)
		return
	}

	s.sendJSON(w, Response{Success: true, Data: transfer})
}

// getTransfers returns all transfers
func (s *Server) getTransfers(w http.ResponseWriter, r *http.Request) {
	transfers := s.simulator.GetAllTransfers()
	s.sendJSON(w, Response{Success: true, Data: transfers})
}

// getTransfer returns a specific transfer
func (s *Server) getTransfer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	transferID := vars["id"]

	transfer, exists := s.simulator.GetTransfer(transferID)
	if !exists {
		s.sendJSON(w, Response{Success: false, Error: "Transfer not found"}, http.StatusNotFound)
		return
	}

	s.sendJSON(w, Response{Success: true, Data: transfer})
}

// getTransfersByStatus returns transfers filtered by status
func (s *Server) getTransfersByStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	status := vars["status"]

	transfers := s.simulator.GetTransfersByStatus(status)
	s.sendJSON(w, Response{Success: true, Data: transfers})
}

// getStats returns system statistics
func (s *Server) getStats(w http.ResponseWriter, r *http.Request) {
	networkStats := s.simulator.GetNetworkStats()
	allTransfers := s.simulator.GetAllTransfers()

	stats := map[string]interface{}{
		"networks": networkStats,
		"transfers": map[string]interface{}{
			"total":      len(allTransfers),
			"pending":    len(s.simulator.GetTransfersByStatus("pending")),
			"processing": len(s.simulator.GetTransfersByStatus("processing")),
			"completed":  len(s.simulator.GetTransfersByStatus("completed")),
			"failed":     len(s.simulator.GetTransfersByStatus("failed")),
		},
	}

	s.sendJSON(w, Response{Success: true, Data: stats})
}

// handleWebSocket handles WebSocket connections for real-time updates
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	s.logger.Println("WebSocket client connected")

	// Send initial data
	stats := s.simulator.GetNetworkStats()
	conn.WriteJSON(Response{Success: true, Data: stats})

	// Keep connection alive and send periodic updates
	for {
		// Wait for client message or timeout
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		_, _, err := conn.ReadMessage()
		if err != nil {
			s.logger.Printf("WebSocket read error: %v", err)
			break
		}

		// Send updated stats
		stats := s.simulator.GetNetworkStats()
		if err := conn.WriteJSON(Response{Success: true, Data: stats}); err != nil {
			s.logger.Printf("WebSocket write error: %v", err)
			break
		}
	}

	s.logger.Println("WebSocket client disconnected")
}

// sendJSON sends a JSON response
func (s *Server) sendJSON(w http.ResponseWriter, response Response, statusCode ...int) {
	w.Header().Set("Content-Type", "application/json")

	if len(statusCode) > 0 {
		w.WriteHeader(statusCode[0])
	}

	json.NewEncoder(w).Encode(response)
}
