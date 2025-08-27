class CrossChainSimulator {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.loadInitialData();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.success) {
                this.updateUI(data.data);
            }
        };
        
        this.ws.onclose = () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            console.log('WebSocket disconnected');
            // Reconnect after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus(false);
        };
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (connected) {
            statusDot.className = 'w-3 h-3 rounded-full bg-green-500 mr-2';
            statusText.textContent = 'Connected';
        } else {
            statusDot.className = 'w-3 h-3 rounded-full bg-red-500 mr-2';
            statusText.textContent = 'Disconnected';
        }
    }

    setupEventListeners() {
        // Transfer form submission
        document.getElementById('transfer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.initiateTransfer();
        });

        // Network selection change
        document.getElementById('source-network').addEventListener('change', () => {
            this.updateTargetNetworkOptions();
        });

        // Create test source account
        const btnCreate = document.getElementById('btn-create-source');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => this.createTestSourceAccount());
        }
    }

    async createTestSourceAccount() {
        const networkId = document.getElementById('source-network').value;
        if (!networkId) {
            this.showToast('Please select a source network first', 'error');
            return;
        }
        try {
            const resp = await fetch(`/api/v1/networks/${networkId}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initial_balance: '10000000000000000000' }) // 10 ETH
            });
            const data = await resp.json();
            if (data.success) {
                document.getElementById('source-address').value = data.data.address;
                this.showToast('Test account created and funded', 'success');
            } else {
                this.showToast(data.error || 'Failed to create account', 'error');
            }
        } catch (e) {
            this.showToast('Network error creating account', 'error');
        }
    }

    async loadInitialData() {
        try {
            const response = await fetch('/api/v1/stats');
            const data = await response.json();
            if (data.success) {
                this.updateUI(data.data);
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    updateUI(data) {
        if (data.networks) {
            this.updateNetworks(data.networks);
        }
        if (data.transfers) {
            this.updateTransferStats(data.transfers);
        }
    }

    updateNetworks(networks) {
        const networksList = document.getElementById('networks-list');
        const sourceSelect = document.getElementById('source-network');
        const targetSelect = document.getElementById('target-network');
        
        // Clear existing options
        sourceSelect.innerHTML = '<option value="">Select source network</option>';
        targetSelect.innerHTML = '<option value="">Select target network</option>';
        
        let networksHtml = '';
        let networkCount = 0;
        
        for (const [id, network] of Object.entries(networks)) {
            networkCount++;
            
            // Add to select options
            const option = document.createElement('option');
            option.value = id;
            option.textContent = network.name;
            sourceSelect.appendChild(option.cloneNode(true));
            targetSelect.appendChild(option);
            
            // Create network card
            const statusClass = network.is_active ? 'text-green-600' : 'text-red-600';
            const statusIcon = network.is_active ? 'fa-circle' : 'fa-times-circle';
            
            networksHtml += `
                <div class="network-card bg-gray-50 rounded-lg p-4 border">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-medium text-gray-900">${network.name}</h3>
                            <p class="text-sm text-gray-600">Chain ID: ${network.chain_id}</p>
                            <p class="text-sm text-gray-600">Block Time: ${network.block_time}</p>
                        </div>
                        <div class="text-right">
                            <i class="fas ${statusIcon} ${statusClass} text-lg"></i>
                            <p class="text-xs text-gray-500 mt-1">${network.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        networksList.innerHTML = networksHtml;
        document.getElementById('network-count').textContent = networkCount;
    }

    updateTransferStats(stats) {
        document.getElementById('completed-count').textContent = stats.completed || 0;
        document.getElementById('pending-count').textContent = stats.pending || 0;
        document.getElementById('failed-count').textContent = stats.failed || 0;
    }

    updateTargetNetworkOptions() {
        const sourceNetwork = document.getElementById('source-network').value;
        const targetSelect = document.getElementById('target-network');
        
        // Reset target options
        targetSelect.innerHTML = '<option value="">Select target network</option>';
        
        if (sourceNetwork) {
            // Get all available networks from the source select
            const sourceSelect = document.getElementById('source-network');
            const allOptions = Array.from(sourceSelect.options);
            
            // Add all networks except the selected source network
            allOptions.forEach(option => {
                if (option.value && option.value !== sourceNetwork) {
                    const newOption = document.createElement('option');
                    newOption.value = option.value;
                    newOption.textContent = option.textContent;
                    targetSelect.appendChild(newOption);
                }
            });
        }
    }

    async initiateTransfer() {
        const formData = {
            source_network: document.getElementById('source-network').value,
            target_network: document.getElementById('target-network').value,
            source_address: document.getElementById('source-address').value,
            target_address: document.getElementById('target-address').value,
            amount: document.getElementById('amount').value
        };

        // Validation
        if (!formData.source_network || !formData.target_network || 
            !formData.source_address || !formData.target_address || !formData.amount) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (formData.source_network === formData.target_network) {
            this.showToast('Source and target networks must be different', 'error');
            return;
        }

        try {
            const response = await fetch('/api/v1/transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('Transfer initiated successfully!', 'success');
                this.loadTransfers();
                // Reset form
                document.getElementById('transfer-form').reset();
            } else {
                this.showToast(data.error || 'Failed to initiate transfer', 'error');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            this.showToast('Network error occurred', 'error');
        }
    }

    async loadTransfers() {
        try {
            const response = await fetch('/api/v1/transfers');
            const data = await response.json();
            
            if (data.success) {
                this.updateTransfersList(data.data);
            }
        } catch (error) {
            console.error('Failed to load transfers:', error);
        }
    }

    updateTransfersList(transfers) {
        const transfersList = document.getElementById('transfers-list');
        
        if (transfers.length === 0) {
            transfersList.innerHTML = '<p class="text-gray-500 text-center py-8">No transfers found</p>';
            return;
        }

        let transfersHtml = '';
        
        transfers.slice(0, 10).forEach(transfer => {
            const statusClass = `status-${transfer.status}`;
            const statusIcon = this.getStatusIcon(transfer.status);
            const createdAt = new Date(transfer.created_at).toLocaleString();
            
            transfersHtml += `
                <div class="transfer-item bg-gray-50 rounded-lg p-4 border">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-4">
                                <span class="text-sm font-medium text-gray-900">${transfer.id.substring(0, 8)}...</span>
                                <i class="fas ${statusIcon} ${statusClass}"></i>
                                <span class="text-sm ${statusClass} font-medium">${transfer.status.toUpperCase()}</span>
                            </div>
                            <div class="mt-2 text-sm text-gray-600">
                                <p>From: ${transfer.source_network} (${transfer.source_address.substring(0, 10)}...)</p>
                                <p>To: ${transfer.target_network} (${transfer.target_address.substring(0, 10)}...)</p>
                                <p>Amount: ${this.formatAmount(transfer.amount)} wei</p>
                                <p>Created: ${createdAt}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            ${transfer.source_tx_hash ? `<p class="text-xs text-gray-500">Source: ${transfer.source_tx_hash.substring(0, 10)}...</p>` : ''}
                            ${transfer.target_tx_hash ? `<p class="text-xs text-gray-500">Target: ${transfer.target_tx_hash.substring(0, 10)}...</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        transfersList.innerHTML = transfersHtml;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'pending': return 'fa-clock';
            case 'processing': return 'fa-spinner fa-spin';
            case 'completed': return 'fa-check-circle';
            case 'failed': return 'fa-times-circle';
            default: return 'fa-question-circle';
        }
    }

    formatAmount(amount) {
        return new Intl.NumberFormat().format(amount);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        
        // Update toast styling based on type
        const toastContent = toast.querySelector('div');
        const icon = toast.querySelector('i');
        
        if (type === 'error') {
            toastContent.className = 'bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-4 max-w-sm';
            icon.className = 'fas fa-exclamation-circle text-red-500 mr-3';
        } else {
            toastContent.className = 'bg-white border-l-4 border-green-500 shadow-lg rounded-lg p-4 max-w-sm';
            icon.className = 'fas fa-check-circle text-green-500 mr-3';
        }
        
        toast.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CrossChainSimulator();
}); 