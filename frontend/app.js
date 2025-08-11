// TSEL Frontend - Sistema de Chip Warmup para WhatsApp
// Configurações da API - Conectando com o backend Docker
const API_BASE_URL = window.location.protocol === 'https:' 
    ? 'https://' + window.location.hostname 
    : 'http://' + window.location.hostname + ':3001';

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

    // Adicionar listeners para melhorias de UX
    addEventListeners();
    
    // Testar conexão com backend
    testBackendConnection();
}

// Testar conexão com o backend
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend conectado com sucesso');
        } else {
            console.warn('⚠️ Backend respondeu mas com erro:', response.status);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com backend:', error);
        showToast('Erro de conexão com o backend. Verifique se está rodando.', 'error');
    }
}

// Adicionar event listeners para melhorias
function addEventListeners() {
    // Fechar sidebar ao clicar fora em mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const navbarToggler = document.querySelector('.navbar-toggler');
        
        if (window.innerWidth < 768 && sidebar.classList.contains('show')) {
            if (!sidebar.contains(e.target) && !navbarToggler.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    // Adicionar efeitos de hover nos cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Toggle sidebar em mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
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
            
            showToast('Login realizado com sucesso!', 'success');
            showMainApp();
            loadDashboard();
        } else {
            showToast(data.message || 'Erro no login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro de conexão. Verifique se o backend está rodando.', 'error');
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
    
    showToast('Logout realizado com sucesso!', 'info');
    showLoginScreen();
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

    // Adicionar animação de entrada
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.add('fade-in');
}

function showDashboard() {
    hideAllContent();
    document.getElementById('dashboardContent').style.display = 'block';
    updateActiveNav('dashboard');
    loadDashboard();
    
    // Adicionar animação
    const dashboard = document.getElementById('dashboardContent');
    dashboard.classList.add('fade-in');
}

function showDailyTasks() {
    hideAllContent();
    document.getElementById('dailyTasksContent').style.display = 'block';
    updateActiveNav('daily-tasks');
    loadDailyTasks();
    
    // Adicionar animação
    const dailyTasks = document.getElementById('dailyTasksContent');
    dailyTasks.classList.add('fade-in');
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
        const element = document.getElementById(contentId);
        element.style.display = 'none';
        element.classList.remove('fade-in');
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

    // Fechar sidebar em mobile após navegação
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('show');
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
        showToast('Erro ao carregar dados do dashboard', 'error');
    } finally {
        hideLoading();
    }
}

function updateDashboardStats(data) {
    // Animar contadores
    animateCounter('totalDevices', data.total_devices || 0);
    animateCounter('completedTasks', data.completed_tasks || 0);
    animateCounter('pendingTasks', data.pending_tasks || 0);
    animateCounter('warmupProgress', data.warmup_progress || 0, '%');
}

function animateCounter(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function para animação suave
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
        
        element.textContent = currentValue + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function updateDashboardCharts(data) {
    // Gráfico de dispositivos
    const devicesCtx = document.getElementById('devicesChart');
    if (!devicesCtx) return;
    
    if (devicesChart) devicesChart.destroy();
    
    devicesChart = new Chart(devicesCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Online', 'Offline', 'Manutenção'],
            datasets: [{
                data: [
                    data.online_devices || 0,
                    data.offline_devices || 0,
                    data.maintenance_devices || 0
                ],
                backgroundColor: ['#27ae60', '#e74c3c', '#f39c12'],
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });

    // Gráfico de tarefas
    const tasksCtx = document.getElementById('tasksChart');
    if (!tasksCtx) return;
    
    if (tasksChart) tasksChart.destroy();
    
    tasksChart = new Chart(tasksCtx.getContext('2d'), {
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
                backgroundColor: ['#27ae60', '#f39c12', '#3498db', '#e74c3c'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateRecentDevices(devices) {
    const container = document.getElementById('recentDevices');
    if (!container) return;
    
    if (devices.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum dispositivo encontrado</p>';
        return;
    }
    
    const html = devices.map((device, index) => `
        <div class="d-flex justify-content-between align-items-center mb-3" style="animation-delay: ${index * 0.1}s;">
            <div>
                <strong>${device.device_name || device.name}</strong>
                <br>
                <small class="text-muted">${device.model || 'N/A'} - ${device.brand || 'N/A'}</small>
            </div>
            <span class="badge ${device.is_online ? 'bg-success' : 'bg-secondary'}">
                <i class="fas fa-circle me-1"></i>
                ${device.is_online ? 'Online' : 'Offline'}
            </span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateRecentTasks(tasks) {
    const container = document.getElementById('recentTasks');
    if (!container) return;
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    const html = tasks.map((task, index) => `
        <div class="d-flex justify-content-between align-items-center mb-3" style="animation-delay: ${index * 0.1}s;">
            <div>
                <strong>${task.title || task.task_description}</strong>
                <br>
                <small class="text-muted">${getTaskTypeText(task.type || task.task_type)}</small>
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
    showToast('Dashboard atualizado!', 'success');
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
        showToast('Erro ao carregar tarefas diárias', 'error');
    } finally {
        hideLoading();
    }
}

async function loadDevicesForDailyTasks() {
    try {
        const response = await apiCall('/api/devices');
        const devices = response.data?.devices || response.data || [];
        
        const select = document.getElementById('deviceSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione um dispositivo</option>';
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = `${device.device_name || device.name} (${device.device_id})`;
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
        showToast('Erro ao carregar dispositivos', 'error');
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
        if (!daysContainer) return;
        
        daysContainer.innerHTML = '';
        
        for (let day = 1; day <= 21; day++) {
            try {
                const dayResponse = await apiCall(`/api/daily-tasks/device/${deviceId}/day/${day}`);
                const dayTasks = dayResponse.data || [];
                
                const dayCard = createDayCard(day, dayTasks, progressResponse.data?.daily_progress);
                daysContainer.appendChild(dayCard);
                
                // Adicionar animação com delay
                setTimeout(() => {
                    dayCard.style.opacity = '1';
                    dayCard.style.transform = 'translateY(0)';
                }, day * 50);
                
            } catch (error) {
                console.error(`Erro ao carregar dia ${day}:`, error);
                const dayCard = createDayCard(day, [], []);
                daysContainer.appendChild(dayCard);
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar tarefas do dispositivo:', error);
        showToast('Erro ao carregar tarefas do dispositivo', 'error');
    } finally {
        hideLoading();
    }
}

function updateOverallProgress(progressData) {
    const container = document.getElementById('overallProgress');
    if (!container) return;
    
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
                         style="width: 0%" 
                         data-target="${percentage}"
                         aria-valuenow="0" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        0%
                    </div>
                </div>
                <div class="row text-center">
                    <div class="col-4">
                        <h4 class="text-success" data-target="${completedTasks}">0</h4>
                        <small class="text-muted">Concluídas</small>
                    </div>
                    <div class="col-4">
                        <h4 class="text-warning" data-target="${overall.pending_tasks || 0}">0</h4>
                        <small class="text-muted">Pendentes</small>
                    </div>
                    <div class="col-4">
                        <h4 class="text-primary" data-target="${totalTasks}">0</h4>
                        <small class="text-muted">Total</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 text-center">
                <div class="progress-ring">
                    <svg width="120" height="120">
                        <circle class="bg" cx="60" cy="60" r="50"></circle>
                        <circle class="progress" cx="60" cy="60" r="50" 
                                stroke-dasharray="0 ${2 * Math.PI * 50}" 
                                data-target="${2 * Math.PI * 50 * percentage / 100}">
                        </circle>
                    </svg>
                </div>
                <h3 class="mt-2" data-target="${percentage}">0%</h3>
                <small class="text-muted">Progresso Geral</small>
            </div>
        </div>
    `;

    // Animar progresso
    setTimeout(() => {
        animateProgressBars();
    }, 500);
}

function animateProgressBars() {
    // Animar barra de progresso
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const targetWidth = progressBar.getAttribute('data-target');
        progressBar.style.width = targetWidth + '%';
        progressBar.textContent = targetWidth + '%';
    }

    // Animar números
    document.querySelectorAll('[data-target]').forEach(element => {
        const target = parseInt(element.getAttribute('data-target'));
        animateCounter(element, target, element.textContent.includes('%') ? '%' : '');
    });

    // Animar progress ring
    const progressCircle = document.querySelector('.progress-ring .progress');
    if (progressCircle) {
        const targetDash = progressCircle.getAttribute('data-target');
        progressCircle.style.strokeDasharray = `${targetDash} ${2 * Math.PI * 50}`;
    }
}

function createDayCard(dayNumber, tasks, dailyProgress) {
    const dayProgress = dailyProgress?.find(p => p.day_number === dayNumber) || {};
    const totalTasks = dayProgress.total_tasks || tasks.length;
    const completedTasks = dayProgress.completed_tasks || tasks.filter(t => t.status === 'completed').length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let statusClass = 'pending';
    if (percentage === 100) statusClass = 'completed';
    else if (percentage > 0) statusClass = 'in-progress';
    
    const card = document.createElement('div');
    card.className = `col-md-6 col-lg-4 mb-4`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';
    
    card.innerHTML = `
        <div class="card day-card ${statusClass}" onclick="showDayTasks(${dayNumber})">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-calendar-day me-2"></i>
                        Dia ${dayNumber}
                    </h5>
                    <span class="badge ${statusClass === 'completed' ? 'bg-success' : statusClass === 'in-progress' ? 'bg-warning' : 'bg-secondary'}">
                        ${percentage}%
                    </span>
                </div>
                
                <div class="progress mb-3" style="height: 8px;">
                    <div class="progress-bar ${statusClass === 'completed' ? 'bg-success' : statusClass === 'in-progress' ? 'bg-warning' : 'bg-secondary'}" 
                         role="progressbar" 
                         style="width: 0%" 
                         data-target="${percentage}"
                         aria-valuenow="0" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
                
                <div class="row text-center">
                    <div class="col-6">
                        <small class="text-muted">Concluídas</small>
                        <div class="fw-bold text-success" data-target="${completedTasks}">0</div>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Total</small>
                        <div class="fw-bold" data-target="${totalTasks}">0</div>
                    </div>
                </div>
                
                ${tasks.length > 0 ? `
                    <div class="mt-3">
                        <small class="text-muted">Próximas tarefas:</small>
                        <div class="mt-1">
                            ${tasks.slice(0, 2).map(task => `
                                <span class="category-badge category-${task.metadata?.category || 'default'} me-1">
                                    ${task.task_type || task.type}
                                </span>
                            `).join('')}
                            ${tasks.length > 2 ? `<small class="text-muted">+${tasks.length - 2} mais</small>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Animar progresso do card após renderização
    setTimeout(() => {
        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
        
        card.querySelectorAll('[data-target]').forEach(element => {
            const target = parseInt(element.getAttribute('data-target'));
            animateCounter(element, target);
        });
    }, 100);
    
    return card;
}

function showDayTasks(dayNumber) {
    if (!selectedDeviceId) {
        showToast('Selecione um dispositivo primeiro', 'warning');
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
        showToast('Erro ao carregar tarefas do dia', 'error');
    } finally {
        hideLoading();
    }
}

function displayDayTasksModal(dayNumber, tasks) {
    const modal = new bootstrap.Modal(document.getElementById('taskModal'));
    const content = document.getElementById('taskModalContent');
    
    content.innerHTML = `
        <div class="mb-3">
            <h4><i class="fas fa-calendar-day me-2"></i>Tarefas do Dia ${dayNumber}</h4>
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
            ${tasks.map((task, index) => `
                <div class="task-item ${task.status === 'completed' ? 'completed' : 'pending'}" 
                     onclick="showTaskDetails(${task.id})"
                     style="animation-delay: ${index * 0.1}s;">
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
                            <h6 class="mb-1">${task.task_description || task.title}</h6>
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
    if (completeBtn) {
        completeBtn.onclick = () => completeSelectedTask();
    }
    
    modal.show();
}

function showTaskDetails(taskId) {
    showToast(`Visualizando detalhes da tarefa ${taskId}`, 'info');
}

function completeSelectedTask() {
    showToast('Funcionalidade de completar tarefa será implementada', 'info');
}

async function initializeDailyTasks() {
    if (!selectedDeviceId) {
        showToast('Selecione um dispositivo primeiro', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const response = await apiCall(`/api/daily-tasks/initialize/${selectedDeviceId}`, {
            method: 'POST'
        });
        
        if (response.success) {
            showToast('Tarefas de 21 dias inicializadas com sucesso!', 'success');
            await loadDeviceDailyTasks(selectedDeviceId);
        } else {
            showToast(response.message || 'Erro ao inicializar tarefas', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao inicializar tarefas:', error);
        showToast('Erro ao inicializar tarefas diárias', 'error');
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
    showToast('Tarefas atualizadas!', 'success');
}

function clearDailyTasksDisplay() {
    const overallProgress = document.getElementById('overallProgress');
    const daysContainer = document.getElementById('daysContainer');
    
    if (overallProgress) {
        overallProgress.innerHTML = '<p class="text-muted">Selecione um dispositivo para ver o progresso</p>';
    }
    
    if (daysContainer) {
        daysContainer.innerHTML = '';
    }
}

// ===== DISPOSITIVOS =====

async function loadDevices() {
    try {
        showLoading();
        
        const response = await apiCall('/api/devices');
        
        if (response.success) {
            displayDevicesTable(response.data.devices);
        } else {
            showToast('Erro ao carregar dispositivos', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar dispositivos:', error);
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

function displayDevicesTable(devices) {
    const container = document.getElementById('devicesTable');
    
    if (!container) return;

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
                                <strong>${device.device_name || device.name}</strong>
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
        showToast('ID e Nome do dispositivo são obrigatórios', 'warning');
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
            showToast('Dispositivo adicionado com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            loadDevices();
        } else {
            showToast(response.message || 'Erro ao adicionar dispositivo', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar dispositivo:', error);
        showToast('Erro de conexão', 'error');
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
            showToast('Erro ao carregar tarefas', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

function displayTasksTable(tasks) {
    const container = document.getElementById('tasksTable');
    
    if (!container) return;

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
            if (!select) return;
            
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
        showToast('Dispositivo e tipo de tarefa são obrigatórios', 'warning');
        return;
    }
    
    let parameters = {};
    if (taskParameters) {
        try {
            parameters = JSON.parse(taskParameters);
        } catch (error) {
            showToast('Parâmetros devem estar em formato JSON válido', 'warning');
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
            showToast('Tarefa criada com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
            loadTasks();
        } else {
            showToast(response.message || 'Erro ao criar tarefa', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        showToast('Erro de conexão', 'error');
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
            showToast('Erro ao carregar conteúdo', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

function displayContentTable(content) {
    const container = document.getElementById('contentTable');
    
    if (!container) return;

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
            showToast('Erro ao carregar analytics', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar analytics:', error);
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

function displayAnalyticsData(data) {
    const container = document.getElementById('analyticsData');
    
    if (!container) return;

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
            showToast('Erro ao carregar usuários', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

function displayUsersTable(users) {
    const container = document.getElementById('usersTable');
    
    if (!container) return;

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
            showToast('Erro ao carregar configurações', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

function displaySettingsForm(settings) {
    const container = document.getElementById('settingsForm');
    
    if (!container) return;

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
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'block';
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Sistema de Toast Notifications melhorado
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="fas ${getToastIcon(type)} me-2 text-${getToastColor(type)}"></i>
                <strong class="me-auto">TSEL</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function getToastColor(type) {
    const colors = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return colors[type] || 'info';
}

// Sistema de alertas melhorado (mantido para compatibilidade)
function showAlert(message, type = 'info') {
    showToast(message, type);
}

// ===== FUNÇÕES DE FORMATAÇÃO =====

function formatDate(dateString) {
    if (!dateString) return 'N/A';
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
        'backup': 'Backup',
        'profile_update': 'Atualizar Perfil',
        'security_check': 'Verificação de Segurança',
        'waiting_period': 'Período de Espera',
        'group_creation': 'Criação de Grupo',
        'message_sending': 'Envio de Mensagem',
        'audio_sharing': 'Compartilhamento de Áudio',
        'image_sharing': 'Compartilhamento de Imagem',
        'video_sharing': 'Compartilhamento de Vídeo',
        'contact_sharing': 'Compartilhamento de Contato',
        'call_making': 'Realização de Chamada',
        'sticker_sending': 'Envio de Sticker',
        'emoji_usage': 'Uso de Emoji',
        'document_sharing': 'Compartilhamento de Documento',
        'conversation_start': 'Início de Conversa',
        'status_update': 'Atualização de Status'
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
    showToast('Seção de dispositivos será implementada', 'info');
}

async function loadTasks() {
    // Implementar carregamento de tarefas gerais
    showToast('Seção de tarefas gerais será implementada', 'info');
}

async function loadContent() {
    // Implementar carregamento de conteúdo
    showToast('Seção de conteúdo será implementada', 'info');
}

async function loadAnalytics() {
    // Implementar carregamento de analytics
    showToast('Seção de analytics será implementada', 'info');
}

async function loadUsers() {
    // Implementar carregamento de usuários
    showToast('Seção de usuários será implementada', 'info');
}

async function loadSettings() {
    // Implementar carregamento de configurações
    showToast('Seção de configurações será implementada', 'info');
}

// Funções placeholder para ações
function viewDevice(id) { showToast(`Visualizar dispositivo ${id}`, 'info'); }
function editDevice(id) { showToast(`Editar dispositivo ${id}`, 'info'); }
function deleteDevice(id) { showToast(`Deletar dispositivo ${id}`, 'info'); }
function viewTask(id) { showToast(`Visualizar tarefa ${id}`, 'info'); }
function startTask(id) { showToast(`Iniciar tarefa ${id}`, 'info'); }
function deleteTask(id) { showToast(`Deletar tarefa ${id}`, 'info'); }
function viewContent(id) { showToast(`Visualizar conteúdo ${id}`, 'info'); }
function downloadContent(id) { showToast(`Download conteúdo ${id}`, 'info'); }
function deleteContent(id) { showToast(`Deletar conteúdo ${id}`, 'info'); }
function viewUser(id) { showToast(`Visualizar usuário ${id}`, 'info'); }
function editUser(id) { showToast(`Editar usuário ${id}`, 'info'); }
function deleteUser(id) { showToast(`Deletar usuário ${id}`, 'info'); }
function showProfile() { showToast('Perfil do usuário', 'info'); }
function showUploadModal() { showToast('Modal de upload', 'info'); }
function showAddUserModal() { showToast('Modal de adicionar usuário', 'info'); }
function exportAnalytics() { showToast('Exportar analytics', 'info'); }
function saveSettings() { showToast('Configurações salvas!', 'success'); }
function populateDeviceSelect(devices) { /* Implementar se necessário */ }
