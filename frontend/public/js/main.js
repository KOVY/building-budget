// Main JavaScript file for Building Budget application

// Global state
const state = {
  user: null,
  token: null,
  currentSection: 'login-section',
  projects: [],
  currentProject: null,
  currentBudget: null,
  subscription: null
};

// API URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const app = document.getElementById('app');
const sections = document.querySelectorAll('.content-section, .auth-section');
const navMenu = document.getElementById('nav-menu');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const notificationContainer = document.getElementById('notification-container');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in (token in localStorage)
  const token = localStorage.getItem('token');
  if (token) {
    state.token = token;
    getUserProfile();
  } else {
    showSection('login-section');
  }

  // Setup event listeners
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Auth forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('show-register-link').addEventListener('click', () => showSection('register-section'));
  document.getElementById('show-login-link').addEventListener('click', () => showSection('login-section'));

  // Navigation
  document.getElementById('projects-link').addEventListener('click', () => {
    loadProjects();
    showSection('projects-section');
  });
  document.getElementById('subscription-link').addEventListener('click', () => {
    loadSubscription();
    showSection('subscription-section');
  });
  document.getElementById('profile-link').addEventListener('click', () => {
    loadProfile();
    showSection('profile-section');
  });
  document.getElementById('logout-link').addEventListener('click', handleLogout);

  // Mobile menu toggle
  mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Project actions
  document.getElementById('new-project-btn').addEventListener('click', () => {
    document.getElementById('project-form-title').textContent = 'Nový projekt';
    document.getElementById('project-form').reset();
    showSection('project-form-section');
  });

  document.getElementById('project-form').addEventListener('submit', handleProjectSubmit);
  document.getElementById('cancel-project-btn').addEventListener('click', () => {
    showSection('projects-section');
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection('projects-section');
    });
  });

  document.querySelectorAll('.back-to-project-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection('project-detail-section');
    });
  });

  // File upload
  document.getElementById('file-upload-form').addEventListener('submit', handleFileUpload);
  setupFileDropArea();

  // Budget actions
  document.getElementById('generate-budget-btn').addEventListener('click', handleGenerateBudget);
  document.getElementById('export-pdf-btn').addEventListener('click', handleExportPdf);
  document.getElementById('export-excel-btn').addEventListener('click', handleExportExcel);

  // Subscription actions
  document.querySelector('.activate-trial-btn').addEventListener('click', handleActivateTrial);
  document.querySelectorAll('.activate-subscription-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.dataset.type;
      handleActivateSubscription(type);
    });
  });

  // Modal close
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// Authentication functions
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Přihlášení se nezdařilo');
    }
    
    // Save token and user data
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    
    // Show projects section
    loadProjects();
    showSection('projects-section');
    showNotification('success', 'Přihlášení úspěšné', 'Byli jste úspěšně přihlášeni');
  } catch (error) {
    showNotification('error', 'Chyba přihlášení', error.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const passwordConfirm = document.getElementById('register-password-confirm').value;
  
  // Validate passwords match
  if (password !== passwordConfirm) {
    showNotification('error', 'Chyba registrace', 'Hesla se neshodují');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registrace se nezdařila');
    }
    
    // Save token and user data
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    
    // Show projects section
    loadProjects();
    showSection('projects-section');
    showNotification('success', 'Registrace úspěšná', 'Váš účet byl úspěšně vytvořen');
  } catch (error) {
    showNotification('error', 'Chyba registrace', error.message);
  }
}

function handleLogout() {
  // Clear state and localStorage
  state.token = null;
  state.user = null;
  state.projects = [];
  state.currentProject = null;
  state.currentBudget = null;
  state.subscription = null;
  localStorage.removeItem('token');
  
  // Show login section
  showSection('login-section');
  showNotification('success', 'Odhlášení úspěšné', 'Byli jste úspěšně odhlášeni');
}

