// 全局变量
let socket;
let isScanning = false;
let stats = {
    totalBlocks: 0,
    totalTransactions: 0,
    totalAlerts: 0
};

// DOM 元素
const elements = {
    connectionStatus: document.getElementById('connectionStatus'),
    connectionText: document.getElementById('connectionText'),
    scanStatus: document.getElementById('scanStatus'),
    scanText: document.getElementById('scanText'),
    currentBlock: document.getElementById('currentBlock'),
    startScanBtn: document.getElementById('startScanBtn'),
    stopScanBtn: document.getElementById('stopScanBtn'),
    addressInput: document.getElementById('addressInput'),
    scanAddressBtn: document.getElementById('scanAddressBtn'),
    totalBlocks: document.getElementById('totalBlocks'),
    totalTransactions: document.getElementById('totalTransactions'),
    totalAlerts: document.getElementById('totalAlerts'),
    networkStatus: document.getElementById('networkStatus'),
    blockFeed: document.getElementById('blockFeed'),
    transactionFeed: document.getElementById('transactionFeed'),
    alertFeed: document.getElementById('alertFeed'),
    addressInfoSection: document.getElementById('addressInfoSection'),
    addressInfo: document.getElementById('addressInfo')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// 初始化应用
function initializeApp() {
    console.log('🚀 初始化扫链应用...');
    
    // 连接 WebSocket
    connectWebSocket();
    
    // 更新状态显示
    updateConnectionStatus(false);
    updateScanStatus(false);
    
    // 获取网络状态
    fetchNetworkStatus();
}

// 设置事件监听器
function setupEventListeners() {
    // 开始扫描按钮
    elements.startScanBtn.addEventListener('click', startScanning);
    
    // 停止扫描按钮
    elements.stopScanBtn.addEventListener('click', stopScanning);
    
    // 扫描地址按钮
    elements.scanAddressBtn.addEventListener('click', scanAddress);
    
    // 地址输入框回车键
    elements.addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            scanAddress();
        }
    });
}

// 连接 WebSocket
function connectWebSocket() {
    try {
        socket = io();
        
        socket.on('connect', function() {
            console.log('✅ WebSocket 连接已建立');
            updateConnectionStatus(true);
        });
        
        socket.on('disconnect', function() {
            console.log('❌ WebSocket 连接已断开');
            updateConnectionStatus(false);
        });
        
        socket.on('connect_error', function(error) {
            console.error('❌ WebSocket 连接错误:', error);
            updateConnectionStatus(false);
        });
        
        // 监听扫描状态
        socket.on('scanStatus', function(data) {
            console.log('📡 扫描状态:', data);
            if (data.status === 'started') {
                updateScanStatus(true);
            } else if (data.status === 'stopped') {
                updateScanStatus(false);
            }
        });
        
        // 监听新区块
        socket.on('newBlock', function(blockData) {
            console.log('📦 新区块:', blockData);
            addBlockToFeed(blockData);
            updateStats('blocks');
            updateCurrentBlock(blockData.number);
        });
        
        // 监听新交易
        socket.on('newTransaction', function(txData) {
            console.log('💸 新交易:', txData);
            addTransactionToFeed(txData);
            updateStats('transactions');
        });
        
        // 监听合约交互
        socket.on('contractInteraction', function(contractData) {
            console.log('🤖 合约交互:', contractData);
            addAlertToFeed(contractData, 'contract');
        });
        
        // 监听大额转账
        socket.on('largeTransfer', function(transferData) {
            console.log('💰 大额转账:', transferData);
            addAlertToFeed(transferData, 'large_transfer');
        });
        
        // 监听地址扫描结果
        socket.on('addressScanned', function(addressData) {
            console.log('🔍 地址扫描结果:', addressData);
            displayAddressInfo(addressData);
        });
        
        // 监听区块扫描结果
        socket.on('blockScanned', function(blockData) {
            console.log('🔍 区块扫描结果:', blockData);
            addBlockToFeed(blockData);
        });
        
        // 监听错误
        socket.on('error', function(errorData) {
            console.error('❌ 服务器错误:', errorData);
            addAlertToFeed(errorData, 'error');
        });
        
    } catch (error) {
        console.error('❌ 初始化 WebSocket 失败:', error);
        updateConnectionStatus(false);
    }
}

