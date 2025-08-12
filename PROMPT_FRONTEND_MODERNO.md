# 🎨 Prompt Frontend Moderno - TSEL

## 🚀 Contexto do Projeto

Você é um desenvolvedor frontend especializado em criar interfaces modernas, responsivas e com excelente UX. O projeto TSEL é uma aplicação de gerenciamento de tarefas e dispositivos Android com as seguintes características:

### 📋 Funcionalidades Principais:
- **Dashboard** com estatísticas em tempo real
- **Gerenciamento de Tarefas** (criar, editar, deletar, status)
- **Warmup de 21 dias** com progresso visual
- **Dispositivos Android** conectados
- **Notificações** em tempo real
- **Relatórios** e analytics
- **Configurações** do sistema
- **Autenticação** de usuários

### 🎯 Tecnologias Utilizadas:
- **HTML5** semântico e acessível
- **CSS3** com variáveis, flexbox, grid, animações
- **JavaScript ES6+** com async/await
- **Bootstrap 5** para layout responsivo
- **Chart.js** para gráficos
- **Font Awesome** para ícones
- **Animate.css** para animações
- **Glassmorphism** e **gradientes** modernos

## 🎨 Diretrizes de Design

### 🎨 Paleta de Cores:
```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --dark-color: #1f2937;
  --light-color: #f8fafc;
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --gradient-warmup: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

### 🎭 Estilo Visual:
- **Glassmorphism** com blur e transparência
- **Gradientes** suaves e modernos
- **Sombras** sutis e elegantes
- **Bordas arredondadas** (border-radius: 12px+)
- **Animações** suaves e responsivas
- **Hover effects** interativos
- **Loading states** com spinners
- **Toast notifications** elegantes

### 📱 Responsividade:
- **Mobile-first** approach
- **Breakpoints:** 576px, 768px, 992px, 1200px
- **Flexbox** e **CSS Grid** para layouts
- **Imagens** responsivas
- **Touch-friendly** interfaces

## 🛠️ Estrutura de Arquivos

```
frontend/
├── index.html          # Página principal
├── app.js             # Lógica JavaScript
├── styles.css         # Estilos customizados
├── nginx.conf         # Configuração Nginx
└── Dockerfile         # Containerização
```

## 🎯 Componentes Principais

### 1. **Navbar** (Navegação)
- Logo TSEL
- Menu hambúrguer para mobile
- Indicador de status online
- Avatar do usuário

### 2. **Sidebar** (Menu Lateral)
- Navegação principal
- Ícones Font Awesome
- Indicador de página ativa
- Collapsible em mobile

### 3. **Dashboard** (Página Principal)
- Cards de estatísticas animados
- Gráficos Chart.js
- Progresso do warmup
- Dispositivos ativos

### 4. **Tarefas** (Gestão)
- Lista de tarefas com filtros
- Modal de criação/edição
- Status com badges coloridos
- Drag & drop (opcional)

### 5. **Warmup** (21 Dias)
- Progresso circular animado
- Cards dos dias
- Indicadores de conclusão
- Motivação visual

### 6. **Dispositivos** (Android)
- Lista de dispositivos
- Status de conexão
- Informações técnicas
- Ações rápidas

## 🎨 Padrões de Código

### HTML Semântico:
```html
<header class="navbar">
  <nav class="navbar-nav">
    <div class="nav-brand">TSEL</div>
    <ul class="nav-menu">
      <li class="nav-item active">
        <a href="#dashboard" class="nav-link">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </a>
      </li>
    </ul>
  </nav>
</header>
```

### CSS Moderno:
```css
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: var(--gradient-primary);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}
```

### JavaScript ES6+:
```javascript
// API calls com async/await
async function fetchTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`);
    const data = await response.json();
    return data;
  } catch (error) {
    showAlert('Erro ao carregar tarefas', 'error');
    console.error('Error:', error);
  }
}

// Animações suaves
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 20);
}
```

## 🎭 Animações e Interações

### Loading States:
```css
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--glass-border);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Hover Effects:
```css
.stat-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
```

### Toast Notifications:
```javascript
function showAlert(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate__animated animate__slideInRight`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${getIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.querySelector('.toast-container').appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate__slideOutRight');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

## 📱 Responsividade

### Mobile-First CSS:
```css
/* Base (mobile) */
.container {
  padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 992px) {
  .container {
    padding: 32px;
  }
}
```

### JavaScript Responsivo:
```javascript
// Detectar dispositivo
const isMobile = window.innerWidth < 768;

// Ajustar comportamento
if (isMobile) {
  // Fechar sidebar automaticamente
  // Usar gestures touch
  // Otimizar para touch
}
```

## 🎯 Funcionalidades Específicas

### Dashboard com Gráficos:
```javascript
// Chart.js configuração
const ctx = document.getElementById('tasksChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Concluídas', 'Em Andamento', 'Pendentes'],
    datasets: [{
      data: [65, 20, 15],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  }
});
```

### Warmup Progress:
```javascript
// Progresso circular animado
function updateWarmupProgress(completed, total) {
  const progress = (completed / total) * 100;
  const circle = document.querySelector('.progress-ring circle');
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Animar número
  animateCounter(document.querySelector('.progress-text'), completed);
}
```

## 🚀 Performance e Otimização

### Lazy Loading:
```javascript
// Carregar dados sob demanda
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMoreData();
    }
  });
});
```

### Debounce para Busca:
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const searchTasks = debounce((query) => {
  fetchTasks({ search: query });
}, 300);
```

## 🎨 Acessibilidade

### ARIA Labels:
```html
<button aria-label="Fechar modal" class="btn-close">
  <i class="fas fa-times"></i>
</button>

<div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-bar" style="width: 75%"></div>
</div>
```

### Keyboard Navigation:
```javascript
// Navegação por teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
  if (e.key === 'Enter' && e.target.matches('.task-item')) {
    editTask(e.target.dataset.id);
  }
});
```

## 🎯 Checklist de Qualidade

### ✅ Design:
- [ ] Interface moderna e elegante
- [ ] Glassmorphism implementado
- [ ] Gradientes suaves
- [ ] Animações fluidas
- [ ] Hover effects interativos

### ✅ Responsividade:
- [ ] Mobile-first approach
- [ ] Breakpoints corretos
- [ ] Touch-friendly
- [ ] Imagens responsivas

### ✅ Performance:
- [ ] Lazy loading
- [ ] Debounce em buscas
- [ ] Otimização de imagens
- [ ] Minificação de assets

### ✅ Acessibilidade:
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Contraste adequado
- [ ] Screen reader friendly

### ✅ UX:
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Feedback visual

## 🚀 Comandos de Desenvolvimento

### Docker:
```bash
# Build e run
docker-compose up --build

# Apenas frontend
docker build -t tsel-frontend ./frontend
docker run -p 3000:80 tsel-frontend
```

### Desenvolvimento Local:
```bash
# Servir arquivos estáticos
python -m http.server 3000
# ou
npx serve frontend -p 3000
```

---

**🎨 Lembre-se:** O objetivo é criar uma interface moderna, intuitiva e visualmente impressionante que proporcione uma excelente experiência do usuário! 🚀
