const { body, param, query, validationResult } = require('express-validator');

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validações para autenticação
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Nome de usuário deve ter entre 3 e 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nome de usuário deve conter apenas letras, números e underscore'),
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  body('role')
    .optional()
    .isIn(['admin', 'user', 'device'])
    .withMessage('Role deve ser admin, user ou device'),
  handleValidationErrors
];

// Validações para usuários
const userValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Nome de usuário deve ter entre 3 e 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nome de usuário deve conter apenas letras, números e underscore'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'user', 'device'])
    .withMessage('Role deve ser admin, user ou device'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active deve ser true ou false'),
  handleValidationErrors
];

const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

// Validações para dispositivos
const deviceValidation = [
  body('device_id')
    .isLength({ min: 1, max: 100 })
    .withMessage('Device ID deve ter entre 1 e 100 caracteres'),
  body('device_name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome do dispositivo deve ter entre 1 e 100 caracteres'),
  body('model')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Modelo deve ter no máximo 100 caracteres'),
  body('android_version')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Versão do Android deve ter no máximo 20 caracteres'),
  body('whatsapp_version')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Versão do WhatsApp deve ter no máximo 20 caracteres'),
  body('battery_level')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Nível da bateria deve ser entre 0 e 100'),
  body('battery_charging')
    .optional()
    .isBoolean()
    .withMessage('battery_charging deve ser true ou false'),
  body('wifi_connected')
    .optional()
    .isBoolean()
    .withMessage('wifi_connected deve ser true ou false'),
  body('mobile_data')
    .optional()
    .isBoolean()
    .withMessage('mobile_data deve ser true ou false'),
  body('ip_address')
    .optional()
    .isIP()
    .withMessage('Endereço IP deve ser válido'),
  body('mac_address')
    .optional()
    .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
    .withMessage('Endereço MAC deve ser válido'),
  handleValidationErrors
];

const deviceIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

// Validações para tarefas
const taskValidation = [
  body('device_id')
    .isInt({ min: 1 })
    .withMessage('Device ID deve ser um número inteiro positivo'),
  body('type')
    .isIn(['whatsapp_message', 'whatsapp_media', 'follow_up', 'custom'])
    .withMessage('Tipo deve ser whatsapp_message, whatsapp_media, follow_up ou custom'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridade deve ser low, normal, high ou urgent'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parâmetros devem ser um objeto'),
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Data agendada deve ser uma data válida'),
  body('estimated_duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duração estimada deve ser um número inteiro positivo'),
  body('max_retries')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Máximo de tentativas deve ser entre 0 e 10'),
  handleValidationErrors
];

const taskIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

// Validações para conteúdo
const contentValidation = [
  body('task_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Task ID deve ser um número inteiro positivo'),
  body('device_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Device ID deve ser um número inteiro positivo'),
  body('whatsapp_number')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Número do WhatsApp deve ser válido'),
  body('content_type')
    .isIn(['audio', 'video', 'image', 'document', 'message'])
    .withMessage('Tipo de conteúdo deve ser audio, video, image, document ou message'),
  body('action')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ação deve ter no máximo 50 caracteres'),
  body('file_name')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Nome do arquivo deve ter no máximo 255 caracteres'),
  body('file_size')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tamanho do arquivo deve ser um número inteiro positivo'),
  body('mime_type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tipo MIME deve ter no máximo 100 caracteres'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duração deve ser um número inteiro positivo'),
  body('message_content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Conteúdo da mensagem deve ter no máximo 10000 caracteres'),
  body('content_rating')
    .optional()
    .isIn(['safe', 'sensitive', 'inappropriate', 'spam'])
    .withMessage('Rating deve ser safe, sensitive, inappropriate ou spam'),
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('is_private deve ser true ou false'),
  body('access_level')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Nível de acesso deve ser public, private ou restricted'),
  handleValidationErrors
];

const contentIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

// Validações para configurações
const settingValidation = [
  body('key')
    .isLength({ min: 1, max: 100 })
    .withMessage('Chave deve ter entre 1 e 100 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Chave deve conter apenas letras, números e underscore'),
  body('value')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Valor deve ter no máximo 10000 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  handleValidationErrors
];

const settingKeyValidation = [
  param('key')
    .isLength({ min: 1, max: 100 })
    .withMessage('Chave deve ter entre 1 e 100 caracteres'),
  handleValidationErrors
];

// Validações para notificações
const notificationValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('User ID deve ser um número inteiro positivo'),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter entre 1 e 200 caracteres'),
  body('message')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Mensagem deve ter entre 1 e 10000 caracteres'),
  body('type')
    .optional()
    .isIn(['info', 'warning', 'error', 'success'])
    .withMessage('Tipo deve ser info, warning, error ou success'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Dados devem ser um objeto'),
  handleValidationErrors
];

const notificationIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

// Validações para paginação
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  handleValidationErrors
];

// Validações para filtros de data
const dateFilterValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data inicial deve ser uma data válida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data final deve ser uma data válida'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  loginValidation,
  registerValidation,
  userValidation,
  userIdValidation,
  deviceValidation,
  deviceIdValidation,
  taskValidation,
  taskIdValidation,
  contentValidation,
  contentIdValidation,
  settingValidation,
  settingKeyValidation,
  notificationValidation,
  notificationIdValidation,
  paginationValidation,
  dateFilterValidation
};
