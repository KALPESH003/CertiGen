/**
 * CertiGen Admin Logic
 * Handles Dashboard, Certificate Management, and Issuing
 */

const API_BASE = 'http://localhost:5000/api';

// ==============================================
// GLOBAL STATE
// ==============================================
let currentUser = null;
let allTemplates = []; // Store fetched templates here
let currentEditingTemplateId = null; // Track if we are editing or creating

// ==============================================
// 1. Initialization & Auth Check
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('authView')) {
        console.log("Admin Page Loaded. Checking Auth...");
        checkAuthStatus();
        setupEventListeners();
        
        // Init Responsive Preview Listener
        window.addEventListener('resize', fitPreview);
    }
});

async function checkAuthStatus() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        const data = await res.json();

        if (data.success) {
            currentUser = data.data;
            showDashboard();
        } else {
            showLogin();
        }
    } catch (err) {
        showLogin();
    }
}

// ==============================================
// 2. View Switching Logic
// ==============================================
function showLogin() {
    document.getElementById('authView').classList.remove('hidden');
    document.getElementById('dashboardView').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    
    if(document.getElementById('navUserName')) document.getElementById('navUserName').textContent = currentUser.name;
    if(document.getElementById('navUserRole')) document.getElementById('navUserRole').textContent = currentUser.role;

    switchView('dashboard');
}

window.switchView = (viewName) => {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.remove('hidden');
        if (viewName === 'dashboard') loadStats();
        if (viewName === 'certificates') loadCertificates();
        if (viewName === 'issue') loadTemplatesForDropdown();
        if (viewName === 'templates') loadTemplatesGallery();
    }
};

// ==============================================
// 3. Authentication & Form Handlers
// ==============================================
function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorMsg = document.getElementById('loginError');

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });

                const data = await res.json();

                if (data.success) {
                    errorMsg.classList.add('hidden');
                    window.location.reload(); 
                } else {
                    throw new Error(data.message);
                }
            } catch (err) {
                errorMsg.textContent = err.message || "Connection Error";
                errorMsg.classList.remove('hidden');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch(`${API_BASE}/auth/logout`, { credentials: 'include' });
            window.location.reload();
        });
    }

    // Issue Certificate Form
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        issueForm.addEventListener('submit', handleIssueCertificate);
    }

    // Template Creation/Edit Form (Triggered manually via footer button now)
    const templateForm = document.getElementById('templateForm');
    if (templateForm) {
        templateForm.addEventListener('submit', handleCreateTemplate);
    }

    // Edit Certificate Form
    const editForm = document.getElementById('editCertificateForm');
    if (editForm) {
        editForm.addEventListener('submit', handleUpdateCertificate);
    }
}

