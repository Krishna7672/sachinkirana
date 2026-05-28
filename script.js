// State variables
let items = [];
// Save ALL invoices permanently
let allInvoicesHistory = JSON.parse(localStorage.getItem('sachinKiranaAllInvoices')) || [];
// Save pending ones specifically for the tracker
let pendingInvoices = JSON.parse(localStorage.getItem('sachinKiranaPending')) || [];
let currentInvoiceObj = null;

// Product Database (Simulating Barcode Data)
// Add your actual store items and their corresponding barcode numbers here.
const productDatabase = {
    "8901030978018": { name: "Maggi Noodles", defaultUnit: "70 g", price: 14 },
    "8901058863632": { name: "Aashirvaad Atta", defaultUnit: "5 kg", price: 210 },
    "8901207041738": { name: "Amul Taaza Milk", defaultUnit: "1 Liter", price: 70 },
    "12345": { name: "Parle-G Biscuits", defaultUnit: "1 Pack", price: 10 },
    "67890": { name: "Toor Dal", defaultUnit: "1 kg", price: 160 }
};

// DOM Elements
const dTime = document.getElementById('current-datetime');
const invNumDisplay = document.getElementById('invoice-number');
const themeToggle = document.getElementById('theme-toggle');

const custName = document.getElementById('cust-name');
const custMobile = document.getElementById('cust-mobile');

const barcodeInput = document.getElementById('barcode-input');
const itemName = document.getElementById('item-name');
const itemUnit = document.getElementById('item-unit');
const itemPrice = document.getElementById('item-price');
const addBtn = document.getElementById('add-item-btn');
const itemsBody = document.getElementById('items-body');
const emptyState = document.getElementById('empty-state');

const finalTotalDisp = document.getElementById('final-total-display');

const payMethod = document.getElementById('payment-method');
const generateBtn = document.getElementById('generate-invoice-btn');

const invoicePreview = document.getElementById('invoice-preview');
const searchPending = document.getElementById('search-pending');
const pendingList = document.getElementById('pending-list');

// Initialize
function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    generateInvoiceNumber();
    renderPendingList();
    
    // Check Theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function updateDateTime() {
    const now = new Date();
    dTime.textContent = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function generateInvoiceNumber() {
    // Generates a unique ID using timestamp and random number to ensure no duplicates
    const uniqueID = `INV-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90)}`;
    invNumDisplay.textContent = uniqueID;
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
});

// Barcode Scanner Listener
// A physical scanner acts as a keyboard and presses "Enter" automatically
barcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const code = barcodeInput.value.trim();
        if (code !== "") {
            handleBarcodeScan(code);
        }
    }
});

function handleBarcodeScan(code) {
    const product = productDatabase[code];
    if (product) {
        items.push({ 
            name: product.name, 
            unit: product.defaultUnit, 
            price: product.price 
        });
        renderItems();
        calculateTotal();
        barcodeInput.value = ''; // Reset for next scan
    } else {
        alert("Product not found in database! Please add manually.");
        barcodeInput.value = '';
    }
}

// Manual Add Item
addBtn.addEventListener('click', () => {
    const name = itemName.value.trim();
    const unit = itemUnit.value.trim() || '1 Unit'; // Default if empty
    const price = parseFloat(itemPrice.value);

    if (name && price > 0) {
        items.push({ name, unit, price });
        
        // Reset inputs
        itemName.value = '';
        itemUnit.value = '';
        itemPrice.value = '';
        
        renderItems();
        calculateTotal();
        barcodeInput.focus(); // Bring focus back to scanner
    } else {
        alert("Please enter a valid item name and price.");
    }
});

