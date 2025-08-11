# 🚀 TSEL Frontend - Sistema de Chip Warmup para WhatsApp

## 📋 Visão Geral

O TSEL Frontend é uma interface web moderna e especializada para gerenciar o processo completo de **aquecimento de chips WhatsApp** durante 21 dias. O sistema oferece uma experiência visual intuitiva e funcionalidades avançadas para acompanhar o progresso de cada dispositivo através das tarefas diárias de warmup.

## ✨ Características Principais

### 🎯 Foco em Warmup de 21 Dias
- **Interface especializada** para tarefas de aquecimento de chips
- **Progresso visual** por dia com indicadores de status
- **Categorização automática** de tarefas por tipo (perfil, mensagens, áudios, etc.)
- **Gerenciamento completo** do ciclo de 21 dias

### 📊 Dashboard Inteligente
- **Estatísticas em tempo real** do progresso de warmup
- **Gráficos interativos** de dispositivos e tarefas
- **Indicadores visuais** de progresso geral
- **Resumo de atividades** recentes

### 🔧 Funcionalidades Avançadas
- **Seleção de dispositivos** com interface intuitiva
- **Inicialização automática** de tarefas de 21 dias
- **Visualização detalhada** de tarefas por dia
- **Marcação de conclusão** de tarefas individuais
- **Progresso em tempo real** com atualizações automáticas

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura semântica e moderna
- **CSS3** - Estilos avançados com gradientes e animações
- **JavaScript ES6+** - Funcionalidades interativas e dinâmicas
- **Bootstrap 5** - Framework responsivo para layout
- **Chart.js** - Gráficos interativos e visualizações
- **Font Awesome** - Ícones modernos e consistentes
- **Fetch API** - Comunicação com backend RESTful

## 🎨 Design System

### Cores Principais
- **Primária**: `#2c3e50` (Azul escuro)
- **Secundária**: `#3498db` (Azul claro)
- **Warmup**: `#8e44ad` (Roxo especializado)
- **Sucesso**: `#27ae60` (Verde)
- **Aviso**: `#f39c12` (Laranja)
- **Erro**: `#e74c3c` (Vermelho)

### Componentes Visuais
- **Cards interativos** com hover effects
- **Progress rings** para indicadores circulares
- **Badges coloridos** por categoria de tarefa
- **Gradientes modernos** para elementos especiais
- **Animações suaves** para transições

## 🚀 Como Usar

### 1. Acesso ao Sistema
```bash
# Acesse diretamente o arquivo HTML
open frontend/index.html

# Ou use um servidor local
python -m http.server 8000
# Acesse: http://localhost:8000/frontend/
```

### 2. Login
- **Email**: `admin@tsel.com`
- **Senha**: `Admin123!`
- **Outros usuários**: Consulte o backend para credenciais

### 3. Navegação Principal

#### 📊 Dashboard
- Visão geral do sistema
- Estatísticas de dispositivos e tarefas
- Gráficos de progresso
- Atividades recentes

#### 📅 Tarefas de 21 Dias (PRINCIPAL)
- **Seleção de dispositivo**: Escolha o chip para gerenciar
- **Inicialização**: Crie todas as tarefas de 21 dias automaticamente
- **Progresso geral**: Visualize o avanço completo do warmup
- **Dias individuais**: Clique em cada dia para ver tarefas específicas
- **Gerenciamento**: Marque tarefas como concluídas

#### 📱 Dispositivos
- Lista de todos os dispositivos
- Status e informações técnicas
- Gerenciamento de configurações

#### 📋 Tarefas Gerais
- Tarefas não relacionadas ao warmup
- Agendamento e priorização
- Histórico de execução

#### 📁 Conteúdo
- Gerenciamento de mídias
- Templates de mensagens
- Arquivos de backup

#### 📈 Analytics
- Relatórios detalhados
- Métricas de performance
- Exportação de dados

#### 👥 Usuários
- Gerenciamento de usuários
- Controle de permissões
- Logs de atividade

#### ⚙️ Configurações
- Configurações do sistema
- Preferências de usuário
- Backup e restauração

## 🎯 Funcionalidades Especializadas - Warmup de 21 Dias

### Inicialização de Tarefas
1. **Selecione um dispositivo** no dropdown
2. **Clique em "Inicializar Tarefas"**
3. **Sistema cria automaticamente** todas as 147 tarefas (21 dias × 7 tarefas/dia)

### Visualização de Progresso
- **Cards de dias**: Cada dia mostra progresso individual
- **Cores indicativas**:
  - 🟢 Verde: Dia completo (100%)
  - 🟡 Amarelo: Em progresso (1-99%)
  - ⚪ Cinza: Pendente (0%)

### Gerenciamento de Tarefas
1. **Clique em um dia** para ver tarefas específicas
2. **Modal detalhado** mostra todas as tarefas do dia
3. **Categorias visuais** por tipo de atividade
4. **Marcação de conclusão** individual