async function getUserProfile() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst profil uživatele');
    }
    
    state.user = data;
    
    // Load projects and show projects section
    loadProjects();
    showSection('projects-section');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // If token is invalid, clear it and show login
    localStorage.removeItem('token');
    state.token = null;
    showSection('login-section');
  }
}

// Project functions
async function loadProjects() {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst projekty');
    }
    
    state.projects = data;
    renderProjects();
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

function renderProjects() {
  const projectsContainer = document.querySelector('.projects-container');
  const emptyState = document.querySelector('.empty-state');
  
  // Clear container
  projectsContainer.innerHTML = '';
  
  if (state.projects.length === 0) {
    projectsContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  projectsContainer.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  // Render each project
  state.projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.innerHTML = `
      <div class="project-card-header">
        <h3>${project.name}</h3>
      </div>
      <div class="project-card-body">
        <div class="project-card-info">
          <p><span>Lokalita:</span> <span>${project.location || '-'}</span></p>
          <p><span>Typ budovy:</span> <span>${getBuildingTypeText(project.building_type)}</span></p>
          <p><span>Plocha:</span> <span>${project.total_area} m²</span></p>
          <p><span>Komplexnost:</span> <span>${project.complexity}/10</span></p>
          <p><span>Stav:</span> <span>${getStatusText(project.status)}</span></p>
        </div>
      </div>
      <div class="project-card-footer">
        <span class="date">Vytvořeno: ${formatDate(project.created_at)}</span>
        <button class="btn btn-primary view-project-btn" data-id="${project.id}">Zobrazit</button>
      </div>
    `;
    
    projectsContainer.appendChild(projectCard);
    
    // Add event listener to view button
    projectCard.querySelector('.view-project-btn').addEventListener('click', () => {
      loadProjectDetail(project.id);
    });
  });
}

async function loadProjectDetail(projectId) {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst detail projektu');
    }
    
    state.currentProject = data;
    renderProjectDetail();
    loadProjectFiles(projectId);
    loadProjectBudgets(projectId);
    showSection('project-detail-section');
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

function renderProjectDetail() {
  const project = state.currentProject;
  
  // Update project info
  document.getElementById('project-name').textContent = project.name;
  document.getElementById('project-location').textContent = project.location || '-';
  document.getElementById('project-building-type').textContent = getBuildingTypeText(project.building_type);
  document.getElementById('project-area').textContent = project.total_area;
  document.getElementById('project-complexity').textContent = `${project.complexity}/10`;
  document.getElementById('project-status').textContent = getStatusText(project.status);
  
  // Setup edit button
  document.getElementById('edit-project-btn').addEventListener('click', () => {
    setupProjectForm(project);
    showSection('project-form-section');
  });
  
  // Setup delete button
  document.getElementById('delete-project-btn').addEventListener('click', () => {
    showConfirmationModal('Smazat projekt', 
      `Opravdu chcete smazat projekt "${project.name}"? Tato akce je nevratná a smaže všechny soubory a rozpočty projektu.`,
      () => deleteProject(project.id)
    );
  });
}