// 开始扫描
function startScanning() {
    if (!socket || !socket.connected) {
        showAlert('请先连接服务器', 'warning');
        return;
    }
    
    console.log('🚀 开始扫描...');
    socket.emit('startScanning');
    
    elements.startScanBtn.disabled = true;
    elements.stopScanBtn.disabled = false;
}

// 停止扫描
function stopScanning() {
    if (!socket || !socket.connected) {
        return;
    }
    
    console.log('🛑 停止扫描...');
    socket.emit('stopScanning');
    
    elements.startScanBtn.disabled = false;
    elements.stopScanBtn.disabled = true;
}

// 扫描地址
function scanAddress() {
    const address = elements.addressInput.value.trim();
    
    if (!address) {
        showAlert('请输入有效的以太坊地址', 'warning');
        return;
    }
    
    if (!isValidEthereumAddress(address)) {
        showAlert('请输入有效的以太坊地址格式 (0x...)', 'warning');
        return;
    }
    
    if (!socket || !socket.connected) {
        showAlert('请先连接服务器', 'warning');
        return;
    }
    
    console.log('🔍 扫描地址:', address);
    socket.emit('scanAddress', address);
    
    // 显示加载提示
    showLoadingModal();
}

// 验证以太坊地址格式
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// 更新连接状态
function updateConnectionStatus(connected) {
    if (connected) {
        elements.connectionStatus.className = 'status-indicator status-connected';
        elements.connectionText.textContent = '已连接';
        elements.networkStatus.textContent = '在线';
    } else {
        elements.connectionStatus.className = 'status-indicator status-disconnected';
        elements.connectionText.textContent = '未连接';
        elements.networkStatus.textContent = '离线';
    }
}

// 更新扫描状态
function updateScanStatus(scanning) {
    isScanning = scanning;
    
    if (scanning) {
        elements.scanStatus.className = 'status-indicator status-scanning';
        elements.scanText.textContent = '扫描中';
    } else {
        elements.scanStatus.className = 'status-indicator status-disconnected';
        elements.scanText.textContent = '未扫描';
    }
}

// 更新当前区块
function updateCurrentBlock(blockNumber) {
    elements.currentBlock.textContent = `区块: ${blockNumber}`;
}

// 更新统计信息
function updateStats(type) {
    if (type === 'blocks') {
        stats.totalBlocks++;
        elements.totalBlocks.textContent = stats.totalBlocks;
    } else if (type === 'transactions') {
        stats.totalTransactions++;
        elements.totalTransactions.textContent = stats.totalTransactions;
    } else if (type === 'alerts') {
        stats.totalAlerts++;
        elements.totalAlerts.textContent = stats.totalAlerts;
    }
}

// 添加区块到实时流
function addBlockToFeed(blockData) {
    const blockElement = document.createElement('div');
    blockElement.className = 'block-item';
    
    const timestamp = new Date(blockData.timestamp).toLocaleString('zh-CN');
    
    blockElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <strong>区块 #${blockData.number}</strong><br>
                <small class="text-muted">哈希: ${blockData.hash.substring(0, 20)}...</small><br>
                <small class="text-muted">时间: ${timestamp}</small>
            </div>
            <div class="text-end">
                <span class="badge bg-primary">${blockData.transactions} 交易</span><br>
                <small class="text-muted">Gas: ${blockData.gasUsed}/${blockData.gasLimit}</small>
            </div>
        </div>
    `;
    
    elements.blockFeed.insertBefore(blockElement, elements.blockFeed.firstChild);
    
    // 限制显示数量
    if (elements.blockFeed.children.length > 20) {
        elements.blockFeed.removeChild(elements.blockFeed.lastChild);
    }
    
    // 移除等待提示
    const waitingText = elements.blockFeed.querySelector('.text-muted.text-center');
    if (waitingText) {
        waitingText.remove();
    }
}

// 添加交易到实时流
function addTransactionToFeed(txData) {
    const txElement = document.createElement('div');
    txElement.className = 'transaction-item';
    
    const timestamp = new Date(txData.timestamp).toLocaleString('zh-CN');
    const value = parseFloat(txData.value).toFixed(6);
    
    txElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <strong>交易</strong><br>
                <small class="text-muted">哈希: ${txData.hash.substring(0, 20)}...</small><br>
                <small class="text-muted">从: ${txData.from.substring(0, 20)}...</small><br>
                <small class="text-muted">到: ${txData.to ? txData.to.substring(0, 20) + '...' : '合约创建'}</small>
            </div>
            <div class="text-end">
                <span class="badge bg-success">${value} ETH</span><br>
                <small class="text-muted">时间: ${timestamp}</small><br>
                <small class="text-muted">Gas: ${txData.gas}</small>
            </div>
        </div>
    `;
    
    elements.transactionFeed.insertBefore(txElement, elements.transactionFeed.firstChild);
    
    // 限制显示数量
    if (elements.transactionFeed.children.length > 20) {
        elements.transactionFeed.removeChild(elements.transactionFeed.lastChild);
    }
    
    // 移除等待提示
    const waitingText = elements.transactionFeed.querySelector('.text-muted.text-center');
    if (waitingText) {
        waitingText.remove();
    }
}

