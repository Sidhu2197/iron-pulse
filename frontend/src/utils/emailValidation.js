// Email validation utility
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { isValid: false, message: 'Email is required' };
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, message: 'Please enter a valid email format (e.g., user@domain.com)' };
    }

    // More specific validation
    const emailParts = email.trim().split('@');
    if (emailParts.length !== 2) {
        return { isValid: false, message: 'Email must contain exactly one @ symbol' };
    }

    const [localPart, domain] = emailParts;

    // Local part validation
    if (localPart.length === 0 || localPart.length > 64) {
        return { isValid: false, message: 'Email username is too long or empty' };
    }

    // Domain validation
    if (domain.length === 0 || domain.length > 253) {
        return { isValid: false, message: 'Email domain is invalid' };
    }

    // Check for consecutive dots
    if (email.includes('..')) {
        return { isValid: false, message: 'Email cannot contain consecutive dots' };
    }

    // Check for valid characters
    const validCharsRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!validCharsRegex.test(email.trim())) {
        return { isValid: false, message: 'Email contains invalid characters' };
    }

    return { isValid: true, message: '' };
};

// Real-time email validation feedback
export const getEmailValidationStatus = (email) => {
    const validation = validateEmail(email);
    
    if (!email) {
        return { status: 'empty', message: '' };
    }
    
    if (!validation.isValid) {
        return { status: 'invalid', message: validation.message };
    }
    
    return { status: 'valid', message: 'Valid email format' };
};
