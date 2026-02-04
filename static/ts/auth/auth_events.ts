import { RonClick } from './_register';
import { LonClick } from './_login';
import { _ } from '../utils/_err';

// Interface for field validation
interface Field {
    id: string;
    regex: RegExp;
    checkIconId: string;
    errorIconId: string;
    errorMessageId: string;
    errorMessage: string;
    validate_url?: string;
}

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('_sho-login');
    const registerButton = document.getElementById('_sho-register') as HTMLButtonElement;

    if (loginButton) {
        loginButton.addEventListener('click', LonClick);
    }

    if (registerButton) {
        registerButton.addEventListener('click', RonClick);
    }

    const fields: Field[] = [
        {
            id: '_sho-email-field',
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            checkIconId: '_sho-email-field-checkIcon',
            errorIconId: '_sho-email-field-errorIcon',
            errorMessageId: '_sho-email-field-error',
            errorMessage: 'Invalid email address.'
        },
        {
            id: '_sho-password-field',
            regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/,
            checkIconId: '_sho-password-field-checkIcon',
            errorIconId: '_sho-password-field-errorIcon',
            errorMessageId: '_sho-password-field-error',
            errorMessage: 'Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, and one special character.'
        },
        {
            id: '_sho-uid-field',
            regex: /^\d{9}$/,
            checkIconId: '_sho-uid-field-checkIcon',
            errorIconId: '_sho-uid-field-errorIcon',
            errorMessageId: '_sho-uid-field-error',
            errorMessage: 'In-Game UID must be exactly 9 digits long.'
        },
        {
            id: '_sho-username-field',
            regex: /^[a-zA-Z0-9_]{3,16}$/,
            checkIconId: '_sho-username-field-checkIcon',
            errorIconId: '_sho-username-field-errorIcon',
            errorMessageId: '_sho-username-field-error',
            errorMessage: 'Username must be between 3 and 16 characters long, and contain only letters, numbers, and underscores.',
            validate_url: 'https://beta.shoshin.moe/api/username/availability'
        }
    ];

    fields.forEach(field => {
        const inputField = document.getElementById(field.id) as HTMLInputElement;
        const checkIcon = document.getElementById(field.checkIconId) as HTMLElement;
        const errorIcon = document.getElementById(field.errorIconId) as HTMLElement;
        const errorMessage = document.getElementById(field.errorMessageId) as HTMLElement;

        if (inputField && checkIcon && errorIcon && errorMessage) {
            inputField.addEventListener('blur', function() {
                const value = inputField.value;

                if (field.regex.test(value)) {
                    if (!field.validate_url) {
                        checkIcon.classList.remove('hidden');
                        errorIcon.classList.add('hidden');
                        errorMessage.classList.add('hidden');
                        inputField.classList.add('border-green-400');
                        inputField.classList.remove('border-red-400');
                    } else {
                        fetch(field.validate_url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ username: value })
                        }).then(response => {
                            if (response.ok) {
                                return response.json();
                            }
                            throw new Error('Failed to validate field');
                        }).then(data => {
                            if (data.result === true) {
                                checkIcon.classList.remove('hidden');
                                errorIcon.classList.add('hidden');
                                errorMessage.classList.add('hidden');
                                inputField.classList.add('border-green-400');
                                inputField.classList.remove('border-red-400');
                            } else {
                                checkIcon.classList.add('hidden');
                                errorIcon.classList.remove('hidden');
                                errorMessage.classList.remove('hidden');
                                inputField.classList.add('border-red-400');
                                inputField.classList.remove('border-green-400');
                            }
                        }).catch(error => {
                            console.error(error);
                        });
                    }
                } else {
                    checkIcon.classList.add('hidden');
                    errorIcon.classList.remove('hidden');
                    errorMessage.classList.remove('hidden');
                    inputField.classList.add('border-red-400');
                    inputField.classList.remove('border-green-400');
                }
            });
        } else {
            _._(0, { action: 'Field validation failed.', field: field.id }, 'auth');
        }
    });
});