// 添加警报到实时流
function addAlertToFeed(alertData, type) {
    const alertElement = document.createElement('div');
    alertElement.className = 'alert-item';
    
    let title, message, badgeClass;
    
    switch (type) {
        case 'contract':
            title = '智能合约交互';
            message = `检测到合约调用，方法签名: ${alertData.methodSignature}`;
            badgeClass = 'bg-info';
            break;
        case 'large_transfer':
            title = '大额转账警报';
            message = `检测到大额转账: ${alertData.value} ETH`;
            badgeClass = 'bg-warning';
            break;
        case 'error':
            title = '系统错误';
            message = alertData.message || '未知错误';
            badgeClass = 'bg-danger';
            break;
        default:
            title = '安全警报';
            message = '检测到可疑活动';
            badgeClass = 'bg-warning';
    }
    
    const timestamp = new Date(alertData.timestamp).toLocaleString('zh-CN');
    
    alertElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <strong>${title}</strong><br>
                <small class="text-muted">${message}</small><br>
                <small class="text-muted">时间: ${timestamp}</small>
            </div>
            <div>
                <span class="badge ${badgeClass}">${type.toUpperCase()}</span>
            </div>
        </div>
    `;
    
    elements.alertFeed.insertBefore(alertElement, elements.alertFeed.firstChild);
    
    // 限制显示数量
    if (elements.alertFeed.children.length > 20) {
        elements.alertFeed.removeChild(elements.alertFeed.lastChild);
    }
    
    // 移除等待提示
    const waitingText = elements.alertFeed.querySelector('.text-muted.text-center');
    if (waitingText) {
        waitingText.remove();
    }
    
    // 更新警报统计
    updateStats('alerts');
}

// 显示地址信息
function displayAddressInfo(addressData) {
    elements.addressInfo.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>地址信息</h6>
                <p><strong>地址:</strong> <code>${addressData.address}</code></p>
                <p><strong>余额:</strong> <span class="badge bg-success">${parseFloat(addressData.balance).toFixed(6)} ETH</span></p>
                <p><strong>交易计数:</strong> <span class="badge bg-info">${addressData.nonce}</span></p>
            </div>
            <div class="col-md-6">
                <h6>交易历史</h6>
                <div class="real-time-feed" style="max-height: 200px;">
                    ${addressData.transactions.length > 0 ? 
                        addressData.transactions.map(tx => `
                            <div class="transaction-item">
                                <small>哈希: ${tx.hash.substring(0, 20)}...</small><br>
                                <small class="text-muted">值: ${tx.value} ETH</small>
                            </div>
                        `).join('') : 
                        '<p class="text-muted">暂无交易历史</p>'
                    }
                </div>
            </div>
        </div>
    `;
    
    elements.addressInfoSection.style.display = 'block';
    
    // 隐藏加载提示
    hideLoadingModal();
}

// 获取网络状态
async function fetchNetworkStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.status === 'running') {
            updateConnectionStatus(true);
        }
    } catch (error) {
        console.error('获取网络状态失败:', error);
    }
}

// 显示加载提示
function showLoadingModal() {
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
}

// 隐藏加载提示
function hideLoadingModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modal) {
        modal.hide();
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 插入到页面顶部
    document.querySelector('.container-fluid').insertBefore(alertDiv, document.querySelector('.row'));
    
    // 自动隐藏
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (socket) {
        socket.disconnect();
    }
}); 