// Render Items Table
function renderItems() {
    itemsBody.innerHTML = '';
    if (items.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('items-table').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    document.getElementById('items-table').style.display = 'table';

    items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td><span class="invoice-badge" style="padding:2px 8px;">${item.unit}</span></td>
            <td>₹${item.price.toFixed(2)}</td>
            <td><button class="btn btn-danger" onclick="deleteItem(${index})"><i class="fa-solid fa-trash"></i></button></td>
        `;
        itemsBody.appendChild(tr);
    });
}

// Delete Item
window.deleteItem = function(index) {
    items.splice(index, 1);
    renderItems();
    calculateTotal();
};

function calculateTotal() {
    let total = items.reduce((sum, item) => sum + item.price, 0);
    finalTotalDisp.textContent = `₹${total.toFixed(2)}`;
    return total;
}

// Generate Invoice
generateBtn.addEventListener('click', () => {
    if (items.length === 0) {
        alert("Please add at least one item.");
        return;
    }
    if (!custName.value.trim()) {
        alert("Customer name is required.");
        return;
    }

    const total = calculateTotal();
    const status = payMethod.value === 'Pay Later' ? 'PAYMENT PENDING' : 'PAID';
    
    currentInvoiceObj = {
        id: invNumDisplay.textContent,
        date: new Date().toLocaleString('en-IN'),
        customerName: custName.value.trim(),
        mobile: custMobile.value.trim(),
        items: [...items],
        total: total,
        method: payMethod.value,
        status: status
    };

    // 1. Render Preview
    document.getElementById('inv-date').textContent = currentInvoiceObj.date.split(',')[0];
    document.getElementById('inv-num').textContent = currentInvoiceObj.id;
    document.getElementById('inv-cust-name').textContent = currentInvoiceObj.customerName;
    document.getElementById('inv-cust-mobile').textContent = currentInvoiceObj.mobile || 'N/A';
    
    const invItemsList = document.getElementById('inv-items-list');
    invItemsList.innerHTML = '';
    currentInvoiceObj.items.forEach(item => {
        invItemsList.innerHTML += `
        <div class="inv-item-row">
            <span class="inv-item-name">${item.name}</span>
            <span class="inv-item-unit">(${item.unit})</span>
            <span class="inv-item-price">₹${item.price.toFixed(2)}</span>
        </div>`;
    });

    document.getElementById('inv-total-amt').textContent = `₹${currentInvoiceObj.total.toFixed(2)}`;
    document.getElementById('inv-method').textContent = currentInvoiceObj.method;
    
    const badge = document.getElementById('inv-status-badge');
    badge.textContent = currentInvoiceObj.status;
    badge.className = 'payment-status-badge ' + (status === 'PAID' ? 'status-paid' : 'status-pending');

    invoicePreview.style.display = 'block';

    // 2. Save to Global Invoice History (Saves every bill uniquely)
    allInvoicesHistory.push(currentInvoiceObj);
    localStorage.setItem('sachinKiranaAllInvoices', JSON.stringify(allInvoicesHistory));

    // 3. Handle Pay Later persistence
    if (status === 'PAYMENT PENDING') {
        pendingInvoices.push(currentInvoiceObj);
        savePendingData();
        renderPendingList();
    }
    
    alert(`Invoice ${currentInvoiceObj.id} saved to database successfully!`);
    
    // Prepare for next bill
    generateInvoiceNumber(); 
});

// Share on WhatsApp
document.getElementById('share-wa-btn').addEventListener('click', () => {
    if (!currentInvoiceObj) return;

    let itemsText = currentInvoiceObj.items.map(i => `${i.name} (${i.unit}) - ₹${i.price}`).join('\n');
    let statusText = currentInvoiceObj.status === 'PAYMENT PENDING' ? 'Pending' : 'Paid';
    
    let message = `Hello ${currentInvoiceObj.customerName} 👋\nThank you for shopping at Sachin Kirana 🛒\n\n*Invoice Details: (${currentInvoiceObj.id})*\n${itemsText}\n\n*Total: ₹${currentInvoiceObj.total.toFixed(2)}*\nPayment Method: ${currentInvoiceObj.method}\nStatus: ${statusText}\n\nThank you 🙏`;

    let encodedMsg = encodeURIComponent(message);
    let waUrl = currentInvoiceObj.mobile ? `https://wa.me/91${currentInvoiceObj.mobile}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
    
    window.open(waUrl, '_blank');
});