async function loadProjectFiles(projectId) {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/files`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst soubory projektu');
    }
    
    renderProjectFiles(data);
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

function renderProjectFiles(files) {
  const filesList = document.querySelector('.files-list');
  const emptyFiles = document.querySelector('.empty-files');
  
  // Clear container
  filesList.innerHTML = '';
  
  if (files.length === 0) {
    filesList.classList.add('hidden');
    emptyFiles.classList.remove('hidden');
    return;
  }
  
  filesList.classList.remove('hidden');
  emptyFiles.classList.add('hidden');
  
  // Render each file
  files.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    // Determine icon based on file type
    let iconClass = 'fas fa-file';
    if (file.file_type === 'pdf') iconClass = 'fas fa-file-pdf';
    else if (file.file_type === 'dwg') iconClass = 'fas fa-drafting-compass';
    else if (file.file_type === 'ifc') iconClass = 'fas fa-cube';
    
    fileItem.innerHTML = `
      <div class="file-icon ${file.file_type}">
        <i class="${iconClass}"></i>
      </div>
      <div class="file-details">
        <div class="file-name">${file.original_name}</div>
        <div class="file-meta">
          <span>${formatFileSize(file.file_size)}</span>
          <span>${file.file_type.toUpperCase()}</span>
          <span>Stav: ${getFileStatusText(file.status)}</span>
        </div>
      </div>
      <div class="file-actions">
        <button class="download-file" title="Stáhnout soubor" data-id="${file.id}">
          <i class="fas fa-download"></i>
        </button>
        <button class="view-data" title="Zobrazit extrahovaná data" data-id="${file.id}">
          <i class="fas fa-table"></i>
        </button>
        <button class="delete delete-file" title="Smazat soubor" data-id="${file.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    filesList.appendChild(fileItem);
    
    // Add event listeners
    fileItem.querySelector('.download-file').addEventListener('click', () => {
      downloadFile(file.id);
    });
    
    fileItem.querySelector('.view-data').addEventListener('click', () => {
      viewFileData(file.id);
    });
    
    fileItem.querySelector('.delete-file').addEventListener('click', () => {
      showConfirmationModal('Smazat soubor', 
        `Opravdu chcete smazat soubor "${file.original_name}"?`,
        () => deleteFile(file.id)
      );
    });
  });
}

