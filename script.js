// --- SUPABASE SETUP ---
const SUPABASE_URL = 'https://dzquzetqftvphhbzgedz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cXV6ZXRxZnR2cGhoYnpnZWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzQwNjEsImV4cCI6MjA5NTUxMDA2MX0.jYRP99xLfQTAltf8ByAzFpT4JpLB-hvSmf4_8-KsUlI'; // You MUST replace this with your actual anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PROTECT THE PAGE ---
async function checkAuth() {
    try {
        const { data, error } = await supabase.auth.getSession();
        
        // If there's an error or no active session, kick them to login page
        if (error || !data.session) {
            window.location.replace('login.html');
            return false;
        }
        return true; // User is authenticated
    } catch (err) {
        window.location.replace('login.html');
        return false;
    }
}

// --- LOGOUT FUNCTIONALITY ---
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.replace('login.html');
});

// Start the app
async function init() {
    // 1. Verify user is logged in before loading anything else
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    // 2. Load the rest of the app
    updateDateTime();
    setInterval(updateDateTime, 1000);
    generateInvoiceNumber();
    fetchPendingBills(); 
    
    // Check Theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

// --- CONFIGURATION ---
const COUNTRY_CODE = "91"; // Default India WhatsApp Country Code

// Dummy Product Database
const productDatabase = {
    "8901030978018": { name: "Maggi Noodles", defaultUnit: "70 g", price: 14 },
    "8901058863632": { name: "Aashirvaad Atta", defaultUnit: "5 kg", price: 210 },
    "8901207041738": { name: "Amul Milk", defaultUnit: "1 Liter", price: 70 },
    "12345": { name: "Parle-G", defaultUnit: "1 Pack", price: 10 },
    "67890": { name: "Toor Dal", defaultUnit: "1 kg", price: 160 }
};

// State variables
let items = [];
let pendingInvoices = [];
let currentInvoiceObj = null;
let html5QrCode = null; // Camera Scanner Object

// DOM Elements
const dTime = document.getElementById('current-datetime');
const invNumDisplay = document.getElementById('invoice-number');
const themeToggle = document.getElementById('theme-toggle');

const custName = document.getElementById('cust-name');
const custMobile = document.getElementById('cust-mobile');

const barcodeInput = document.getElementById('barcode-input');
const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const cameraContainer = document.getElementById('camera-container');

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

function updateDateTime() {
    dTime.textContent = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function generateInvoiceNumber() {
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

// ==========================================
// 1. PHYSICAL BARCODE SCANNER (KEYBOARD)
// ==========================================
barcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const code = barcodeInput.value.trim();
        if (code !== "") handleBarcodeScan(code);
    }
});

// ==========================================
// 2. REAL CAMERA SCANNER (MOBILE / WEBCAM)
// ==========================================
startCameraBtn.addEventListener('click', () => {
    cameraContainer.style.display = 'block';
    
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (decodedText) => {
            playBeep();
            handleBarcodeScan(decodedText);
        },
        (errorMessage) => {
            // Ignore continuous background errors while searching for barcode
        }
    ).catch(err => {
        alert("Camera Error: Please ensure you granted camera permissions and are running on localhost/HTTPS.");
        cameraContainer.style.display = 'none';
    });
});

stopCameraBtn.addEventListener('click', stopCamera);

function stopCamera() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            cameraContainer.style.display = 'none';
        }).catch(err => console.log(err));
    }
}

function playBeep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

// Common function for BOTH Physical and Camera Scanners
async function handleBarcodeScan(code) {
    const product = productDatabase[code];
    if (product) {
        items.push({ name: product.name, unit: product.defaultUnit, price: product.price });
        renderItems();
        calculateTotal();
        barcodeInput.value = ''; 
    } else {
        alert(`Product not found! (Scanned Code: ${code})`);
        barcodeInput.value = '';
    }
}

// ==========================================
// MANUAL ITEM ADDITION
// ==========================================
addBtn.addEventListener('click', () => {
    const name = itemName.value.trim();
    const unit = itemUnit.value.trim() || '1 Unit';
    const price = parseFloat(itemPrice.value);

    if (name && price > 0) {
        items.push({ name, unit, price });
        itemName.value = ''; itemUnit.value = ''; itemPrice.value = '';
        renderItems();
        calculateTotal();
        barcodeInput.focus();
    } else {
        alert("Please enter a valid item name and price.");
    }
});

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