// Download Invoice as Text File
document.getElementById('download-btn').addEventListener('click', () => {
    if (!currentInvoiceObj) return;

    let textContent = `================================\n`;
    textContent += `         SACHIN KIRANA          \n`;
    textContent += `================================\n`;
    textContent += `Invoice Number: ${currentInvoiceObj.id}\n`;
    textContent += `Date: ${currentInvoiceObj.date}\n`;
    textContent += `Customer: ${currentInvoiceObj.customerName}\n`;
    textContent += `Mobile: ${currentInvoiceObj.mobile || 'N/A'}\n`;
    textContent += `--------------------------------\n`;
    textContent += `Items:\n`;
    
    currentInvoiceObj.items.forEach((item, idx) => {
        textContent += `${idx + 1}. ${item.name} [${item.unit}] - ₹${item.price.toFixed(2)}\n`;
    });
    
    textContent += `--------------------------------\n`;
    textContent += `Total Amount: ₹${currentInvoiceObj.total.toFixed(2)}\n`;
    textContent += `Payment Method: ${currentInvoiceObj.method}\n`;
    textContent += `Payment Status: ${currentInvoiceObj.status}\n`;
    textContent += `================================\n`;
    textContent += `        Thank You! 🙏           \n`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `Sachin_Kirana_${currentInvoiceObj.id}.txt`;
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Print Invoice
document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
});

// Save and Render Pending Invoices
function savePendingData() {
    localStorage.setItem('sachinKiranaPending', JSON.stringify(pendingInvoices));
}

function renderPendingList(filterText = '') {
    pendingList.innerHTML = '';
    
    const filtered = pendingInvoices.filter(inv => inv.customerName.toLowerCase().includes(filterText.toLowerCase()));
    
    if (filtered.length === 0) {
        pendingList.innerHTML = `<p class="empty-state" style="padding:10px;">No pending bills found.</p>`;
        return;
    }

    filtered.forEach((inv, i) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <div class="p-info">
                <h4>${inv.customerName}</h4>
                <p>${inv.id} | ${inv.date.split(',')[0]}</p>
            </div>
            <div class="p-actions">
                <span class="p-amt">₹${inv.total.toFixed(2)}</span>
                <button class="btn-wa-sm" onclick="sendReminder('${inv.customerName}', '${inv.mobile}', ${inv.total})"><i class="fa-brands fa-whatsapp"></i></button>
                <button class="btn-wa-sm" style="background-color: var(--primary)" onclick="markAsPaid(${i})"><i class="fa-solid fa-check"></i></button>
            </div>
        `;
        pendingList.appendChild(div);
    });
}

// Search Pending
searchPending.addEventListener('input', (e) => renderPendingList(e.target.value));

// Send Reminder
window.sendReminder = function(name, mobile, amount) {
    let message = `Hello ${name} 👋\nThis is a reminder from Sachin Kirana regarding your pending payment of *₹${amount.toFixed(2)}*.\n\nPlease complete the payment when possible 🙏`;
    let encodedMsg = encodeURIComponent(message);
    let waUrl = mobile ? `https://wa.me/91${mobile}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
};

// Mark as Paid
window.markAsPaid = function(index) {
    if(confirm("Mark this invoice as Paid?")) {
        // Find the invoice in the main history to update its status to PAID
        const pendingInvoiceId = pendingInvoices[index].id;
        const historyIndex = allInvoicesHistory.findIndex(inv => inv.id === pendingInvoiceId);
        if (historyIndex !== -1) {
            allInvoicesHistory[historyIndex].status = "PAID";
            localStorage.setItem('sachinKiranaAllInvoices', JSON.stringify(allInvoicesHistory));
        }

        // Remove from pending tracker
        pendingInvoices.splice(index, 1);
        savePendingData();
        renderPendingList(searchPending.value);
    }
};

// Start
init();