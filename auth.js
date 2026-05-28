// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://dzquzetqftvphhbzgedz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cXV6ZXRxZnR2cGhoYnpnZWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzQwNjEsImV4cCI6MjA5NTUxMDA2MX0.jYRP99xLfQTAltf8ByAzFpT4JpLB-hvSmf4_8-KsUlI'; // You MUST replace this with your actual anon key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const errorMsg = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');

// Check if already logged in
async function checkCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html'; // Redirect to app if already logged in
    }
}

checkCurrentSession();

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload
    
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    errorMsg.style.display = 'none';

    // Supabase requires email format, so we expect an email here
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = "Log In";
    } else {
        // Success! Redirect to main app
        window.location.href = 'index.html';
    }
});