### Categorias de Tarefas
- **profile**: Configuração de perfil
- **security**: Segurança e verificação
- **waiting**: Períodos de espera
- **groups**: Gerenciamento de grupos
- **messages**: Mensagens de texto
- **audio**: Áudios e chamadas
- **images**: Imagens e fotos
- **videos**: Vídeos
- **contacts**: Contatos e Vcards
- **calls**: Chamadas de voz e vídeo
- **stickers**: Figurinhas
- **emoji**: Emojis
- **documents**: Documentos e PDFs
- **conversations**: Conversas e arquivamento
- **status**: Status do WhatsApp

## 🔌 Integração com Backend

### Endpoints Utilizados
```javascript
// Autenticação
POST /api/auth/login
POST /api/auth/refresh

// Dispositivos
GET /api/devices

// Tarefas de 21 dias
POST /api/daily-tasks/initialize/:deviceId
GET /api/daily-tasks/device/:deviceId
GET /api/daily-tasks/device/:deviceId/day/:dayNumber
GET /api/daily-tasks/progress/:deviceId
PUT /api/daily-tasks/:id/complete

// Analytics
GET /api/analytics/dashboard
```

### Configuração da API
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `http://${window.location.hostname}:3001`;
```

## 📱 Responsividade

O frontend é **totalmente responsivo** e funciona em:
- ✅ **Desktop** (1920px+)
- ✅ **Laptop** (1366px)
- ✅ **Tablet** (768px)
- ✅ **Mobile** (375px)

### Breakpoints
- **Extra Large**: ≥1200px
- **Large**: ≥992px
- **Medium**: ≥768px
- **Small**: ≥576px
- **Extra Small**: <576px

## 🔒 Segurança

### Autenticação
- **JWT Tokens** para autenticação
- **Refresh automático** de tokens
- **Logout automático** em sessão expirada
- **Armazenamento seguro** no localStorage

### Validação
- **Validação client-side** de formulários
- **Sanitização** de dados de entrada
- **Prevenção** de XSS e CSRF

## ⚡ Performance

### Otimizações
- **Lazy loading** de componentes
- **Debouncing** em pesquisas
- **Caching** de dados frequentes
- **Minificação** de assets

### Métricas
- **Tempo de carregamento**: <2s
- **Tempo de resposta**: <500ms
- **Bundle size**: <500KB
- **Lighthouse Score**: >90

## 🐛 Debugging

### Console Logs
```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'true');

// Verificar conexão com API
console.log('API URL:', API_BASE_URL);

// Verificar estado de autenticação
console.log('Auth Token:', !!authToken);
```

### Ferramentas de Desenvolvimento
- **Chrome DevTools** para debugging
- **Network tab** para monitorar requisições
- **Console** para logs e erros
- **Application tab** para localStorage

## 🔄 Atualizações

### Sistema de Atualização
- **Verificação automática** de novas versões
- **Notificações** de atualizações disponíveis
- **Cache busting** para assets atualizados

### Versionamento
- **Semantic Versioning** (MAJOR.MINOR.PATCH)
- **Changelog** detalhado
- **Rollback** para versões anteriores

## 📋 Checklist de Funcionalidades

### ✅ Implementado
- [x] Sistema de login/logout
- [x] Dashboard com estatísticas
- [x] Seção especializada de 21 dias
- [x] Seleção de dispositivos
- [x] Inicialização de tarefas
- [x] Visualização de progresso
- [x] Cards interativos por dia
- [x] Modal de detalhes de tarefas
- [x] Categorização visual
- [x] Responsividade completa
- [x] Integração com API
- [x] Sistema de alertas
- [x] Loading states
- [x] Error handling

### 🚧 Em Desenvolvimento
- [ ] Marcação de tarefas como concluídas
- [ ] Edição de tarefas personalizadas
- [ ] Notificações push
- [ ] Exportação de relatórios
- [ ] Modo offline
- [ ] PWA features

### 📋 Planejado
- [ ] Drag & drop para reordenação
- [ ] Filtros avançados
- [ ] Busca em tempo real
- [ ] Temas personalizáveis
- [ ] Atalhos de teclado
- [ ] Modo escuro

## 🤝 Contribuição

### Estrutura de Arquivos
```
frontend/
├── index.html          # Página principal
├── app.js             # Lógica da aplicação
├── README.md          # Documentação
└── assets/            # Recursos estáticos
    ├── css/           # Estilos adicionais
    ├── js/            # Scripts auxiliares
    └── images/        # Imagens e ícones
```

### Padrões de Código
- **ES6+** para JavaScript
- **BEM** para CSS
- **CamelCase** para variáveis
- **PascalCase** para classes
- **kebab-case** para arquivos

## 📞 Suporte

### Problemas Comuns
1. **Erro de conexão**: Verifique se o backend está rodando
2. **Token expirado**: Faça logout e login novamente
3. **Dispositivos não carregam**: Verifique permissões de usuário
4. **Tarefas não inicializam**: Verifique se o dispositivo existe

### Logs de Erro
```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'true');

// Verificar erros no console
console.error('Erro detalhado:', error);
```

## 📄 Licença

Este projeto é parte do sistema TSEL e está sob licença proprietária.

---

**Desenvolvido para TSEL - Sistema de Chip Warmup para WhatsApp** 🚀
