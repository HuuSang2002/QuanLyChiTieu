// Application state
let wallets = JSON.parse(localStorage.getItem('wallets')) || [];
let currentWalletId = localStorage.getItem('currentWalletId');

// DOM Elements
const walletList = document.getElementById('walletList');
const currentWalletName = document.getElementById('currentWalletName');
const currentBalance = document.getElementById('currentBalance');
const transactionList = document.getElementById('transactionList');

// Forms
const transactionForm = document.getElementById('transactionForm');
const createWalletForm = document.getElementById('createWalletForm');
const adjustBalanceForm = document.getElementById('adjustBalanceForm');
const transferMoneyForm = document.getElementById('transferMoneyForm');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateUI();
});

function initializeApp() {
    // Set current date as default for transaction date
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // If no wallets exist, create a default one
    if (wallets.length === 0) {
        createDefaultWallet();
    }
    
    // Set current wallet if none is selected
    if (!currentWalletId && wallets.length > 0) {
        currentWalletId = wallets[0].id;
        localStorage.setItem('currentWalletId', currentWalletId);
    }
}

function createDefaultWallet() {
    const defaultWallet = {
        id: generateId(),
        name: 'Ví chính',
        balance: 0,
        currency: 'VND',
        transactions: [{
            id: generateId(),
            type: 'adjustment',
            amount: 0,
            name: 'Số dư ban đầu',
            date: new Date().toISOString(),
            note: 'Khởi tạo ví'
        }],
        createdAt: new Date().toISOString()
    };
    
    wallets.push(defaultWallet);
    currentWalletId = defaultWallet.id;
    saveToLocalStorage();
}

function setupEventListeners() {
    // Wallet creation
    document.getElementById('createWalletBtn').addEventListener('click', () => {
        openModal('createWalletModal');
    });

    // Transaction modal
    document.getElementById('openTransactionModalBtn').addEventListener('click', () => {
        openModal('transactionModal');
    });

    // Quick actions
    document.getElementById('addIncomeBtn').addEventListener('click', () => {
        document.getElementById('transactionType').value = 'income';
        openModal('transactionModal');
    });

    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        document.getElementById('transactionType').value = 'expense';
        openModal('transactionModal');
    });

    // Wallet actions
    document.getElementById('editWalletBtn').addEventListener('click', editWalletName);
    document.getElementById('adjustBalanceBtn').addEventListener('click', () => {
        openModal('adjustBalanceModal');
    });
    document.getElementById('transferMoneyBtn').addEventListener('click', () => {
        populateTransferWallets();
        openModal('transferMoneyModal');
    });
    document.getElementById('deleteWalletBtn').addEventListener('click', deleteCurrentWallet);

    // Form submissions
    createWalletForm.addEventListener('submit', handleCreateWallet);
    transactionForm.addEventListener('submit', handleAddTransaction);
    adjustBalanceForm.addEventListener('submit', handleAdjustBalance);
    transferMoneyForm.addEventListener('submit', handleTransferMoney);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeAllModals);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Wallet management
function handleCreateWallet(e) {
    e.preventDefault();
    
    const walletName = document.getElementById('walletName').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;
    
    const newWallet = {
        id: generateId(),
        name: walletName,
        balance: initialBalance,
        currency: 'VND',
        transactions: [{
            id: generateId(),
            type: 'adjustment',
            amount: initialBalance,
            name: 'Số dư ban đầu',
            date: new Date().toISOString(),
            note: 'Khởi tạo ví'
        }],
        createdAt: new Date().toISOString()
    };
    
    wallets.push(newWallet);
    currentWalletId = newWallet.id;
    saveToLocalStorage();
    updateUI();
    closeAllModals();
    createWalletForm.reset();
}

function editWalletName() {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    const newName = prompt('Nhập tên mới cho ví:', currentWallet.name);
    if (newName && newName.trim() !== '') {
        currentWallet.name = newName.trim();
        saveToLocalStorage();
        updateUI();
    }
}

