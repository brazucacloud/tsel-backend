// TSEL Frontend - Sistema de Chip Warmup para WhatsApp
// Configurações da API
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`;

// Estado global da aplicação
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');
let devicesChart = null;
let tasksChart = null;
let selectedDeviceId = null;
let dailyTasksData = {};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Função de inicialização
function initializeApp() {
    // Configurar formulário de login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Verificar se já está logado
    if (authToken) {
        showMainApp();
        loadDashboard();
    } else {
        showLoginScreen();
    }
}

// ===== AUTENTICAÇÃO =====

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.tokens.access_token;
            refreshToken = data.data.tokens.refresh_token;
            currentUser = data.data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showMainApp();
            loadDashboard();
            showAlert('Login realizado com sucesso!', 'success');
        } else {
            showAlert(data.message || 'Erro no login', 'danger');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('Erro de conexão. Verifique se o backend está rodando.', 'danger');
    } finally {
        hideLoading();
    }
}

function logout() {
    authToken = null;
    refreshToken = null;
    currentUser = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    showLoginScreen();
    showAlert('Logout realizado com sucesso!', 'info');
}

// ===== NAVEGAÇÃO =====

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Atualizar nome do usuário
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.full_name || currentUser.username;
    }
}

function showDashboard() {
    hideAllContent();
    document.getElementById('dashboardContent').style.display = 'block';
    updateActiveNav('dashboard');
    loadDashboard();
}

function showDailyTasks() {
    hideAllContent();
    document.getElementById('dailyTasksContent').style.display = 'block';
    updateActiveNav('daily-tasks');
    loadDailyTasks();
}

function showDevices() {
    hideAllContent();
    document.getElementById('devicesContent').style.display = 'block';
    updateActiveNav('devices');
    loadDevices();
}

function showTasks() {
    hideAllContent();
    document.getElementById('tasksContent').style.display = 'block';
    updateActiveNav('tasks');
    loadTasks();
}

function showContent() {
    hideAllContent();
    document.getElementById('contentContent').style.display = 'block';
    updateActiveNav('content');
    loadContent();
}

function showAnalytics() {
    hideAllContent();
    document.getElementById('analyticsContent').style.display = 'block';
    updateActiveNav('analytics');
    loadAnalytics();
}

function showUsers() {
    hideAllContent();
    document.getElementById('usersContent').style.display = 'block';
    updateActiveNav('users');
    loadUsers();
}

function showSettings() {
    hideAllContent();
    document.getElementById('settingsContent').style.display = 'block';
    updateActiveNav('settings');
    loadSettings();
}

function hideAllContent() {
    const contents = [
        'dashboardContent',
        'dailyTasksContent',
        'devicesContent',
        'tasksContent',
        'contentContent',
        'analyticsContent',
        'usersContent',
        'settingsContent'
    ];
    
    contents.forEach(contentId => {
        document.getElementById(contentId).style.display = 'none';
    });
}

function updateActiveNav(activeSection) {
    // Remover classe active de todos os links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adicionar classe active ao link correto
    const activeLink = document.querySelector(`[onclick="show${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}()"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// ===== DASHBOARD =====

async function loadDashboard() {
    try {
        showLoading();
        const [dashboardData, devicesData, tasksData] = await Promise.all([
            apiCall('/api/analytics/dashboard'),
            apiCall('/api/devices?limit=5'),
            apiCall('/api/tasks?limit=5')
        ]);
        
        updateDashboardStats(dashboardData);
        updateDashboardCharts(dashboardData);
        updateRecentDevices(devicesData.data || []);
        updateRecentTasks(tasksData.data || []);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showAlert('Erro ao carregar dados do dashboard', 'danger');
    } finally {
        hideLoading();
    }
}

function updateDashboardStats(data) {
    document.getElementById('totalDevices').textContent = data.total_devices || 0;
    document.getElementById('completedTasks').textContent = data.completed_tasks || 0;
    document.getElementById('pendingTasks').textContent = data.pending_tasks || 0;
    document.getElementById('warmupProgress').textContent = `${data.warmup_progress || 0}%`;
}

function updateDashboardCharts(data) {
    // Gráfico de dispositivos
    const devicesCtx = document.getElementById('devicesChart').getContext('2d');
    if (devicesChart) devicesChart.destroy();
    
    devicesChart = new Chart(devicesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Online', 'Offline', 'Manutenção'],
            datasets: [{
                data: [
                    data.online_devices || 0,
                    data.offline_devices || 0,
                    data.maintenance_devices || 0
                ],
                backgroundColor: ['#27ae60', '#e74c3c', '#f39c12']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Gráfico de tarefas
    const tasksCtx = document.getElementById('tasksChart').getContext('2d');
    if (tasksChart) tasksChart.destroy();
    
    tasksChart = new Chart(tasksCtx, {
        type: 'bar',
        data: {
            labels: ['Concluídas', 'Pendentes', 'Em Execução', 'Falharam'],
            datasets: [{
                label: 'Tarefas',
                data: [
                    data.completed_tasks || 0,
                    data.pending_tasks || 0,
                    data.running_tasks || 0,
                    data.failed_tasks || 0
                ],
                backgroundColor: ['#27ae60', '#f39c12', '#3498db', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateRecentDevices(devices) {
    const container = document.getElementById('recentDevices');
    
    if (devices.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum dispositivo encontrado</p>';
        return;
    }
    
    const html = devices.map(device => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${device.name}</strong>
                <br>
                <small class="text-muted">${device.model} - ${device.brand}</small>
            </div>
            <span class="badge ${device.is_online ? 'bg-success' : 'bg-secondary'}">
                ${device.is_online ? 'Online' : 'Offline'}
            </span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateRecentTasks(tasks) {
    const container = document.getElementById('recentTasks');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    const html = tasks.map(task => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${task.title}</strong>
                <br>
                <small class="text-muted">${getTaskTypeText(task.type)}</small>
            </div>
            <span class="badge ${getStatusBadgeClass(task.status)}">
                ${getStatusText(task.status)}
            </span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function refreshDashboard() {
    loadDashboard();
}

// ===== TAREFAS DE 21 DIAS =====

async function loadDailyTasks() {
    try {
        showLoading();
        
        // Carregar dispositivos para o seletor
        await loadDevicesForDailyTasks();
        
        // Se um dispositivo estiver selecionado, carregar suas tarefas
        if (selectedDeviceId) {
            await loadDeviceDailyTasks(selectedDeviceId);
        }
        
    } catch (error) {
        console.error('Erro ao carregar tarefas diárias:', error);
        showAlert('Erro ao carregar tarefas diárias', 'danger');
    } finally {
        hideLoading();
    }
}

async function loadDevicesForDailyTasks() {
    try {
        const response = await apiCall('/api/devices');
        const devices = response.data || [];
        
        const select = document.getElementById('deviceSelect');
        select.innerHTML = '<option value="">Selecione um dispositivo</option>';
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = `${device.name} (${device.device_id})`;
            select.appendChild(option);
        });
        
        // Adicionar evento de mudança
        select.addEventListener('change', function() {
            selectedDeviceId = this.value;
            if (selectedDeviceId) {
                loadDeviceDailyTasks(selectedDeviceId);
            } else {
                clearDailyTasksDisplay();
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar dispositivos:', error);
        showAlert('Erro ao carregar dispositivos', 'danger');
    }
}

async function loadDeviceDailyTasks(deviceId) {
    try {
        showLoading();
        
        // Carregar progresso geral
        const progressResponse = await apiCall(`/api/daily-tasks/progress/${deviceId}`);
        updateOverallProgress(progressResponse.data);
        
        // Carregar tarefas de cada dia
        const daysContainer = document.getElementById('daysContainer');
        daysContainer.innerHTML = '';
        
        for (let day = 1; day <= 21; day++) {
            try {
                const dayResponse = await apiCall(`/api/daily-tasks/device/${deviceId}/day/${day}`);
                const dayTasks = dayResponse.data || [];
                
                const dayCard = createDayCard(day, dayTasks, progressResponse.data.daily_progress);
                daysContainer.appendChild(dayCard);
                
            } catch (error) {
                console.error(`Erro ao carregar dia ${day}:`, error);
                const dayCard = createDayCard(day, [], []);
                daysContainer.appendChild(dayCard);
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar tarefas do dispositivo:', error);
        showAlert('Erro ao carregar tarefas do dispositivo', 'danger');
    } finally {
        hideLoading();
    }
}

function updateOverallProgress(progressData) {
    const container = document.getElementById('overallProgress');
    
    if (!progressData) {
        container.innerHTML = '<p class="text-muted">Nenhum progresso disponível</p>';
        return;
    }
    
    const overall = progressData.overall_stats || {};
    const totalTasks = overall.total_tasks || 0;
    const completedTasks = overall.completed_tasks || 0;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    container.innerHTML = `
        <div class="row align-items-center">
            <div class="col-md-8">
                <div class="progress mb-3" style="height: 25px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${percentage}%" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${percentage}%
                    </div>
                </div>
                <div class="row text-center">
                    <div class="col-4">
                        <h4 class="text-success">${completedTasks}</h4>
                        <small class="text-muted">Concluídas</small>
                    </div>
                    <div class="col-4">
                        <h4 class="text-warning">${overall.pending_tasks || 0}</h4>
                        <small class="text-muted">Pendentes</small>
                    </div>
                    <div class="col-4">
                        <h4 class="text-primary">${totalTasks}</h4>
                        <small class="text-muted">Total</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 text-center">
                <div class="progress-ring">
                    <svg width="120" height="120">
                        <circle class="bg" cx="60" cy="60" r="50"></circle>
                        <circle class="progress" cx="60" cy="60" r="50" 
                                stroke-dasharray="${2 * Math.PI * 50 * percentage / 100} ${2 * Math.PI * 50}"></circle>
                    </svg>
                </div>
                <h3 class="mt-2">${percentage}%</h3>
                <small class="text-muted">Progresso Geral</small>
            </div>
        </div>
    `;
}

function createDayCard(dayNumber, tasks, dailyProgress) {
    const dayProgress = dailyProgress.find(p => p.day_number === dayNumber) || {};
    const totalTasks = dayProgress.total_tasks || tasks.length;
    const completedTasks = dayProgress.completed_tasks || tasks.filter(t => t.status === 'completed').length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let statusClass = 'pending';
    if (percentage === 100) statusClass = 'completed';
    else if (percentage > 0) statusClass = 'in-progress';
    
    const card = document.createElement('div');
    card.className = `col-md-6 col-lg-4 mb-4`;
    card.innerHTML = `
        <div class="card day-card ${statusClass}" onclick="showDayTasks(${dayNumber})">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-title mb-0">Dia ${dayNumber}</h5>
                    <span class="badge ${statusClass === 'completed' ? 'bg-success' : statusClass === 'in-progress' ? 'bg-warning' : 'bg-secondary'}">
                        ${percentage}%
                    </span>
                </div>
                
                <div class="progress mb-3" style="height: 8px;">
                    <div class="progress-bar ${statusClass === 'completed' ? 'bg-success' : statusClass === 'in-progress' ? 'bg-warning' : 'bg-secondary'}" 
                         role="progressbar" 
                         style="width: ${percentage}%" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
                
                <div class="row text-center">
                    <div class="col-6">
                        <small class="text-muted">Concluídas</small>
                        <div class="fw-bold text-success">${completedTasks}</div>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Total</small>
                        <div class="fw-bold">${totalTasks}</div>
                    </div>
                </div>
                
                ${tasks.length > 0 ? `
                    <div class="mt-3">
                        <small class="text-muted">Próximas tarefas:</small>
                        <div class="mt-1">
                            ${tasks.slice(0, 2).map(task => `
                                <span class="category-badge category-${task.metadata?.category || 'default'} me-1">
                                    ${task.task_type}
                                </span>
                            `).join('')}
                            ${tasks.length > 2 ? `<small class="text-muted">+${tasks.length - 2} mais</small>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

function showDayTasks(dayNumber) {
    if (!selectedDeviceId) {
        showAlert('Selecione um dispositivo primeiro', 'warning');
        return;
    }
    
    // Carregar tarefas do dia específico
    loadDayTasks(selectedDeviceId, dayNumber);
}

async function loadDayTasks(deviceId, dayNumber) {
    try {
        showLoading();
        
        const response = await apiCall(`/api/daily-tasks/device/${deviceId}/day/${dayNumber}`);
        const tasks = response.data || [];
        
        displayDayTasksModal(dayNumber, tasks);
        
    } catch (error) {
        console.error('Erro ao carregar tarefas do dia:', error);
        showAlert('Erro ao carregar tarefas do dia', 'danger');
    } finally {
        hideLoading();
    }
}

function displayDayTasksModal(dayNumber, tasks) {
    const modal = new bootstrap.Modal(document.getElementById('taskModal'));
    const content = document.getElementById('taskModalContent');
    
    content.innerHTML = `
        <div class="mb-3">
            <h4>Tarefas do Dia ${dayNumber}</h4>
            <p class="text-muted">Gerencie as tarefas de warmup para este dia</p>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <strong>Total de Tarefas:</strong> ${tasks.length}
            </div>
            <div class="col-md-6">
                <strong>Concluídas:</strong> ${tasks.filter(t => t.status === 'completed').length}
            </div>
        </div>
        
        <div class="task-list">
            ${tasks.map(task => `
                <div class="task-item ${task.status === 'completed' ? 'completed' : 'pending'}" 
                     onclick="showTaskDetails(${task.id})">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <span class="category-badge category-${task.metadata?.category || 'default'} me-2">
                                    ${task.metadata?.category || 'geral'}
                                </span>
                                <span class="badge ${task.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                                    ${task.status === 'completed' ? 'Concluída' : 'Pendente'}
                                </span>
                            </div>
                            <h6 class="mb-1">${task.task_description}</h6>
                            ${task.metadata ? `
                                <small class="text-muted">
                                    ${Object.entries(task.metadata).map(([key, value]) => 
                                        key !== 'category' ? `${key}: ${value}` : ''
                                    ).filter(Boolean).join(' | ')}
                                </small>
                            ` : ''}
                        </div>
                        <div class="ms-3">
                            ${task.status === 'completed' ? 
                                `<i class="fas fa-check-circle text-success"></i>` : 
                                `<i class="fas fa-clock text-warning"></i>`
                            }
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Configurar botão de completar tarefa
    const completeBtn = document.getElementById('completeTaskBtn');
    completeBtn.onclick = () => completeSelectedTask();
    
    modal.show();
}

function showTaskDetails(taskId) {
    // Implementar visualização detalhada da tarefa
    showAlert(`Visualizando detalhes da tarefa ${taskId}`, 'info');
}

function completeSelectedTask() {
    // Implementar marcação de tarefa como concluída
    showAlert('Funcionalidade de completar tarefa será implementada', 'info');
}

async function initializeDailyTasks() {
    if (!selectedDeviceId) {
        showAlert('Selecione um dispositivo primeiro', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await apiCall(`/api/daily-tasks/initialize/${selectedDeviceId}`, {
            method: 'POST'
        });
        
        if (response.success) {
            showAlert('Tarefas de 21 dias inicializadas com sucesso!', 'success');
            await loadDeviceDailyTasks(selectedDeviceId);
        } else {
            showAlert(response.message || 'Erro ao inicializar tarefas', 'danger');
        }
        
    } catch (error) {
        console.error('Erro ao inicializar tarefas:', error);
        showAlert('Erro ao inicializar tarefas diárias', 'danger');
    } finally {
        hideLoading();
    }
}

function refreshDailyTasks() {
    if (selectedDeviceId) {
        loadDeviceDailyTasks(selectedDeviceId);
    } else {
        loadDailyTasks();
    }
}

function clearDailyTasksDisplay() {
    document.getElementById('overallProgress').innerHTML = '<p class="text-muted">Selecione um dispositivo para ver o progresso</p>';
    document.getElementById('daysContainer').innerHTML = '';
}

// ===== DISPOSITIVOS =====

async function loadDevices() {
    try {
        showLoading();
        
        const response = await apiCall('/api/devices');
        
        if (response.success) {
            displayDevicesTable(response.data.devices);
        } else {
            showAlert('Erro ao carregar dispositivos', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar dispositivos:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        hideLoading();
    }
}

function displayDevicesTable(devices) {
    const container = document.getElementById('devicesTable');
    
    if (!devices || devices.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum dispositivo encontrado</p>';
        return;
    }
    
    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Modelo</th>
                        <th>Status</th>
                        <th>Bateria</th>
                        <th>Última Atividade</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${devices.map(device => `
                        <tr>
                            <td>
                                <strong>${device.device_name}</strong>
                                <br>
                                <small class="text-muted">${device.device_id}</small>
                            </td>
                            <td>${device.model || 'N/A'}</td>
                            <td>
                                <span class="device-status ${device.is_online ? 'online' : 'offline'}"></span>
                                <span class="badge ${device.is_online ? 'bg-success' : 'bg-secondary'}">
                                    ${device.is_online ? 'Online' : 'Offline'}
                                </span>
                            </td>
                            <td>
                                ${device.battery_level ? `${device.battery_level}%` : 'N/A'}
                                ${device.battery_charging ? '<i class="fas fa-bolt text-warning"></i>' : ''}
                            </td>
                            <td>${formatDate(device.last_seen)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewDevice(${device.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="editDevice(${device.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteDevice(${device.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function showAddDeviceModal() {
    // Limpar formulário
    document.getElementById('addDeviceForm').reset();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
    modal.show();
}

async function addDevice() {
    const deviceId = document.getElementById('deviceId').value;
    const deviceName = document.getElementById('deviceName').value;
    const deviceModel = document.getElementById('deviceModel').value;
    const androidVersion = document.getElementById('androidVersion').value;
    const whatsappVersion = document.getElementById('whatsappVersion').value;
    
    if (!deviceId || !deviceName) {
        showAlert('ID e Nome do dispositivo são obrigatórios', 'warning');
        return;
    }
    
    try {
        const response = await apiCall('/api/devices', {
            method: 'POST',
            body: JSON.stringify({
                device_id: deviceId,
                device_name: deviceName,
                model: deviceModel,
                android_version: androidVersion,
                whatsapp_version: whatsappVersion
            })
        });
        
        if (response.success) {
            showAlert('Dispositivo adicionado com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            loadDevices();
        } else {
            showAlert(response.message || 'Erro ao adicionar dispositivo', 'danger');
        }
    } catch (error) {
        console.error('Erro ao adicionar dispositivo:', error);
        showAlert('Erro de conexão', 'danger');
    }
}

// ===== TAREFAS =====

async function loadTasks() {
    try {
        showLoading();
        
        const response = await apiCall('/api/tasks');
        
        if (response.success) {
            displayTasksTable(response.data.tasks);
            populateDeviceSelect(response.data.devices);
        } else {
            showAlert('Erro ao carregar tarefas', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        hideLoading();
    }
}

function displayTasksTable(tasks) {
    const container = document.getElementById('tasksTable');
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Dispositivo</th>
                        <th>Status</th>
                        <th>Prioridade</th>
                        <th>Criada em</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(task => `
                        <tr>
                            <td>
                                <strong>${getTaskTypeText(task.type)}</strong>
                                <br>
                                <small class="text-muted">${task.parameters ? JSON.stringify(task.parameters).substring(0, 50) + '...' : 'N/A'}</small>
                            </td>
                            <td>${task.device_name || 'N/A'}</td>
                            <td>
                                <span class="badge ${getStatusBadgeClass(task.status)}">
                                    ${getStatusText(task.status)}
                                </span>
                            </td>
                            <td>
                                <span class="badge ${getPriorityBadgeClass(task.priority)}">
                                    ${getPriorityText(task.priority)}
                                </span>
                            </td>
                            <td>${formatDate(task.created_at)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewTask(${task.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="startTask(${task.id})" ${task.status !== 'pending' ? 'disabled' : ''}>
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function showAddTaskModal() {
    // Limpar formulário
    document.getElementById('addTaskForm').reset();
    
    // Carregar dispositivos no select
    loadDevicesForSelect();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    modal.show();
}

async function loadDevicesForSelect() {
    try {
        const response = await apiCall('/api/devices');
        
        if (response.success) {
            const select = document.getElementById('taskDevice');
            select.innerHTML = '<option value="">Selecione um dispositivo</option>';
            
            response.data.devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = `${device.device_name} (${device.device_id})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dispositivos:', error);
    }
}

async function addTask() {
    const deviceId = document.getElementById('taskDevice').value;
    const taskType = document.getElementById('taskType').value;
    const taskPriority = document.getElementById('taskPriority').value;
    const taskParameters = document.getElementById('taskParameters').value;
    
    if (!deviceId || !taskType) {
        showAlert('Dispositivo e tipo de tarefa são obrigatórios', 'warning');
        return;
    }
    
    let parameters = {};
    if (taskParameters) {
        try {
            parameters = JSON.parse(taskParameters);
        } catch (error) {
            showAlert('Parâmetros devem estar em formato JSON válido', 'warning');
            return;
        }
    }
    
    try {
        const response = await apiCall('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({
                device_id: parseInt(deviceId),
                type: taskType,
                priority: taskPriority,
                parameters: parameters
            })
        });
        
        if (response.success) {
            showAlert('Tarefa criada com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
            loadTasks();
        } else {
            showAlert(response.message || 'Erro ao criar tarefa', 'danger');
        }
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        showAlert('Erro de conexão', 'danger');
    }
}

// ===== CONTEÚDO =====

async function loadContent() {
    try {
        showLoading();
        
        const response = await apiCall('/api/content');
        
        if (response.success) {
            displayContentTable(response.data.content);
        } else {
            showAlert('Erro ao carregar conteúdo', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        hideLoading();
    }
}

function displayContentTable(content) {
    const container = document.getElementById('contentTable');
    
    if (!content || content.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum conteúdo encontrado</p>';
        return;
    }
    
    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Nome do Arquivo</th>
                        <th>Tamanho</th>
                        <th>Status</th>
                        <th>Criado em</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${content.map(item => `
                        <tr>
                            <td>
                                <i class="fas ${getContentTypeIcon(item.content_type)} me-2"></i>
                                ${getContentTypeText(item.content_type)}
                            </td>
                            <td>${item.file_name || 'N/A'}</td>
                            <td>${formatFileSize(item.file_size)}</td>
                            <td>
                                <span class="badge ${getStatusBadgeClass(item.processing_status)}">
                                    ${getStatusText(item.processing_status)}
                                </span>
                            </td>
                            <td>${formatDate(item.created_at)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewContent(${item.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="downloadContent(${item.id})">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteContent(${item.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== ANALYTICS =====

async function loadAnalytics() {
    try {
        showLoading();
        
        const response = await apiCall('/api/analytics/overview');
        
        if (response.success) {
            displayAnalyticsData(response.data.overview);
        } else {
            showAlert('Erro ao carregar analytics', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar analytics:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        hideLoading();
    }
}

function displayAnalyticsData(data) {
    const container = document.getElementById('analyticsData');
    
    const html = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-users me-2"></i>
                            Estatísticas de Usuários
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Total de Usuários:</strong> ${data.users.total_users || 0}</p>
                        <p><strong>Usuários Ativos:</strong> ${data.users.active_users || 0}</p>
                        <p><strong>Novos Usuários (30 dias):</strong> ${data.users.new_users_30d || 0}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-mobile-alt me-2"></i>
                            Estatísticas de Dispositivos
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Total de Dispositivos:</strong> ${data.devices.total_devices || 0}</p>
                        <p><strong>Dispositivos Online:</strong> ${data.devices.online_devices || 0}</p>
                        <p><strong>Dispositivos Offline:</strong> ${data.devices.offline_devices || 0}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-tasks me-2"></i>
                            Estatísticas de Tarefas
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Total de Tarefas:</strong> ${data.tasks.total_tasks || 0}</p>
                        <p><strong>Tarefas Concluídas:</strong> ${data.tasks.completed_tasks || 0}</p>
                        <p><strong>Tarefas Pendentes:</strong> ${data.tasks.pending_tasks || 0}</p>
                        <p><strong>Tarefas Falharam:</strong> ${data.tasks.failed_tasks || 0}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-file-alt me-2"></i>
                            Estatísticas de Conteúdo
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Total de Conteúdo:</strong> ${data.content.total_content || 0}</p>
                        <p><strong>Imagens:</strong> ${data.content.image_content || 0}</p>
                        <p><strong>Vídeos:</strong> ${data.content.video_content || 0}</p>
                        <p><strong>Áudios:</strong> ${data.content.audio_content || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== USUÁRIOS =====

async function loadUsers() {
    try {
        showLoading();
        
        const response = await apiCall('/api/users');
        
        if (response.success) {
            displayUsersTable(response.data.users);
        } else {
            showAlert('Erro ao carregar usuários', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        hideLoading();
    }
}

function displayUsersTable(users) {
    const container = document.getElementById('usersTable');
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum usuário encontrado</p>';
        return;
    }
    
    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Último Login</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>
                                <strong>${user.username}</strong>
                                <br>
                                <small class="text-muted">${user.full_name || 'N/A'}</small>
                            </td>
                            <td>${user.email}</td>
                            <td>
                                <span class="badge ${getRoleBadgeClass(user.role)}">
                                    ${getRoleText(user.role)}
                                </span>
                            </td>
                            <td>
                                <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                                    ${user.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td>${formatDate(user.last_login)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewUser(${user.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== CONFIGURAÇÕES =====

async function loadSettings() {
    try {
        showLoading();
        
        const response = await apiCall('/api/settings');
        
        if (response.success) {
            displaySettingsForm(response.data.settings);
        } else {
            showAlert('Erro ao carregar configurações', 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showAlert('Erro de conexão', 'danger');
    } finally {
        hideLoading();
    }
}

function displaySettingsForm(settings) {
    const container = document.getElementById('settingsForm');
    
    const html = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-cog me-2"></i>
                            Configurações do Sistema
                        </h5>
                    </div>
                    <div class="card-body">
                        ${settings.map(setting => `
                            <div class="mb-3">
                                <label for="setting_${setting.key}" class="form-label">
                                    ${setting.description || setting.key}
                                </label>
                                <input type="text" class="form-control" id="setting_${setting.key}" 
                                       value="${setting.value || ''}" placeholder="Valor">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            Informações do Sistema
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Versão:</strong> 1.0.0</p>
                        <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                        <p><strong>Uptime:</strong> <span id="systemUptime">Carregando...</span></p>
                        <p><strong>Memória:</strong> <span id="systemMemory">Carregando...</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== UTILITÁRIOS =====

async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (response.status === 401) {
            const refreshed = await refreshAuthToken();
            if (refreshed) {
                // Retry with new token
                finalOptions.headers.Authorization = `Bearer ${authToken}`;
                const retryResponse = await fetch(url, finalOptions);
                return await retryResponse.json();
            } else {
                logout();
                throw new Error('Sessão expirada');
            }
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

async function refreshAuthToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.access_token;
            localStorage.setItem('authToken', authToken);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        return false;
    }
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHtml;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// ===== FUNÇÕES DE FORMATAÇÃO =====

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusBadgeClass(status) {
    const classes = {
        'active': 'bg-success',
        'inactive': 'bg-secondary',
        'maintenance': 'bg-warning',
        'completed': 'bg-success',
        'pending': 'bg-warning',
        'running': 'bg-primary',
        'failed': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}

function getStatusText(status) {
    const texts = {
        'active': 'Ativo',
        'inactive': 'Inativo',
        'maintenance': 'Manutenção',
        'completed': 'Concluído',
        'pending': 'Pendente',
        'running': 'Em Execução',
        'failed': 'Falhou'
    };
    return texts[status] || status;
}

function getPriorityBadgeClass(priority) {
    const classes = {
        'low': 'bg-secondary',
        'medium': 'bg-warning',
        'high': 'bg-danger',
        'urgent': 'bg-danger'
    };
    return classes[priority] || 'bg-secondary';
}

function getPriorityText(priority) {
    const texts = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta',
        'urgent': 'Urgente'
    };
    return texts[priority] || priority;
}

function getRoleBadgeClass(role) {
    const classes = {
        'admin': 'bg-danger',
        'manager': 'bg-warning',
        'operator': 'bg-primary',
        'viewer': 'bg-secondary'
    };
    return classes[role] || 'bg-secondary';
}

function getRoleText(role) {
    const texts = {
        'admin': 'Administrador',
        'manager': 'Gerente',
        'operator': 'Operador',
        'viewer': 'Visualizador'
    };
    return texts[role] || role;
}

function getTaskTypeText(type) {
    const texts = {
        'message': 'Mensagem',
        'media': 'Mídia',
        'contact': 'Contato',
        'group': 'Grupo',
        'backup': 'Backup'
    };
    return texts[type] || type;
}

function getContentTypeIcon(type) {
    const icons = {
        'text': 'fas fa-file-alt',
        'image': 'fas fa-image',
        'video': 'fas fa-video',
        'audio': 'fas fa-volume-up',
        'document': 'fas fa-file-pdf'
    };
    return icons[type] || 'fas fa-file';
}

function getContentTypeText(type) {
    const texts = {
        'text': 'Texto',
        'image': 'Imagem',
        'video': 'Vídeo',
        'audio': 'Áudio',
        'document': 'Documento'
    };
    return texts[type] || type;
}

// ===== FUNÇÕES PLACEHOLDER (mantidas do frontend original) =====

// Funções para outras seções (devices, tasks, content, analytics, users, settings)
// Estas serão implementadas conforme necessário

async function loadDevices() {
    // Implementar carregamento de dispositivos
    showAlert('Seção de dispositivos será implementada', 'info');
}

async function loadTasks() {
    // Implementar carregamento de tarefas gerais
    showAlert('Seção de tarefas gerais será implementada', 'info');
}

async function loadContent() {
    // Implementar carregamento de conteúdo
    showAlert('Seção de conteúdo será implementada', 'info');
}

async function loadAnalytics() {
    // Implementar carregamento de analytics
    showAlert('Seção de analytics será implementada', 'info');
}

async function loadUsers() {
    // Implementar carregamento de usuários
    showAlert('Seção de usuários será implementada', 'info');
}

async function loadSettings() {
    // Implementar carregamento de configurações
    showAlert('Seção de configurações será implementada', 'info');
}

// Funções placeholder para ações
function viewDevice(id) { showAlert(`Visualizar dispositivo ${id}`, 'info'); }
function editDevice(id) { showAlert(`Editar dispositivo ${id}`, 'info'); }
function deleteDevice(id) { showAlert(`Deletar dispositivo ${id}`, 'info'); }
function viewTask(id) { showAlert(`Visualizar tarefa ${id}`, 'info'); }
function startTask(id) { showAlert(`Iniciar tarefa ${id}`, 'info'); }
function deleteTask(id) { showAlert(`Deletar tarefa ${id}`, 'info'); }
function viewContent(id) { showAlert(`Visualizar conteúdo ${id}`, 'info'); }
function downloadContent(id) { showAlert(`Download conteúdo ${id}`, 'info'); }
function deleteContent(id) { showAlert(`Deletar conteúdo ${id}`, 'info'); }
function viewUser(id) { showAlert(`Visualizar usuário ${id}`, 'info'); }
function editUser(id) { showAlert(`Editar usuário ${id}`, 'info'); }
function deleteUser(id) { showAlert(`Deletar usuário ${id}`, 'info'); }
function showProfile() { showAlert('Perfil do usuário', 'info'); }
function showUploadModal() { showAlert('Modal de upload', 'info'); }
function showAddUserModal() { showAlert('Modal de adicionar usuário', 'info'); }
function exportAnalytics() { showAlert('Exportar analytics', 'info'); }
function saveSettings() { showAlert('Configurações salvas!', 'success'); }
function populateDeviceSelect(devices) { /* Implementar se necessário */ }
