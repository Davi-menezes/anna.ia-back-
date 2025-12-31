import { body } from 'express-validator';

export const registerSchema = [
  body('name')
    .trim()
    .notEmpty().withMessage('O nome é obrigatório')
    .isLength({ min: 2, max: 50 }).withMessage('O nome deve ter entre 2 e 50 caracteres'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('O e-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
    
  body('password')
    .notEmpty().withMessage('A senha é obrigatória')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula')
    .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula')
    .matches(/\d/).withMessage('A senha deve conter pelo menos um número')
    .matches(/[^a-zA-Z\d]/).withMessage('A senha deve conter pelo menos um caractere especial')
];

export const loginSchema = [
  body('email')
    .trim()
    .notEmpty().withMessage('O e-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
    
  body('password')
    .notEmpty().withMessage('A senha é obrigatória')
];

export const emailSchema = [
  body('email')
    .trim()
    .notEmpty().withMessage('O e-mail é obrigatório')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail()
];

export const resetPasswordSchema = [
  body('password')
    .notEmpty().withMessage('A senha é obrigatória')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula')
    .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula')
    .matches(/\d/).withMessage('A senha deve conter pelo menos um número')
    .matches(/[^a-zA-Z\d]/).withMessage('A senha deve conter pelo menos um caractere especial'),
    
  body('confirmPassword')
    .notEmpty().withMessage('A confirmação de senha é obrigatória')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('As senhas não conferem');
      }
      return true;
    })
];