function handleAdjustBalance(e) {
    e.preventDefault();
    
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value);
    const adjustmentNote = document.getElementById('adjustmentNote').value;
    
    if (adjustmentAmount === 0) {
        alert('Số tiền điều chỉnh không thể bằng 0');
        return;
    }
    
    const transaction = {
        id: generateId(),
        type: 'adjustment',
        amount: adjustmentAmount,
        name: 'Điều chỉnh số dư',
        date: new Date().toISOString(),
        note: adjustmentNote
    };
    
    currentWallet.transactions.push(transaction);
    currentWallet.balance += adjustmentAmount;
    
    saveToLocalStorage();
    updateUI();
    closeAllModals();
    adjustBalanceForm.reset();
}

function populateTransferWallets() {
    const fromWalletSelect = document.getElementById('fromWallet');
    const toWalletSelect = document.getElementById('toWallet');
    
    // Clear existing options
    fromWalletSelect.innerHTML = '';
    toWalletSelect.innerHTML = '';
    
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.id;
        option.textContent = `${wallet.name} (${formatCurrency(wallet.balance)})`;
        
        fromWalletSelect.appendChild(option.cloneNode(true));
        toWalletSelect.appendChild(option);
    });
    
    // Set current wallet as default from wallet
    if (currentWalletId) {
        fromWalletSelect.value = currentWalletId;
    }
}

function handleTransferMoney(e) {
    e.preventDefault();
    
    const fromWalletId = document.getElementById('fromWallet').value;
    const toWalletId = document.getElementById('toWallet').value;
    const transferAmount = parseFloat(document.getElementById('transferAmount').value);
    
    if (fromWalletId === toWalletId) {
        alert('Không thể chuyển tiền cùng một ví');
        return;
    }
    
    if (transferAmount <= 0) {
        alert('Số tiền chuyển phải lớn hơn 0');
        return;
    }
    
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);
    
    if (!fromWallet || !toWallet) {
        alert('Ví không tồn tại');
        return;
    }
    
    if (fromWallet.balance < transferAmount) {
        alert('Số dư ví nguồn không đủ');
        return;
    }
    
    // Create transfer transactions
    const fromTransaction = {
        id: generateId(),
        type: 'expense',
        amount: -transferAmount,
        name: `Chuyển tiền đến ${toWallet.name}`,
        date: new Date().toISOString(),
        note: 'Chuyển tiền giữa các ví'
    };
    
    const toTransaction = {
        id: generateId(),
        type: 'income',
        amount: transferAmount,
        name: `Nhận tiền từ ${fromWallet.name}`,
        date: new Date().toISOString(),
        note: 'Chuyển tiền giữa các ví'
    };
    
    fromWallet.transactions.push(fromTransaction);
    toWallet.transactions.push(toTransaction);
    
    fromWallet.balance -= transferAmount;
    toWallet.balance += transferAmount;
    
    saveToLocalStorage();
    updateUI();
    closeAllModals();
    transferMoneyForm.reset();
}

function deleteCurrentWallet() {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    if (wallets.length === 1) {
        alert('Không thể xóa ví cuối cùng');
        return;
    }
    
    if (confirm(`Bạn có chắc muốn xóa ví "${currentWallet.name}"?`)) {
        wallets = wallets.filter(w => w.id !== currentWalletId);
        currentWalletId = wallets[0].id;
        localStorage.setItem('currentWalletId', currentWalletId);
        saveToLocalStorage();
        updateUI();
    }
}

// Transaction management
function handleAddTransaction(e) {
    e.preventDefault();
    
    const currentWallet = getCurrentWallet();
    if (!currentWallet) {
        alert('Vui lòng chọn một ví trước khi thêm giao dịch');
        closeAllModals();
        return;
    }
    
    const type = document.getElementById('transactionType').value;
    const name = document.getElementById('transactionName').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const date = document.getElementById('transactionDate').value;
    const note = document.getElementById('transactionNote').value;
    
    if (amount <= 0) {
        alert('Số tiền phải lớn hơn 0');
        return;
    }
    
    const transaction = {
        id: generateId(),
        type: type,
        amount: type === 'income' ? amount : -amount,
        name: name,
        date: date,
        note: note
    };
    
    currentWallet.transactions.push(transaction);
    currentWallet.balance += transaction.amount;
    
    saveToLocalStorage();
    updateUI();
    closeAllModals();
    transactionForm.reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
}