async function loadProjectBudgets(projectId) {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/budgets`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst rozpočty projektu');
    }
    
    renderProjectBudgets(data);
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

function renderProjectBudgets(budgets) {
  const budgetsList = document.querySelector('.budgets-list');
  const emptyBudgets = document.querySelector('.empty-budgets');
  
  // Clear container
  budgetsList.innerHTML = '';
  
  if (budgets.length === 0) {
    budgetsList.classList.add('hidden');
    emptyBudgets.classList.remove('hidden');
    return;
  }
  
  budgetsList.classList.remove('hidden');
  emptyBudgets.classList.add('hidden');
  
  // Create budgets table
  const table = document.createElement('table');
  table.className = 'budget-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Název rozpočtu</th>
        <th>Vytvořeno</th>
        <th>Stav</th>
        <th>Celková cena</th>
        <th>Akce</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  `;
  
  const tbody = table.querySelector('tbody');
  
  // Render each budget
  budgets.forEach(budget => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${budget.name}</td>
      <td>${formatDate(budget.created_at)}</td>
      <td>${getBudgetStatusText(budget.status)}</td>
      <td>${formatPrice(budget.total_price_with_vat)} Kč</td>
      <td>
        <button class="btn btn-primary view-budget-btn" data-id="${budget.id}">
          <i class="fas fa-eye"></i> Zobrazit
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listener
    row.querySelector('.view-budget-btn').addEventListener('click', () => {
      loadBudgetDetail(budget.id);
    });
  });
  
  budgetsList.appendChild(table);
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('project-form-name').value;
  const description = document.getElementById('project-form-description').value;
  const location = document.getElementById('project-form-location').value;
  const buildingType = document.getElementById('project-form-building-type').value;
  const area = document.getElementById('project-form-area').value;
  
  const projectData = {
    name,
    description,
    location,
    building_type: buildingType,
    total_area: area
  };
  
  try {
    let url = `${API_URL}/projects`;
    let method = 'POST';
    
    // If editing existing project
    if (state.currentProject && document.getElementById('project-form-title').textContent === 'Upravit projekt') {
      url = `${API_URL}/projects/${state.currentProject.id}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(projectData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se uložit projekt');
    }
    
    // Reload projects and show projects section
    await loadProjects();
    showSection('projects-section');
    showNotification('success', 'Projekt uložen', 'Projekt byl úspěšně uložen');
  } catch (error) {
    showNotification('error', 'Chyba ukládání', error.message);
  }
}

function setupProjectForm(project = null) {
  const form = document.getElementById('project-form');
  const title = document.getElementById('project-form-title');
  
  if (project) {
    // Edit mode
    title.textContent = 'Upravit projekt';
    document.getElementById('project-form-name').value = project.name;
    document.getElementById('project-form-description').value = project.description || '';
    document.getElementById('project-form-location').value = project.location || '';
    document.getElementById('project-form-building-type').value = project.building_type;
    document.getElementById('project-form-area').value = project.total_area;
  } else {
    // Create mode
    title.textContent = 'Nový projekt';
    form.reset();
  }
}

async function deleteProject(projectId) {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se smazat projekt');
    }
    
    // Reload projects and show projects section
    await loadProjects();
    showSection('projects-section');
    showNotification('success', 'Projekt smazán', 'Projekt byl úspěšně smazán');
  } catch (error) {
    showNotification('error', 'Chyba mazání', error.message);
  }
}

// File functions
function setupFileDropArea() {
  const dropArea = document.querySelector('.file-drop-area');
  const fileInput = document.querySelector('.file-input');
  
  // Highlight drop area when dragging file over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.add('active');
    });
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.remove('active');
    });
  });
  
  // Handle file drop
  dropArea.addEventListener('drop', (e) => {
    fileInput.files = e.dataTransfer.files;
    updateFileMessage(fileInput.files);
  });
  
  // Handle file selection
  dropArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', () => {
    updateFileMessage(fileInput.files);
  });
}

function updateFileMessage(files) {
  const fileMsg = document.querySelector('.file-msg');
  
  if (files.length > 0) {
    if (files.length === 1) {
      fileMsg.textContent = `Vybrán soubor: ${files[0].name}`;
    } else {
      fileMsg.textContent = `Vybráno ${files.length} souborů`;
    }
  } else {
    fileMsg.textContent = 'Přetáhněte soubory sem nebo klikněte pro výběr';
  }
}

async function handleFileUpload(e) {
  e.preventDefault();
  
  const fileInput = document.querySelector('.file-input');
  
  if (fileInput.files.length === 0) {
    showNotification('warning', 'Žádné soubory', 'Vyberte alespoň jeden soubor pro nahrání');
    return;
  }
  
  // Check file types
  for (let i = 0; i < fileInput.files.length; i++) {
    const file = fileInput.files[i];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!['pdf', 'dwg', 'ifc'].includes(extension)) {
      showNotification('error', 'Nepodporovaný formát', `Soubor ${file.name} má nepodporovaný formát. Povolené formáty jsou PDF, DWG a IFC.`);
      return;
    }
  }
  
  // Create FormData
  const formData = new FormData();
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('files', fileInput.files[i]);
  }
  
  try {
    const response = await fetch(`${API_URL}/projects/${state.currentProject.id}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se nahrát soubory');
    }
    
    // Reset form and reload files
    document.getElementById('file-upload-form').reset();
    document.querySelector('.file-msg').textContent = 'Přetáhněte soubory sem nebo klikněte pro výběr';
    
    await loadProjectFiles(state.currentProject.id);
    showNotification('success', 'Soubory nahrány', `${data.files.length} souborů bylo úspěšně nahráno`);
  } catch (error) {
    showNotification('error', 'Chyba nahrávání', error.message);
  }
}

