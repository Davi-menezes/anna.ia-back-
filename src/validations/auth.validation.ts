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

  body('password', 'A senha informada não atende aos critérios de segurança.')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.')
    .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula.')
    .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
    .matches(/\d/).withMessage('A senha deve conter pelo menos um número.')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('A senha deve conter pelo menos um caractere especial.')
    .custom((value: string) => {
      const invalidChars = /[^A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      if (invalidChars.test(value)) {
        throw new Error('A senha contém caracteres inválidos.');
      }
      return true;
    }),

  body('terms')
    .custom((value: any) => {
      // Aceitar boolean true ou string "true"
      if (value !== true && value !== 'true' && value !== 1 && value !== '1') {
        throw new Error('Você deve ler e concordar com os Termos de Uso.');
      }
      return true;
    })
    .optional({ nullable: false }),

  body('birthDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Data de nascimento inválida'),

  body('education')
    .optional({ checkFalsy: true })
    .isString().withMessage('Escolaridade inválida'),

  body('location')
    .optional({ checkFalsy: true })
    .isString().withMessage('Localização inválida'),

  body('mainGoal')
    .optional({ checkFalsy: true })
    .isString().withMessage('Objetivo principal inválido')
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
  body('password', 'A senha informada não atende aos critérios de segurança.')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.')
    .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula.')
    .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
    .matches(/\d/).withMessage('A senha deve conter pelo menos um número.')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('A senha deve conter pelo menos um caractere especial.')
    .custom((value: string) => {
      const invalidChars = /[^A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      if (invalidChars.test(value)) {
        throw new Error('A senha contém caracteres inválidos.');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty().withMessage('A confirmação de senha é obrigatória')
    .custom((value: string, { req }: { req: any }) => {
      if (value !== req.body.password) {
        throw new Error('As senhas não conferem');
      }
      return true;
    })
];