// UI Update functions
function updateUI() {
    updateWalletList();
    updateCurrentWallet();
    updateTransactionList();
}

function updateWalletList() {
    walletList.innerHTML = '';
    
    wallets.forEach(wallet => {
        const walletElement = document.createElement('div');
        walletElement.className = `wallet-item ${wallet.id === currentWalletId ? 'active' : ''}`;
        walletElement.innerHTML = `
            <div class="wallet-item-name">${wallet.name}</div>
            <div class="wallet-item-balance">${formatCurrency(wallet.balance)}</div>
        `;
        
        walletElement.addEventListener('click', () => {
            currentWalletId = wallet.id;
            localStorage.setItem('currentWalletId', currentWalletId);
            updateUI();
        });
        
        walletList.appendChild(walletElement);
    });
}

function updateCurrentWallet() {
    const currentWallet = getCurrentWallet();
    
    if (currentWallet) {
        currentWalletName.textContent = currentWallet.name;
        currentBalance.textContent = formatCurrency(currentWallet.balance);
    }
}

function updateTransactionList() {
    const currentWallet = getCurrentWallet();
    transactionList.innerHTML = '';
    
    if (!currentWallet || currentWallet.transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="no-transactions">
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">Số dư ban đầu</div>
                        <div class="transaction-date">${formatDate(new Date().toISOString())}</div>
                        <div class="transaction-note">Khởi tạo ví</div>
                    </div>
                    <div class="transaction-amount">0 đ</div>
                </div>
            </div>
        `;
        return;
    }
    
    const sortedTransactions = [...currentWallet.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedTransactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        
        const amountClass = transaction.amount > 0 ? 'income' : 'expense';
        const amountSign = transaction.amount > 0 ? '+' : '';
        
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-name">${transaction.name}</div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                ${transaction.note ? `<div class="transaction-note">${transaction.note}</div>` : ''}
            </div>
            <div class="transaction-amount-container">  
                <div class="transaction-amount ${amountClass}">
                    ${amountSign}${formatCurrency(Math.abs(transaction.amount))}
                </div>
               <button class="delete-transaction-btn" data-transaction-id="${transaction.id}">
    <i class="bi bi-trash-fill"></i>
</button>
            </div>
        `;
        
        // Thêm sự kiện xóa giao dịch
        const deleteBtn = transactionElement.querySelector('.delete-transaction-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTransaction(transaction.id);
        });
        
        transactionList.appendChild(transactionElement);
    });
}

function deleteTransaction(transactionId) {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    const transaction = currentWallet.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    if (confirm(`Bạn có chắc muốn xóa giao dịch "${transaction.name}"?`)) {
        // Trừ số tiền giao dịch khỏi số dư ví
        currentWallet.balance -= transaction.amount;
        
        // Xóa giao dịch khỏi mảng
        currentWallet.transactions = currentWallet.transactions.filter(t => t.id !== transactionId);
        
        saveToLocalStorage();
        updateUI();
        
        alert('Đã xóa giao dịch thành công!');
    }
}

// Utility functions
function getCurrentWallet() {
    return wallets.find(wallet => wallet.id === currentWalletId);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0
    }).format(amount) ;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function saveToLocalStorage() {
    localStorage.setItem('wallets', JSON.stringify(wallets));
    localStorage.setItem('currentWalletId', currentWalletId);
}

//---------------------------------------------------------------------------------------- 
// SCRIPT BIỂU ĐỒ TRÒN

// Thêm biến global cho chart
let transactionChart = null;

// Thêm hàm updateChart vào hàm updateUI
function updateUI() {
    updateWalletList();
    updateCurrentWallet();
    updateTransactionList();
    updateChart(); // THÊM DÒNG NÀY
}

