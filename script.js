// Application state
let wallets = JSON.parse(localStorage.getItem('wallets')) || [];
let currentWalletId = localStorage.getItem('currentWalletId');
let selectedDate = new Date().toISOString().split('T')[0];

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

// Chart variable
let transactionChart = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateUI();
});

function initializeApp() {
    // Set current date as default for transaction date
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // Set current date for filter
    document.getElementById('dateFilter').value = selectedDate;
    
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

    // Date filter
    document.getElementById('dateFilter').addEventListener('change', function(e) {
        selectedDate = e.target.value;
        updateUI();
    });
    
    document.getElementById('todayBtn').addEventListener('click', function() {
        selectedDate = new Date().toISOString().split('T')[0];
        document.getElementById('dateFilter').value = selectedDate;
        updateUI();
    });

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
    // Reset forms
    createWalletForm.reset();
    transactionForm.reset();
    adjustBalanceForm.reset();
    transferMoneyForm.reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
}

// Wallet management
function handleCreateWallet(e) {
    e.preventDefault();
    
    const walletName = document.getElementById('walletName').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value.replace(/\./g, '')) || 0;
    
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
    
    const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value.replace(/\./g, ''));
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
    const transferAmount = parseFloat(document.getElementById('transferAmount').value.replace(/\./g, ''));
    
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
}

function deleteCurrentWallet() {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return;
    
    if (wallets.length === 1) {
        alert('Không thể xóa ví cuối cùng');
        return;
    }
    
    if (confirm(`Bạn có chắc muốn xóa ví "${currentWallet.name}"? Tất cả giao dịch trong ví này sẽ bị mất.`)) {
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
    const amount = parseFloat(document.getElementById('transactionAmount').value.replace(/\./g, ''));
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
}

// Daily Statistics
function calculateDailyStatistics() {
    const currentWallet = getCurrentWallet();
    if (!currentWallet) return { income: 0, expense: 0, balance: 0 };
    
    let dailyIncome = 0;
    let dailyExpense = 0;
    let dailyBalance = currentWallet.balance;
    
    // Calculate total income and expense for selected date
    currentWallet.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        
        if (transactionDate === selectedDate) {
            if (transaction.amount > 0) {
                dailyIncome += transaction.amount;
            } else {
                dailyExpense += Math.abs(transaction.amount);
            }
        }
    });
    
    return {
        income: dailyIncome,
        expense: dailyExpense,
        balance: dailyBalance
    };
}

function updateDailyStatistics() {
    const stats = calculateDailyStatistics();
    
    document.getElementById('dailyIncome').textContent = formatCurrency(stats.income);
    document.getElementById('dailyExpense').textContent = formatCurrency(stats.expense);
    document.getElementById('dailyBalance').textContent = formatCurrency(stats.balance);
}