// ==============================================
// 4. Data Loading: Certificates
// ==============================================
async function loadCertificates() {
    const tbody = document.getElementById('certificatesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/certificates`, { credentials: 'include' });
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(cert => {
                const safeName = cert.recipientName.replace(/'/g, "\\'");
                const safeTitle = cert.courseTitle.replace(/'/g, "\\'");
                const safeId = cert._id;

                return `
                <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <td class="px-6 py-4 font-medium text-slate-900">${cert.recipientName}</td>
                    <td class="px-6 py-4 text-slate-600">${cert.courseTitle}</td>
                    <td class="px-6 py-4 text-slate-500">${new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                            cert.status === 'Issued' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${cert.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end items-center gap-3">
                            <a href="${API_BASE}/certificates/${cert._id}/download" target="_blank" class="text-slate-400 hover:text-brand-600 transition-colors" title="Download PDF">
                                <i class="fa-solid fa-file-pdf"></i>
                            </a>
                            <button onclick="openEditModal('${safeId}', '${safeName}', '${safeTitle}')" class="text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteCertificate('${cert._id}')" class="text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No certificates issued yet.</td></tr>';
        }
    } catch (err) {
        console.error("Load Certificates Error:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

// ==============================================
// 5. Data Loading: Templates Dropdown & Issue
// ==============================================
async function loadTemplatesForDropdown() {
    const select = document.getElementById('templateSelect');
    if(!select) return;

    try {
        const res = await fetch(`${API_BASE}/templates`, { credentials: 'include' });
        const data = await res.json();
        
        if (data.success) {
            select.innerHTML = data.data.map(t => 
                `<option value="${t._id}">${t.name} ${t.isDefault ? '(Default)' : ''}</option>`
            ).join('');
        }
    } catch (err) {
        console.error('Failed to load templates', err);
    }
}

async function handleIssueCertificate(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = 'Generating...';

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
        const res = await fetch(`${API_BASE}/certificates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            alert('Certificate Issued Successfully!');
            e.target.reset();
            switchView('certificates'); 
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('System Error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// ==============================================
// 6. Template Management (CRUD + PREVIEW)
// ==============================================

// --- READ: Load Gallery ---
async function loadTemplatesGallery() {
    const grid = document.getElementById('templatesGrid');
    if(!grid) return;

    try {
        const res = await fetch(`${API_BASE}/templates`, { credentials: 'include' });
        const data = await res.json();
        
        if (data.success) {
            // STORE TEMPLATES GLOBALLY
            allTemplates = data.data; 

            grid.innerHTML = data.data.map(t => {
                const isDarkTheme = t.layout?.global?.textColor === '#FFFFFF';
                
                return `
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                    <div class="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                        <img src="${t.backgroundUrl}" class="w-full h-full object-cover" alt="${t.name}">
                        <div class="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded ${isDarkTheme ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 shadow'}">
                            ${isDarkTheme ? 'Dark Mode' : 'Light Mode'}
                        </div>
                    </div>
                    <div class="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="font-bold text-slate-800 truncate" title="${t.name}">${t.name}</h3>
                            <p class="text-xs text-slate-500 mt-1">Created: ${new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
                             <button onclick="prepareEditTemplate('${t._id}')" class="text-slate-400 hover:text-brand-600 transition-colors" title="Edit Template">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteTemplate('${t._id}')" class="text-slate-400 hover:text-red-600 transition-colors" title="Delete Template">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `}).join('');
            
            grid.innerHTML += `
                <div onclick="openTemplateModal()" class="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all h-full min-h-[250px]">
                    <i class="fa-solid fa-plus text-3xl text-slate-400 mb-3"></i>
                    <span class="font-medium text-slate-500">Add New Template</span>
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to load templates gallery', err);
    }
}

// --- PREVIEW LOGIC ---
window.updatePreview = () => {
    const form = document.getElementById('templateForm');
    if (!form) return;

    const bgUrlInput = form.elements['backgroundUrl'].value;
    const jsonInput = form.elements['layout'].value;
    
    // Safety check for radio button
    const themeRadio = form.querySelector('input[name="textTheme"]:checked');
    const textTheme = themeRadio ? themeRadio.value : 'dark';
    
    // 1. Update Background
    const previewBg = document.getElementById('previewBg');
    if (previewBg && bgUrlInput) {
        previewBg.src = bgUrlInput.startsWith('/') ? bgUrlInput : `/${bgUrlInput}`;
    }
    
    // 2. Parse JSON
    let layout;
    try {
        layout = JSON.parse(jsonInput);
    } catch (e) {
        return; 
    }

    // 3. Clear Previous Elements
    const container = document.getElementById('previewElements');
    if(!container) return;
    container.innerHTML = '';

    // 4. Global Settings
    const globalColor = (textTheme === 'light') ? '#FFFFFF' : '#000000';
    const globalAlign = layout.global?.textAlign || 'center';

    // 5. Render Function
    const createField = (key, text, isBold = false) => {
        if (!layout[key]) return;
        const field = layout[key];
        
        const el = document.createElement('div');
        el.textContent = text;
        
        // Styles
        el.style.position = 'absolute';
        el.style.top = `${field.y}px`;
        el.style.fontSize = `${field.fontSize}px`;
        el.style.color = field.color || globalColor;
        el.style.fontFamily = 'Helvetica, Arial, sans-serif';
        el.style.zIndex = '100';
        el.style.lineHeight = '1.2';
        if (isBold) el.style.fontWeight = 'bold';

        // Alignment Logic
        if (globalAlign === 'center') {
            el.style.width = '100%';
            el.style.left = '0';
            el.style.textAlign = 'center';
        } else {
            el.style.left = `${field.x}px`;
            el.style.textAlign = 'left';
            el.style.whiteSpace = 'nowrap';
        }

        container.appendChild(el);
    };

    // 6. Mock Data
    createField('recipientName', 'Jane Doe (Preview)', true);
    createField('courseTitle', 'Bachelor of Technology', true);
    createField('description', 'For successfully completing all requirements.', false);
    
    if (layout.date) createField('date', `${layout.date.label || 'Date: '}12/05/2024`, false);
    if (layout.certificateId) createField('certificateId', `${layout.certificateId.label || 'ID: '}CERT-DEMO-123`, false);

    // Signature
    if (layout.signature) {
        const sig = layout.signature;
        const img = document.createElement('img');
        img.src = '/assets/signature.png'; 
        img.onerror = function() { this.style.display='none'; };
        
        img.style.position = 'absolute';
        img.style.top = `${sig.y}px`;
        img.style.width = `${sig.width}px`;
        img.style.height = `${sig.height}px`;
        img.style.objectFit = 'contain';
        img.style.zIndex = '100';

        if (globalAlign === 'center') {
            img.style.left = '50%';
            img.style.transform = 'translateX(-50%)';
        } else {
            img.style.left = `${sig.x}px`;
        }
        container.appendChild(img);
    }

    // QR Code
    if (layout.qrCode) {
        const qr = layout.qrCode;
        const box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.top = `${qr.y}px`;
        box.style.width = `${qr.size}px`;
        box.style.height = `${qr.size}px`;
        box.style.backgroundColor = 'rgba(0,0,0,0.1)';
        box.style.border = `2px dashed ${globalColor}`;
        box.style.display = 'flex';
        box.style.alignItems = 'center';
        box.style.justifyContent = 'center';
        box.style.color = globalColor;
        box.style.fontSize = '10px';
        box.innerText = 'QR';

        if (globalAlign === 'center') {
            box.style.left = '50%';
            box.style.transform = 'translateX(-50%)';
        } else {
            box.style.left = `${qr.x}px`;
        }
        container.appendChild(box);
    }
}

// --- AUTO SCALE LOGIC ---
window.fitPreview = () => {
    const container = document.querySelector('#previewCanvas')?.parentElement;
    const canvas = document.getElementById('previewCanvas');
    if (!container || !canvas) return;

    const availableWidth = container.clientWidth - 40; 
    const paperWidth = 1123; 
    
    let scale = availableWidth / paperWidth;
    if (scale > 1) scale = 1;

    canvas.style.transform = `scale(${scale})`;
}

// --- CREATE & UPDATE: Handle Form ---
window.openTemplateModal = () => {
    const modal = document.getElementById('templateModal');
    if(modal) {
        modal.classList.remove('hidden');
        // Trigger initial preview and scale
        setTimeout(() => {
            if(typeof updatePreview === 'function') updatePreview();
            if(typeof fitPreview === 'function') fitPreview();
        }, 50);
    }
};

window.closeTemplateModal = () => {
    const modal = document.getElementById('templateModal');
    const form = document.getElementById('templateForm');
    
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
    
    currentEditingTemplateId = null;
    
    // SAFE UPDATE: Use specific IDs to avoid "Cannot set property of null"
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = "Add New Template";
    
    const btn = document.getElementById('btnSaveTemplate');
    if (btn) {
        btn.innerText = "Save Template";
        btn.disabled = false;
    }
};

// Populate Modal for Editing
window.prepareEditTemplate = (id) => {
    const template = allTemplates.find(t => t._id === id);
    if (!template) return;

    currentEditingTemplateId = id;

    const form = document.getElementById('templateForm');
    if (!form) return;
    
    // Fill fields safely
    if (form.elements['name']) form.elements['name'].value = template.name;
    if (form.elements['backgroundUrl']) form.elements['backgroundUrl'].value = template.backgroundUrl;
    if (form.elements['isDefault']) form.elements['isDefault'].checked = template.isDefault;
    if (form.elements['layout']) form.elements['layout'].value = JSON.stringify(template.layout, null, 4);

    const isWhiteText = template.layout?.global?.textColor === '#FFFFFF';
    if(isWhiteText) {
        const radio = form.querySelector('input[value="light"]');
        if(radio) radio.checked = true;
    } else {
        const radio = form.querySelector('input[value="dark"]');
        if(radio) radio.checked = true;
    }

    // Update Modal Title and Button using IDs
    const title = document.getElementById('modalTitle');
    if(title) title.textContent = "Edit Template";
    
    const btn = document.getElementById('btnSaveTemplate');
    if(btn) btn.innerText = "Update Template";

    const modal = document.getElementById('templateModal');
    if(modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            if(typeof updatePreview === 'function') updatePreview();
            if(typeof fitPreview === 'function') fitPreview();
        }, 50);
    }
};

// Helper for the custom submit button in HTML
window.submitTemplateForm = () => {
    const form = document.getElementById('templateForm');
    if(form) form.dispatchEvent(new Event('submit'));
}

async function handleCreateTemplate(e) {
    e.preventDefault();
    
    // SAFE BUTTON SELECTION using ID
    const btn = document.getElementById('btnSaveTemplate');
    const originalText = btn ? btn.innerText : 'Save';

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Saving...';
    }

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const backgroundUrl = formData.get('backgroundUrl');
    const isDefault = formData.get('isDefault') === 'on';
    const textTheme = formData.get('textTheme');
    
    let layout;
    try {
        layout = JSON.parse(formData.get('layout'));
        if (!layout.global) layout.global = {};
        layout.global.textColor = (textTheme === 'light') ? '#FFFFFF' : '#000000';
        if (!layout.global.textAlign) layout.global.textAlign = 'center';
    } catch (err) {
        alert('Invalid JSON in Layout field. Please check syntax.');
        if (btn) { btn.disabled = false; btn.innerText = originalText; }
        return;
    }

    const payload = { name, backgroundUrl, layout, isDefault };

    try {
        let url = `${API_BASE}/templates`;
        let method = 'POST';

        if (currentEditingTemplateId) {
            url = `${API_BASE}/templates/${currentEditingTemplateId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();

        if (data.success) {
            alert(currentEditingTemplateId ? 'Template Updated!' : 'Template Created!');
            // closeTemplateModal is now safe
            closeTemplateModal(); 
            loadTemplatesGallery();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('System Error: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            // Only reset text if we didn't success (because success closes modal)
            if (btn.innerText === 'Saving...') btn.innerText = originalText;
        }
    }
}

// --- DELETE: Template ---
window.deleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
        const res = await fetch(`${API_BASE}/templates/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            alert('Template deleted successfully.');
            loadTemplatesGallery();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
};

// ==============================================
// 7. Stats & Utils
// ==============================================
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`, { credentials: 'include' });
        const data = await res.json();

        if (data.success) {
            if(document.getElementById('statTotalIssued')) {
                document.getElementById('statTotalIssued').textContent = data.data.totalIssued || 0;
            }
            if(document.getElementById('statTotalTemplates')) {
                document.getElementById('statTotalTemplates').textContent = data.data.totalTemplates || 0;
            }
            if(document.getElementById('statPending')) {
                document.getElementById('statPending').textContent = data.data.pendingReview || 0;
            }
        }
    } catch (err) {
        console.error("Failed to load stats:", err);
    }
}

// Global Cert Delete
window.deleteCertificate = async (id) => {
    if (!confirm('Are you sure you want to delete this certificate? This cannot be undone.')) return;

    try {
        const res = await fetch(`${API_BASE}/certificates/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            alert('Certificate deleted successfully.');
            loadCertificates(); 
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
};

// Global Cert Edit Modal
window.openEditModal = (id, name, course) => {
    if(!document.getElementById('editCertId')) return;
    document.getElementById('editCertId').value = id;
    document.getElementById('editRecipientName').value = name;
    document.getElementById('editCourseTitle').value = course;
    document.getElementById('editCertificateModal').classList.remove('hidden');
};

window.closeEditModal = () => {
    document.getElementById('editCertificateModal').classList.add('hidden');
};

// --- Update Cert ---
async function handleUpdateCertificate(e) {
    e.preventDefault();
    const id = document.getElementById('editCertId').value;
    const recipientName = document.getElementById('editRecipientName').value;
    const courseTitle = document.getElementById('editCourseTitle').value;
    const btn = e.target.querySelector('button[type="submit"]');
    
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Saving...';

    try {
        const res = await fetch(`${API_BASE}/certificates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientName, courseTitle }),
            credentials: 'include'
        });
        
        const data = await res.json();

        if (data.success) {
            alert('Certificate updated successfully!');
            closeEditModal();
            loadCertificates(); 
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('Update failed: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}