// Hàm tạo/cập nhật biểu đồ
function updateChart() {
    const currentWallet = getCurrentWallet();
    const ctx = document.getElementById('transactionChart').getContext('2d');
    
    if (!currentWallet || currentWallet.transactions.length === 0) {
        // Hiển thị biểu đồ mặc định nếu không có giao dịch
        if (transactionChart) {
            transactionChart.destroy();
        }
        
        transactionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Thu nhập', 'Chi tiêu'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#3498db', '#e74c3c'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: 0 đ`;
                            }
                        }
                    }
                }
            }
        });
        
        document.getElementById('chartLegend').innerHTML = `
            <div class="legend-item">
                <div class="legend-color legend-income"></div>
                <span>Thu nhập: 0 đ</span>
            </div>
            <div class="legend-item">
                <div class="legend-color legend-expense"></div>
                <span>Chi tiêu: 0 đ</span>
            </div>
        `;
        return;
    }
    
    // Tính tổng thu nhập và chi tiêu
    let totalIncome = 0;
    let totalExpense = 0;
    
    currentWallet.transactions.forEach(transaction => {
        if (transaction.type === 'income' || transaction.amount > 0) {
            totalIncome += Math.abs(transaction.amount);
        } else if (transaction.type === 'expense' || transaction.amount < 0) {
            totalExpense += Math.abs(transaction.amount);
        }
    });
    
    // Cập nhật hoặc tạo biểu đồ mới
    if (transactionChart) {
        transactionChart.destroy();
    }
    
    transactionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Thu nhập', 'Chi tiêu'],
            datasets: [{
                data: [totalIncome, totalExpense],
                backgroundColor: ['#3498db', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            return `${context.label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
    
    // Cập nhật legend
    document.getElementById('chartLegend').innerHTML = `
        <div class="legend-item">
            <div class="legend-color legend-income"></div>
            <span>Thu nhập: ${formatCurrency(totalIncome)}</span>
        </div>
        <div class="legend-item">
            <div class="legend-color legend-expense"></div>
            <span>Chi tiêu: ${formatCurrency(totalExpense)}</span>
        </div>
    `;
}

//---------------------------------------------------------------------------------------- 


/*Commit 06/12/2025--------------------------------------------------------------------*/
// Thêm vào file script.js (sau cùng)

// Hàm tính tổng tiền tất cả các ví
function calculateTotalBalance() {
    let total = 0;
    wallets.forEach(wallet => {
        total += wallet.balance;
    });
    return total;
}

// Hàm cập nhật hiển thị tổng tiền
function updateTotalBalanceDisplay() {
    const total = calculateTotalBalance();
    const totalBalanceElement = document.getElementById('totalBalanceAmount');
    if (totalBalanceElement) {
        totalBalanceElement.textContent = formatCurrency(total);
    }
}

// Cập nhật hàm updateUI để bao gồm tổng tiền
function updateUI() {
    updateWalletList();
    updateCurrentWallet();
    updateTransactionList();
    updateChart();
    updateTotalBalanceDisplay(); // THÊM DÒNG NÀY
}

// Cập nhật tất cả các hàm thay đổi dữ liệu để gọi updateTotalBalanceDisplay
// Thêm vào cuối các hàm sau:

// Trong handleCreateWallet (sau saveToLocalStorage):
function handleCreateWallet(e) {
    e.preventDefault();
    
    const walletName = document.getElementById('walletName').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;
    
    const newWallet = {
        id: generateId(),
        name: walletName,
        balance: initialBalance,
        currency: 'VND',
        transactions: [{
            id: generateId(),
            type: 'adjustment',
            amount: initialBalance,
            name: 'Số dư ban đầu',
            date: new Date().toISOString(),
            note: 'Khởi tạo ví'
        }],
        createdAt: new Date().toISOString()
    };
    
    wallets.push(newWallet);
    currentWalletId = newWallet.id;
    saveToLocalStorage();
    updateUI(); // Đã có trong code
    closeAllModals();
    createWalletForm.reset();
}

// Trong handleAddTransaction (sau saveToLocalStorage):
function handleAddTransaction(e) {
    e.preventDefault();
    
    const currentWallet = getCurrentWallet();
    if (!currentWallet) {
        alert('Vui lòng chọn một ví trước khi thêm giao dịch');
        closeAllModals();
        return;
    }
    
    const type = document.getElementById('transactionType').value;
    const name = document.getElementById('transactionName').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const date = document.getElementById('transactionDate').value;
    const note = document.getElementById('transactionNote').value;
    
    if (amount <= 0) {
        alert('Số tiền phải lớn hơn 0');
        return;
    }
    
    const transaction = {
        id: generateId(),
        type: type,
        amount: type === 'income' ? amount : -amount,
        name: name,
        date: date,
        note: note
    };
    
    currentWallet.transactions.push(transaction);
    currentWallet.balance += transaction.amount;
    
    saveToLocalStorage();
    updateUI(); // Đã có trong code
    closeAllModals();
    transactionForm.reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
}

// Trong handleAdjustBalance (sau saveToLocalStorage):
function handleAdjustBalance(e) {
    e.preventDefault();
    
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value);
    const adjustmentNote = document.getElementById('adjustmentNote').value;
    
    if (adjustmentAmount === 0) {
        alert('Số tiền điều chỉnh không thể bằng 0');
        return;
    }
    
    const transaction = {
        id: generateId(),
        type: 'adjustment',
        amount: adjustmentAmount,
        name: 'Điều chỉnh số dư',
        date: new Date().toISOString(),
        note: adjustmentNote
    };
    
    currentWallet.transactions.push(transaction);
    currentWallet.balance += adjustmentAmount;
    
    saveToLocalStorage();
    updateUI(); // Đã có trong code
    closeAllModals();
    adjustBalanceForm.reset();
}

// Trong handleTransferMoney (sau saveToLocalStorage):
function handleTransferMoney(e) {
    e.preventDefault();
    
    const fromWalletId = document.getElementById('fromWallet').value;
    const toWalletId = document.getElementById('toWallet').value;
    const transferAmount = parseFloat(document.getElementById('transferAmount').value);
    
    if (fromWalletId === toWalletId) {
        alert('Không thể chuyển tiền cùng một ví');
        return;
    }
    
    if (transferAmount <= 0) {
        alert('Số tiền chuyển phải lớn hơn 0');
        return;
    }
    
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);
    
    if (!fromWallet || !toWallet) {
        alert('Ví không tồn tại');
        return;
    }
    
    if (fromWallet.balance < transferAmount) {
        alert('Số dư ví nguồn không đủ');
        return;
    }
    
    // Create transfer transactions
    const fromTransaction = {
        id: generateId(),
        type: 'expense',
        amount: -transferAmount,
        name: `Chuyển tiền đến ${toWallet.name}`,
        date: new Date().toISOString(),
        note: 'Chuyển tiền giữa các ví'
    };
    
    const toTransaction = {
        id: generateId(),
        type: 'income',
        amount: transferAmount,
        name: `Nhận tiền từ ${fromWallet.name}`,
        date: new Date().toISOString(),
        note: 'Chuyển tiền giữa các ví'
    };
    
    fromWallet.transactions.push(fromTransaction);
    toWallet.transactions.push(toTransaction);
    
    fromWallet.balance -= transferAmount;
    toWallet.balance += transferAmount;
    
    saveToLocalStorage();
    updateUI(); // Đã có trong code
    closeAllModals();
    transferMoneyForm.reset();
}