// UI Update functions
function updateUI() {
    updateWalletList();
    updateCurrentWallet();
    updateTransactionList();
    updateChart();
    updateTotalBalanceDisplay();
    updateDailyStatistics();
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

// function updateTransactionList() {
//     const currentWallet = getCurrentWallet();
//     transactionList.innerHTML = '';
    
//     if (!currentWallet || currentWallet.transactions.length === 0) {
//         transactionList.innerHTML = `
//             <div class="no-transactions">
//                 <div class="transaction-item">
//                     <div class="transaction-info">
//                         <div class="transaction-name">Không có giao dịch</div>
//                         <div class="transaction-date">${formatDate(new Date().toISOString())}</div>
//                     </div>
//                     <div class="transaction-amount">0 đ</div>
//                 </div>
//             </div>
//         `;
//         return;
//     }
    
//     // Filter transactions by selected date
//     const filteredTransactions = currentWallet.transactions.filter(transaction => {
//         const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
//         return transactionDate === selectedDate;
//     });
    
//     if (filteredTransactions.length === 0) {
//         transactionList.innerHTML = `
//             <div class="no-transactions">
//                 <div class="transaction-item">
//                     <div class="transaction-info">
//                         <div class="transaction-name">Không có giao dịch ngày ${formatDate(selectedDate + 'T00:00:00')}</div>
//                         <div class="transaction-date">${formatDate(selectedDate + 'T00:00:00')}</div>
//                     </div>
//                     <div class="transaction-amount">0 đ</div>
//                 </div>
//             </div>
//         `;
//         return;
//     }
    
//     const sortedTransactions = [...filteredTransactions].sort((a, b) => 
//         new Date(b.date) - new Date(a.date)
//     );
    
//     sortedTransactions.forEach(transaction => {
//         const transactionElement = document.createElement('div');
//         transactionElement.className = 'transaction-item';
        
//         const amountClass = transaction.amount > 0 ? 'income' : 'expense';
//         const amountSign = transaction.amount > 0 ? '+' : '';
        
//         transactionElement.innerHTML = `
//             <div class="transaction-info">
//                 <div class="transaction-name">${transaction.name}</div>
//                 <div class="transaction-date">${formatDate(transaction.date)}</div>
//                 ${transaction.note ? `<div class="transaction-note">${transaction.note}</div>` : ''}
//             </div>
//             <div class="transaction-amount-container">  
//                 <div class="transaction-amount ${amountClass}">
//                     ${amountSign}${formatCurrency(Math.abs(transaction.amount))}
//                 </div>
//                <button class="delete-transaction-btn" data-transaction-id="${transaction.id}">
//                     <i class="bi bi-trash-fill"></i>
//                 </button>
//             </div>
//         `;
        
//         // Add delete transaction event
//         const deleteBtn = transactionElement.querySelector('.delete-transaction-btn');
//         deleteBtn.addEventListener('click', (e) => {
//             e.stopPropagation();
//             deleteTransaction(transaction.id);
//         });
        
//         transactionList.appendChild(transactionElement);
//     });
// }

function updateTransactionList() {
    const currentWallet = getCurrentWallet();
    transactionList.innerHTML = '';
    
    if (!currentWallet || currentWallet.transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="no-transactions">
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">Không có giao dịch</div>
                        <div class="transaction-date">${formatDate(new Date().toISOString())}</div>
                    </div>
                    <div class="transaction-amount">0 đ</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Filter transactions by selected date
    const filteredTransactions = currentWallet.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        return transactionDate === selectedDate;
    });
    
    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="no-transactions">
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">Không có giao dịch ngày ${formatDate(selectedDate + 'T00:00:00')}</div>
                        <div class="transaction-date">${formatDate(selectedDate + 'T00:00:00')}</div>
                    </div>
                    <div class="transaction-amount">0 đ</div>
                </div>
            </div>
        `;
        return;
    }
    
    const sortedTransactions = [...filteredTransactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedTransactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        
        const amountClass = transaction.amount > 0 ? 'income' : 'expense';
        // CẬP NHẬT: Thêm dấu + cho thu, - cho chi
        const amountSign = transaction.amount > 0 ? '+' : '-';
        
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
        
        // Add delete transaction event
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
        // Subtract transaction amount from wallet balance
        currentWallet.balance -= transaction.amount;
        
        // Remove transaction from array
        currentWallet.transactions = currentWallet.transactions.filter(t => t.id !== transactionId);
        
        saveToLocalStorage();
        updateUI();
        
        alert('Đã xóa giao dịch thành công!');
    }
}

// Chart functions
function updateChart() {
    const currentWallet = getCurrentWallet();
    const ctx = document.getElementById('transactionChart').getContext('2d');
    
    // Calculate daily income and expense for selected date
    let dailyIncome = 0;
    let dailyExpense = 0;
    
    if (currentWallet && currentWallet.transactions.length > 0) {
        currentWallet.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
            
            if (transactionDate === selectedDate) {
                if (transaction.amount > 0) {
                    dailyIncome += Math.abs(transaction.amount);
                } else {
                    dailyExpense += Math.abs(transaction.amount);
                }
            }
        });
    }
    
    // Update or create new chart
    if (transactionChart) {
        transactionChart.destroy();
    }
    
    transactionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Thu nhập', 'Chi tiêu'],
            datasets: [{
                data: [dailyIncome, dailyExpense],
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
    
    // Update legend
    document.getElementById('chartLegend').innerHTML = `
        <div class="legend-item">
            <div class="legend-color legend-income"></div>
            <span>Thu nhập: ${formatCurrency(dailyIncome)}</span>
        </div>
        <div class="legend-item">
            <div class="legend-color legend-expense"></div>
            <span>Chi tiêu: ${formatCurrency(dailyExpense)}</span>
        </div>
    `;
}

// Total balance calculation
function calculateTotalBalance() {
    let total = 0;
    wallets.forEach(wallet => {
        total += wallet.balance;
    });
    return total;
}

function updateTotalBalanceDisplay() {
    const total = calculateTotalBalance();
    const totalBalanceElement = document.getElementById('totalBalanceAmount');
    if (totalBalanceElement) {
        totalBalanceElement.textContent = formatCurrency(total);
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
    }).format(amount) + ' đ';
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

// Format input fields for thousands separator
document.addEventListener('DOMContentLoaded', function() {
    // Format input fields on input
    document.querySelectorAll('.amount-input').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                value = parseInt(value, 10);
                e.target.value = value.toLocaleString('vi-VN');
            }
        });
    });
});