async function downloadFile(fileId) {
  try {
    // Create a hidden anchor element
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = `${API_URL}/files/${fileId}/download`;
    a.download = '';
    
    // Add authorization header via fetch and blob
    const response = await fetch(`${API_URL}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Nepodařilo se stáhnout soubor');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        a.download = filenameMatch[1];
      }
    }
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    showNotification('error', 'Chyba stahování', error.message);
  }
}

async function viewFileData(fileId) {
  try {
    const response = await fetch(`${API_URL}/files/${fileId}/extracted-data`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst extrahovaná data');
    }
    
    // Group data by type
    const groupedData = {};
    data.forEach(item => {
      if (!groupedData[item.data_type]) {
        groupedData[item.data_type] = [];
      }
      groupedData[item.data_type].push(item);
    });
    
    // Create modal content
    let modalHtml = '';
    
    if (data.length === 0) {
      modalHtml = '<p>Pro tento soubor nejsou k dispozici žádná extrahovaná data.</p>';
    } else {
      // Create a table for each data type
      for (const type in groupedData) {
        modalHtml += `
          <h4>${capitalizeFirstLetter(type)}</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Klíč</th>
                <th>Hodnota</th>
                <th>Důvěryhodnost</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        groupedData[type].forEach(item => {
          modalHtml += `
            <tr>
              <td>${item.data_key}</td>
              <td>${item.data_value}</td>
              <td>${Math.round(item.confidence * 100)}%</td>
            </tr>
          `;
        });
        
        modalHtml += `
            </tbody>
          </table>
        `;
      }
    }
    
    // Show modal with data
    showModal('Extrahovaná data', modalHtml);
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

async function deleteFile(fileId) {
  try {
    const response = await fetch(`${API_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se smazat soubor');
    }
    
    // Reload files
    await loadProjectFiles(state.currentProject.id);
    showNotification('success', 'Soubor smazán', 'Soubor byl úspěšně smazán');
  } catch (error) {
    showNotification('error', 'Chyba mazání', error.message);
  }
}

// Budget functions
async function handleGenerateBudget() {
  try {
    const response = await fetch(`${API_URL}/projects/${state.currentProject.id}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        name: `Rozpočet projektu ${state.currentProject.name}`,
        description: 'Automaticky generovaný rozpočet'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se vygenerovat rozpočet');
    }
    
    // Reload budgets
    await loadProjectBudgets(state.currentProject.id);
    showNotification('success', 'Rozpočet vygenerován', 'Rozpočet byl úspěšně vygenerován');
  } catch (error) {
    showNotification('error', 'Chyba generování', error.message);
  }
}

async function loadBudgetDetail(budgetId) {
  try {
    // Load budget details
    const budgetResponse = await fetch(`${API_URL}/budgets/${budgetId}`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const budgetData = await budgetResponse.json();
    
    if (!budgetResponse.ok) {
      throw new Error(budgetData.message || 'Nepodařilo se načíst detail rozpočtu');
    }
    
    // Load budget items
    const itemsResponse = await fetch(`${API_URL}/budgets/${budgetId}/items`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const itemsData = await itemsResponse.json();
    
    if (!itemsResponse.ok) {
      throw new Error(itemsData.message || 'Nepodařilo se načíst položky rozpočtu');
    }
    
    state.currentBudget = budgetData;
    renderBudgetDetail(budgetData, itemsData);
    showSection('budget-detail-section');
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

function renderBudgetDetail(budget, items) {
  // Update budget info
  document.getElementById('budget-name').textContent = budget.name;
  document.getElementById('budget-project-name').textContent = state.currentProject.name;
  document.getElementById('budget-created-at').textContent = formatDate(budget.created_at);
  document.getElementById('budget-status').textContent = getBudgetStatusText(budget.status);
  
  // Update budget totals
  document.getElementById('budget-total').textContent = formatPrice(budget.total_price) + ' Kč';
  document.getElementById('budget-vat-rate').textContent = budget.vat_rate;
  document.getElementById('budget-vat').textContent = formatPrice(budget.total_price_with_vat - budget.total_price) + ' Kč';
  document.getElementById('budget-total-with-vat').textContent = formatPrice(budget.total_price_with_vat) + ' Kč';
  
  // Render budget items
  const tbody = document.getElementById('budget-items-tbody');
  const emptyItems = document.querySelector('.empty-budget-items');
  
  // Clear container
  tbody.innerHTML = '';
  
  if (items.length === 0) {
    tbody.parentElement.parentElement.classList.add('hidden');
    emptyItems.classList.remove('hidden');
    return;
  }
  
  tbody.parentElement.parentElement.classList.remove('hidden');
  emptyItems.classList.add('hidden');
  
  // Group items by category
  const groupedItems = {};
  items.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });
  
  // Render each category and its items
  for (const category in groupedItems) {
    // Add category row
    const categoryRow = document.createElement('tr');
    categoryRow.className = 'category-row';
    categoryRow.innerHTML = `
      <td colspan="5"><strong>${category}</strong></td>
    `;
    tbody.appendChild(categoryRow);
    
    // Add items
    groupedItems[category].forEach(item => {
      const itemRow = document.createElement('tr');
      itemRow.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>${formatPrice(item.unit_price)} Kč</td>
        <td>${formatPrice(item.total_price)} Kč</td>
      `;
      tbody.appendChild(itemRow);
    });
  }
  
  // Setup export buttons
  document.getElementById('export-pdf-btn').onclick = () => handleExportPdf(budget.id);
  document.getElementById('export-excel-btn').onclick = () => handleExportExcel(budget.id);
}

function handleExportPdf(budgetId) {
  // Create a hidden anchor element
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = `${API_URL}/budgets/${budgetId}/export/pdf`;
  a.download = '';
  
  // Add authorization token to URL
  a.href += `?token=${state.token}`;
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
}

function handleExportExcel(budgetId) {
  // Create a hidden anchor element
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = `${API_URL}/budgets/${budgetId}/export/excel`;
  a.download = '';
  
  // Add authorization token to URL
  a.href += `?token=${state.token}`;
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
}

// Subscription functions
async function loadSubscription() {
  try {
    const response = await fetch(`${API_URL}/subscription/status`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se načíst informace o předplatném');
    }
    
    state.subscription = data;
    renderSubscription();
  } catch (error) {
    showNotification('error', 'Chyba načítání', error.message);
  }
}

function renderSubscription() {
  const subscription = state.subscription;
  
  // Update subscription info
  document.getElementById('subscription-type').textContent = getSubscriptionTypeText(subscription.subscription.type);
  document.getElementById('subscription-expires').textContent = formatDate(subscription.subscription.expires_at);
  document.getElementById('subscription-days-remaining').textContent = subscription.subscription.days_remaining;
  document.getElementById('subscription-status').textContent = subscription.subscription.is_active ? 'Aktivní' : 'Neaktivní';
  
  // Update limits
  document.getElementById('subscription-max-projects').textContent = subscription.limits.max_projects === -1 ? 'Neomezeno' : subscription.limits.max_projects;
  document.getElementById('subscription-max-files').textContent = subscription.limits.max_files_per_project === -1 ? 'Neomezeno' : subscription.limits.max_files_per_project;
  document.getElementById('subscription-max-complexity').textContent = subscription.limits.max_complexity;
  document.getElementById('subscription-pdf-export').textContent = subscription.limits.export_pdf_preview ? 'Ano' : 'Ne';
  document.getElementById('subscription-excel-export').textContent = subscription.limits.export_excel ? 'Ano' : 'Ne';
  
  // Update buttons based on current subscription
  const trialBtn = document.querySelector('.activate-trial-btn');
  const subscriptionBtns = document.querySelectorAll('.activate-subscription-btn');
  
  if (subscription.subscription.type !== 'trial' && subscription.subscription.is_active) {
    trialBtn.disabled = true;
    trialBtn.textContent = 'Již máte aktivní předplatné';
  } else {
    trialBtn.disabled = false;
    trialBtn.textContent = 'Aktivovat zkušební verzi';
  }
  
  subscriptionBtns.forEach(btn => {
    if (btn.dataset.type === subscription.subscription.type && subscription.subscription.is_active) {
      btn.disabled = true;
      btn.textContent = 'Aktuálně aktivní';
    } else {
      btn.disabled = false;
      btn.textContent = 'Aktivovat předplatné';
    }
  });
}

async function handleActivateTrial() {
  try {
    const response = await fetch(`${API_URL}/subscription/activate-trial`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se aktivovat zkušební verzi');
    }
    
    // Reload subscription
    await loadSubscription();
    showNotification('success', 'Zkušební verze aktivována', 'Zkušební verze byla úspěšně aktivována');
  } catch (error) {
    showNotification('error', 'Chyba aktivace', error.message);
  }
}

async function handleActivateSubscription(type) {
  // Show payment modal
  showPaymentModal(type, async (paymentData) => {
    try {
      const response = await fetch(`${API_URL}/subscription/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          subscription_type: type,
          payment_method: paymentData.method,
          payment_details: paymentData.details
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Nepodařilo se aktivovat předplatné');
      }
      
      // Reload subscription
      await loadSubscription();
      showNotification('success', 'Předplatné aktivováno', 'Předplatné bylo úspěšně aktivováno');
    } catch (error) {
      showNotification('error', 'Chyba aktivace', error.message);
    }
  });
}

// Profile functions
async function loadProfile() {
  // User data is already in state.user
  renderProfile();
}

function renderProfile() {
  document.getElementById('profile-username').textContent = state.user.username;
  document.getElementById('profile-email').textContent = state.user.email;
  document.getElementById('profile-created-at').textContent = formatDate(state.user.created_at);
  
  // Setup change password button
  document.getElementById('change-password-btn').addEventListener('click', showChangePasswordModal);
}

function showChangePasswordModal() {
  const modalContent = `
    <form id="change-password-form">
      <div class="form-group">
        <label for="current-password">Současné heslo</label>
        <input type="password" id="current-password" required>
      </div>
      <div class="form-group">
        <label for="new-password">Nové heslo</label>
        <input type="password" id="new-password" required>
      </div>
      <div class="form-group">
        <label for="confirm-password">Potvrzení nového hesla</label>
        <input type="password" id="confirm-password" required>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Zrušit</button>
        <button type="submit" class="btn btn-primary">Změnit heslo</button>
      </div>
    </form>
  `;
  
  showModal('Změna hesla', modalContent);
  
  // Add event listener to form
  document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
}

async function handleChangePassword(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    showNotification('error', 'Chyba', 'Nová hesla se neshodují');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Nepodařilo se změnit heslo');
    }
    
    closeModal();
    showNotification('success', 'Heslo změněno', 'Vaše heslo bylo úspěšně změněno');
  } catch (error) {
    showNotification('error', 'Chyba změny hesla', error.message);
  }
}

