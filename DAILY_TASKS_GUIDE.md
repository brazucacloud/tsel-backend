# 📋 Sistema de Tarefas de 21 Dias - TSEL Backend

## 🎯 Visão Geral

O sistema de tarefas de 21 dias é uma funcionalidade completa para gerenciar o processo de warmup de chips WhatsApp, seguindo diretrizes específicas para cada dia. O sistema permite:

- ✅ Inicializar tarefas automaticamente para dispositivos
- ✅ Acompanhar progresso diário
- ✅ Marcar tarefas como concluídas
- ✅ Visualizar estatísticas de progresso
- ✅ Gerenciar tarefas personalizadas

## 🚀 Como Usar

### 1. Inicializar Tarefas para um Dispositivo

```bash
POST /api/daily-tasks/initialize/:deviceId
```

**Exemplo:**
```bash
curl -X POST http://localhost:3001/api/daily-tasks/initialize/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Tarefas de 21 dias inicializadas com sucesso",
  "data": {
    "success": true,
    "message": "Tarefas inicializadas com sucesso"
  }
}
```

### 2. Listar Tarefas de um Dispositivo

```bash
GET /api/daily-tasks/device/:deviceId
```

**Parâmetros opcionais:**
- `day_number`: Filtrar por dia específico (1-21)
- `status`: Filtrar por status (pending, completed)
- `task_type`: Filtrar por tipo de tarefa

**Exemplo:**
```bash
curl -X GET "http://localhost:3001/api/daily-tasks/device/1?day_number=1&status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Listar Tarefas de um Dia Específico

```bash
GET /api/daily-tasks/device/:deviceId/day/:dayNumber
```

**Exemplo:**
```bash
curl -X GET http://localhost:3001/api/daily-tasks/device/1/day/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Marcar Tarefa como Concluída

```bash
PUT /api/daily-tasks/:taskId/complete
```

**Exemplo:**
```bash
curl -X PUT http://localhost:3001/api/daily-tasks/123/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Tarefa concluída com sucesso"}'
```

### 5. Ver Progresso Geral

```bash
GET /api/daily-tasks/progress/:deviceId
```

**Exemplo:**
```bash
curl -X GET http://localhost:3001/api/daily-tasks/progress/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "daily_progress": [
      {
        "day_number": 1,
        "total_tasks": 7,
        "completed_tasks": 5,
        "pending_tasks": 2,
        "completion_percentage": 71.43
      }
    ],
    "overall_stats": {
      "total_tasks": 147,
      "completed_tasks": 45,
      "pending_tasks": 102,
      "overall_percentage": 30.61
    }
  }
}
```

## 📊 Estrutura das Tarefas

### Categorias de Tarefas

- **profile**: Configuração de perfil
- **security**: Segurança e verificação
- **waiting**: Períodos de espera
- **groups**: Gerenciamento de grupos
- **messages**: Mensagens de texto
- **audio**: Áudios e chamadas de áudio
- **images**: Imagens e fotos
- **videos**: Vídeos
- **contacts**: Contatos e Vcards
- **calls**: Chamadas de voz e vídeo
- **stickers**: Figurinhas
- **emoji**: Emojis
- **documents**: Documentos e PDFs
- **conversations**: Conversas e arquivamento
- **status**: Status do WhatsApp

### Metadados das Tarefas

Cada tarefa possui metadados que incluem:

```json
{
  "category": "messages",
  "count": 5,
  "period": "morning",
  "duration": 10,
  "contacts": 36,
  "conversations": 2
}
```

## 🔧 Endpoints Disponíveis

### Tarefas
- `POST /api/daily-tasks/initialize/:deviceId` - Inicializar tarefas
- `GET /api/daily-tasks/device/:deviceId` - Listar tarefas do dispositivo
- `GET /api/daily-tasks/device/:deviceId/day/:dayNumber` - Tarefas de um dia
- `GET /api/daily-tasks/:id` - Buscar tarefa específica
- `POST /api/daily-tasks` - Criar tarefa personalizada
- `PUT /api/daily-tasks/:id` - Atualizar tarefa
- `PUT /api/daily-tasks/:id/complete` - Marcar como concluída
- `DELETE /api/daily-tasks/:id` - Deletar tarefa

### Progresso e Estatísticas
- `GET /api/daily-tasks/progress/:deviceId` - Estatísticas de progresso
- `GET /api/daily-tasks/templates` - Templates de tarefas padrão

### Gerenciamento
- `DELETE /api/daily-tasks/device/:deviceId/clear` - Limpar todas as tarefas

## 📋 Exemplos de Tarefas por Dia

### Dia 1 - Configuração Inicial
- Inserir foto de perfil (70% feminina, 30% masculina)
- Trocar metadados da imagem
- Configurar nome e sobrenome
- Adicionar descrição
- Ativar verificação de duas etapas
- Completar perfil
- Período de espera (24-48h)

### Dia 2 - Primeiras Interações
- Entrar em 2 grupos WhatsApp
- Receber mensagens (manhã e tarde)
- Receber áudios, imagens e vídeos
- Apagar mensagens em conversas

### Dia 3 - Interação Ativa
- Conversar com contatos
- Criar grupo com 3 pessoas
- Enviar áudios, figurinhas, emojis
- Postar status
- Fazer chamadas perdidas

## 🎯 Benefícios do Sistema

1. **Automatização**: Inicialização automática de todas as tarefas
2. **Acompanhamento**: Controle detalhado do progresso
3. **Flexibilidade**: Possibilidade de tarefas personalizadas
4. **Relatórios**: Estatísticas completas de progresso
5. **Organização**: Categorização por tipo e período
6. **Escalabilidade**: Suporte a múltiplos dispositivos

## 🔒 Segurança

- Todas as rotas requerem autenticação JWT
- Validação de dados em todas as operações
- Controle de acesso por dispositivo
- Logs de todas as operações

## 📈 Monitoramento

O sistema registra:
- Data de criação e conclusão das tarefas
- Notas e observações
- Metadados detalhados
- Estatísticas de progresso
- Histórico de alterações

## 🚀 Próximos Passos

1. Implementar notificações automáticas
2. Adicionar relatórios em PDF
3. Criar dashboard web
4. Integrar com WhatsApp Business API
5. Adicionar automação de tarefas

---

**Desenvolvido para TSEL - Sistema de Chip Warmup para WhatsApp**