// Trong deleteCurrentWallet (sau saveToLocalStorage):
function deleteCurrentWallet() {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    if (wallets.length === 1) {
        alert('Không thể xóa ví cuối cùng');
        return;
    }
    
    if (confirm(`Bạn có chắc muốn xóa ví "${currentWallet.name}"?`)) {
        wallets = wallets.filter(w => w.id !== currentWalletId);
        currentWalletId = wallets[0].id;
        localStorage.setItem('currentWalletId', currentWalletId);
        saveToLocalStorage();
        updateUI(); // Đã có trong code
    }
}

// Trong deleteTransaction (sau saveToLocalStorage):
function deleteTransaction(transactionId) {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    const transaction = currentWallet.transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    if (confirm(`Bạn có chắc muốn xóa giao dịch "${transaction.name}"?`)) {
        // Trừ số tiền giao dịch khỏi số dư ví
        currentWallet.balance -= transaction.amount;
        
        // Xóa giao dịch khỏi mảng
        currentWallet.transactions = currentWallet.transactions.filter(t => t.id !== transactionId);
        
        saveToLocalStorage();
        updateUI(); // Đã có trong code
        
        alert('Đã xóa giao dịch thành công!');
    }
}

/*Commit 06/12/2025--------------------------------------------------------------------*/