// UI functions
function showSection(sectionId) {
  // Hide all sections
  sections.forEach(section => {
    section.classList.add('hidden');
  });
  
  // Show selected section
  document.getElementById(sectionId).classList.remove('hidden');
  
  // Update active nav link
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // Set active nav link based on section
  if (sectionId === 'projects-section' || sectionId === 'project-detail-section' || sectionId === 'project-form-section') {
    document.getElementById('projects-link').classList.add('active');
  } else if (sectionId === 'subscription-section') {
    document.getElementById('subscription-link').classList.add('active');
  } else if (sectionId === 'profile-section') {
    document.getElementById('profile-link').classList.add('active');
  }
  
  // Update current section in state
  state.currentSection = sectionId;
  
  // Close mobile menu if open
  navMenu.classList.remove('active');
  
  // Scroll to top
  window.scrollTo(0, 0);
}

function showNotification(type, title, message) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  notificationContainer.appendChild(notification);
  
  // Add event listener to close button
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function showModal(title, content) {
  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

function showConfirmationModal(title, message, onConfirm) {
  const modalContent = `
    <p>${message}</p>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Zrušit</button>
      <button type="button" class="btn btn-danger" id="confirm-btn">Potvrdit</button>
    </div>
  `;
  
  showModal(title, modalContent);
  
  // Add event listener to confirm button
  document.getElementById('confirm-btn').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function showPaymentModal(subscriptionType, onComplete) {
  let price = 0;
  if (subscriptionType === 'basic') price = 1000;
  if (subscriptionType === 'professional') price = 3000;
  if (subscriptionType === 'enterprise') price = 8000;
  
  const modalContent = `
    <p>Aktivace předplatného: <strong>${getSubscriptionTypeText(subscriptionType)}</strong></p>
    <p>Cena: <strong>${price} Kč / měsíc</strong></p>
    
    <form id="payment-form">
      <div class="form-group">
        <label for="payment-method">Platební metoda</label>
        <select id="payment-method" required>
          <option value="credit_card">Platební karta</option>
          <option value="bank_transfer">Bankovní převod</option>
        </select>
      </div>
      
      <div id="credit-card-fields">
        <div class="form-group">
          <label for="card-number">Číslo karty</label>
          <input type="text" id="card-number" placeholder="1234 5678 9012 3456" required>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="card-expiry">Platnost (MM/RR)</label>
            <input type="text" id="card-expiry" placeholder="MM/RR" required>
          </div>
          
          <div class="form-group">
            <label for="card-cvc">CVC</label>
            <input type="text" id="card-cvc" placeholder="123" required>
          </div>
        </div>
      </div>
      
      <div id="bank-transfer-fields" style="display: none;">
        <div class="form-group">
          <p>Pro aktivaci předplatného proveďte platbu na následující účet:</p>
          <p><strong>Číslo účtu:</strong> 123456789/0100</p>
          <p><strong>Variabilní symbol:</strong> ${Math.floor(Math.random() * 1000000)}</p>
          <p><strong>Částka:</strong> ${price} Kč</p>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Zrušit</button>
        <button type="submit" class="btn btn-primary">Zaplatit</button>
      </div>
    </form>
  `;
  
  showModal('Platba předplatného', modalContent);
  
  // Toggle payment method fields
  const paymentMethod = document.getElementById('payment-method');
  const creditCardFields = document.getElementById('credit-card-fields');
  const bankTransferFields = document.getElementById('bank-transfer-fields');
  
  paymentMethod.addEventListener('change', () => {
    if (paymentMethod.value === 'credit_card') {
      creditCardFields.style.display = 'block';
      bankTransferFields.style.display = 'none';
    } else {
      creditCardFields.style.display = 'none';
      bankTransferFields.style.display = 'block';
    }
  });
  
  // Add event listener to form
  document.getElementById('payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const method = paymentMethod.value;
    let details = {};
    
    if (method === 'credit_card') {
      details = {
        card_number: document.getElementById('card-number').value,
        card_expiry: document.getElementById('card-expiry').value,
        card_cvc: document.getElementById('card-cvc').value
      };
    } else {
      details = {
        account_number: '123456789/0100',
        variable_symbol: Math.floor(Math.random() * 1000000).toString()
      };
    }
    
    closeModal();
    onComplete({ method, details });
  });
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPrice(price) {
  return new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

function getBuildingTypeText(type) {
  const types = {
    'residential': 'Obytná budova',
    'commercial': 'Komerční budova',
    'industrial': 'Průmyslová budova',
    'other': 'Jiný typ budovy'
  };
  
  return types[type] || 'Neuvedeno';
}

function getStatusText(status) {
  const statuses = {
    'draft': 'Rozpracovaný',
    'in_progress': 'V procesu',
    'completed': 'Dokončený'
  };
  
  return statuses[status] || 'Neuvedeno';
}

function getFileStatusText(status) {
  const statuses = {
    'uploaded': 'Nahraný',
    'processing': 'Zpracovává se',
    'processed': 'Zpracovaný',
    'error': 'Chyba'
  };
  
  return statuses[status] || 'Neuvedeno';
}

function getBudgetStatusText(status) {
  const statuses = {
    'draft': 'Návrh',
    'final': 'Finální'
  };
  
  return statuses[status] || 'Neuvedeno';
}

function getSubscriptionTypeText(type) {
  const types = {
    'trial': 'Zkušební verze',
    'basic': 'Základní',
    'professional': 'Profesionální',
    'enterprise': 'Podnikové'
  };
  
  return types[type] || 'Neuvedeno';
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