// ==========================================
// GENERATE INVOICE
// ==========================================
generateBtn.addEventListener('click', async () => {
    if (items.length === 0) return alert("Please add at least one item.");
    if (!custName.value.trim()) return alert("Customer name is required.");

    const total = calculateTotal();
    const status = payMethod.value === 'Pay Later' ? 'PAYMENT PENDING' : 'PAID';
    
    currentInvoiceObj = {
        id: invNumDisplay.textContent,
        date: new Date().toLocaleString('en-IN'),
        customer_name: custName.value.trim(),
        mobile: custMobile.value.trim(),
        total: total,
        method: payMethod.value,
        status: status
    };

    try {
        // 1. Insert Invoice
        const { error: invError } = await supabase
            .from('invoices')
            .insert([currentInvoiceObj]);

        if (invError) throw invError;

        // Note: For simplicity we are just inserting the main invoice in Supabase here.
        // If you had an invoice_items table in Supabase you would insert items array here too.

        // Render Preview
        document.getElementById('inv-date').textContent = currentInvoiceObj.date.split(',')[0];
        document.getElementById('inv-num').textContent = currentInvoiceObj.id;
        document.getElementById('inv-cust-name').textContent = currentInvoiceObj.customer_name;
        document.getElementById('inv-cust-mobile').textContent = currentInvoiceObj.mobile || 'N/A';
        
        const invItemsList = document.getElementById('inv-items-list');
        invItemsList.innerHTML = '';
        items.forEach(item => {
            invItemsList.innerHTML += `<div class="inv-item-row"><span class="inv-item-name">${item.name}</span><span class="inv-item-unit">(${item.unit})</span><span class="inv-item-price">₹${item.price.toFixed(2)}</span></div>`;
        });

        document.getElementById('inv-total-amt').textContent = `₹${currentInvoiceObj.total.toFixed(2)}`;
        document.getElementById('inv-method').textContent = currentInvoiceObj.method;
        
        const badge = document.getElementById('inv-status-badge');
        badge.textContent = currentInvoiceObj.status;
        badge.className = 'payment-status-badge ' + (status === 'PAID' ? 'status-paid' : 'status-pending');

        invoicePreview.style.display = 'block';

        if (status === 'PAYMENT PENDING') {
            fetchPendingBills();
        }
        
        stopCamera();
        alert(`Invoice ${currentInvoiceObj.id} saved to Supabase!`);
        generateInvoiceNumber(); 
        
        // clear cart for next bill
        items = [];
        renderItems();
        calculateTotal();
        custName.value = '';
        custMobile.value = '';
        
    } catch (e) {
        console.error(e);
        alert("Failed to save invoice to Supabase.");
    }
});

// ==========================================
// WHATSAPP API GENERATOR
// ==========================================
function formatWhatsAppAPI(mobile, message) {
    let encodedMsg = encodeURIComponent(message);
    if (!mobile) return `https://wa.me/?text=${encodedMsg}`;
    
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) {
        cleanMobile = COUNTRY_CODE + cleanMobile;
    }
    
    return `https://wa.me/${cleanMobile}?text=${encodedMsg}`;
}

document.getElementById('share-wa-btn').addEventListener('click', () => {
    if (!currentInvoiceObj) return;

    let itemsText = items.map(i => `${i.name} (${i.unit}) - ₹${i.price}`).join('\n');
    let statusText = currentInvoiceObj.status === 'PAYMENT PENDING' ? 'Pending' : 'Paid';
    
    let message = `Hello ${currentInvoiceObj.customer_name} 👋\nThank you for shopping at Sachin Kirana 🛒\n\n*Invoice Details: (${currentInvoiceObj.id})*\n${itemsText}\n\n*Total: ₹${currentInvoiceObj.total.toFixed(2)}*\nPayment Method: ${currentInvoiceObj.method}\nStatus: ${statusText}\n\nThank you 🙏`;

    let waUrl = formatWhatsAppAPI(currentInvoiceObj.mobile, message);
    window.open(waUrl, '_blank');
});

// Download & Print
document.getElementById('print-btn').addEventListener('click', () => window.print());

// ==========================================
// PENDING BILLS & REMINDERS
// ==========================================
async function fetchPendingBills() {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('status', 'PAYMENT PENDING');

        if (data && !error) {
            pendingInvoices = data;
            renderPendingList();
        }
    } catch (e) {
        console.error("Failed to fetch pending bills from Supabase");
    }
}

function renderPendingList(filterText = '') {
    pendingList.innerHTML = '';
    const filtered = pendingInvoices.filter(inv => inv.customer_name.toLowerCase().includes(filterText.toLowerCase()));
    if (filtered.length === 0) return pendingList.innerHTML = `<p class="empty-state" style="padding:10px;">No pending bills found.</p>`;

    filtered.forEach((inv, i) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <div class="p-info"><h4>${inv.customer_name}</h4><p>${inv.id} | ${inv.date.split(',')[0]}</p></div>
            <div class="p-actions">
                <span class="p-amt">₹${inv.total.toFixed(2)}</span>
                <button class="btn-wa-sm" onclick="sendReminder('${inv.customer_name}', '${inv.mobile}', ${inv.total})"><i class="fa-brands fa-whatsapp"></i></button>
                <button class="btn-wa-sm" style="background-color: var(--primary)" onclick="markAsPaid('${inv.id}')"><i class="fa-solid fa-check"></i></button>
            </div>
        `;
        pendingList.appendChild(div);
    });
}

searchPending.addEventListener('input', (e) => renderPendingList(e.target.value));

window.sendReminder = function(name, mobile, amount) {
    let message = `Hello ${name} 👋\nThis is a reminder from Sachin Kirana regarding your pending payment of *₹${amount.toFixed(2)}*.\n\nPlease complete the payment when possible 🙏`;
    let waUrl = formatWhatsAppAPI(mobile, message);
    window.open(waUrl, '_blank');
};

window.markAsPaid = async function(id) {
    if(confirm("Mark this invoice as Paid?")) {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'PAID' })
                .eq('id', id);

            if (!error) {
                fetchPendingBills(); // Refresh list
            } else {
                alert("Failed to update status in Supabase.");
            }
        } catch (e) {
            alert("Error updating status.");
        }
    }
};

init();