import Joi from 'joi';

export const registerValidation = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .normalize()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
    
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    
    name: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'Name is required',
            'any.required': 'Name is required'
        }),
    
    phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        })
        .optional(),
    
    role: Joi.string()
        .valid('customer', 'admin', 'superadmin')
        .default('customer')
        .messages({
            'any.only': 'Role must be one of: customer, admin, superadmin'
        }),
    
    // Additional fields you might need
    recoveryEmail: Joi.string()
        .email()
        .messages({
            'string.email': 'Please provide a valid recovery email'
        })
        .optional(),
    
    hint: Joi.string()
        .max(100)
        .optional(),
    
    securityQuestion: Joi.string()
        .optional(),
    
    securityAnswer: Joi.string()
        .optional(),
    
    // For social login
    googleId: Joi.string()
        .optional(),
    
    twoFactorEnabled: Joi.boolean()
        .default(false)
});

export const loginValidation = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .normalize()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    
    // Optional device information
    deviceId: Joi.string()
        .optional(),
    
    ipAddress: Joi.string()
        .ip()
        .optional(),
    
    userAgent: Joi.string()
        .optional()
});

export const changePasswordValidation = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Current password is required',
            'any.required': 'Current password is required'
        }),
    
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'New password must be at least 6 characters long',
            'string.empty': 'New password is required',
            'any.required': 'New password is required'
        }),
    
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Please confirm your password'
        })
});

export const requestPasswordResetValidation = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .normalize()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        })
});

export const resetPasswordValidation = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'string.empty': 'Reset token is required',
            'any.required': 'Reset token is required'
        }),
    
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Please confirm your password'
        })
});

export const updateProfileValidation = Joi.object({
    name: Joi.string()
        .trim()
        .optional(),
    
    phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        })
        .optional(),
    
    recoveryEmail: Joi.string()
        .email()
        .messages({
            'string.email': 'Please provide a valid recovery email'
        })
        .optional(),
    
    hint: Joi.string()
        .max(100)
        .optional()
});

export const updateSecurityQuestionValidation = Joi.object({
    securityQuestion: Joi.string()
        .required()
        .messages({
            'string.empty': 'Security question is required',
            'any.required': 'Security question is required'
        }),
    
    securityAnswer: Joi.string()
        .required()
        .messages({
            'string.empty': 'Security answer is required',
            'any.required': 'Security answer is required'
        })
});

// Strict validation for admin updates
export const adminUpdateUserValidation = Joi.object({
    email: Joi.string()
        .email()
        .normalize()
        .optional(),
    
    role: Joi.string()
        .valid('customer', 'admin', 'superadmin')
        .optional(),
    
    status: Joi.string()
        .valid('active', 'idle', 'offline')
        .optional(),
    
    verified: Joi.boolean()
        .optional(),
    
    isActive: Joi.boolean()
        .optional(),
    
    twoFactorEnabled: Joi.boolean()
        .optional()
});

// Validation for login history query
export const loginHistoryQueryValidation = Joi.object({
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
});