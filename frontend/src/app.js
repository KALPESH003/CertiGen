/**
 * CertiGen Frontend Controller
 * Handles Public Verification and Admin Panel Interactions
 */

// ==============================================
// 1. Configuration & State
// ==============================================
const API_URL = 'http://localhost:5000/api'; 

const DOM = {
    // Verification Elements
    verifyForm: document.getElementById('verifyForm'),
    certInput: document.getElementById('certificateIdInput'),
    resultContainer: document.getElementById('resultContainer'),
    errorContainer: document.getElementById('errorContainer'),
    errorMessage: document.getElementById('errorMessage'),
    loadingBtn: document.querySelector('#verifyForm button'),
    
    // Result Fields
    resName: document.getElementById('resName'),
    resCourse: document.getElementById('resCourse'),
    resDate: document.getElementById('resDate'),
    resIssuer: document.getElementById('resIssuer'),
    downloadBtn: document.getElementById('downloadBtn'),
};

// ==============================================
// 2. Main Router (Page Detection)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Route: Admin Panel
    // We let admin.js handle the logic if we are on the admin page.
    // We only trigger specific shared logic here if needed.
    if (path.includes('admin.html')) {
        console.log('Admin Panel Detected - handing over to admin.js');
        return; 
    } 
    
    // Route: Public Home (Verification)
    initVerification();
});

// ==============================================
// 3. Public Verification Logic
// ==============================================
function initVerification() {
    if (!DOM.verifyForm) return;

    DOM.verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const certId = DOM.certInput.value.trim();
        if (!certId) return;

        // UI: Set Loading State
        setLoading(true);
        hideError();
        DOM.resultContainer.classList.add('hidden');

        try {
            // API Call
            const response = await fetch(`${API_URL}/verify/${certId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Certificate not found');
            }

            // Render Data
            renderCertificate(result.data);

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });
}

function renderCertificate(data) {
    // Populate Fields
    DOM.resName.textContent = data.recipientName;
    DOM.resCourse.textContent = data.courseTitle;
    DOM.resDate.textContent = new Date(data.issueDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    DOM.resIssuer.textContent = data.issuedBy || "CertiGen Authority";
    DOM.downloadBtn.href = `${API_URL}/certificates/${data.certificateId}/download`;

    // Show Container
    DOM.resultContainer.classList.remove('hidden');
}

function setLoading(isLoading) {
    const btn = DOM.loadingBtn;
    if(!btn) return;
    
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...`;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.innerHTML = `Verify`;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function showError(msg) {
    if(DOM.errorContainer) {
        DOM.errorContainer.classList.remove('hidden');
        DOM.errorMessage.textContent = msg;
    } else {
        alert(msg);
    }
}

function hideError() {
    if(DOM.errorContainer) DOM.errorContainer.classList.add('hidden');
}