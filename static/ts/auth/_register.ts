import { _px, _pl } from './_proxy';
import { _pvc_v } from './_pvc';
import { _f } from './_e';

interface FetchResponse {
    status: string;
    payload: any;
}

// Type declarations for external scripts
declare namespace grecaptcha {
    namespace enterprise {
        function ready(callback: () => void): void;
        function execute(siteKey: string, options: { action: string }): Promise<string>;
    }
}

export function RonClick(e: Event): void {
    e.preventDefault();
    grecaptcha.enterprise.ready(async () => {
        try {
            const _i = await _f('recaptcha_token');
            const token = await grecaptcha.enterprise.execute(_i, { action: '_sho_REGISTER_RECAPTCHA' });
            console.log(`[ReCaptcha] Analyzing registration request for potential bot activity...`);
            const response = await fetch(_px, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    token: token,
                    action: '_sho_REGISTER_RECAPTCHA'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to register');
            }

            const data: FetchResponse = await response.json();
            console.log(data);
            if (data.status === 'success') {
                console.log(`[ReCaptcha] Register request is not a bot.`);

                const registerButton = document.getElementById('_sho-register') as HTMLElement;
                if (registerButton) {
                    registerButton.innerHTML = '<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A8.001 8.001 0 0120.709 5.291L19.3 3.883A10.001 10.001 0 004.117 18.117l1.407-1.408z"></path></svg>';
                }

                const email = (document.getElementById('_sho-email-field') as HTMLInputElement).value;
                const password = (document.getElementById('_sho-password-field') as HTMLInputElement).value;
                const username = (document.getElementById('_sho-username-field') as HTMLInputElement).value;

                const response2 = await fetch(_pl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        action: "register"
                    })
                });

                if (!response2.ok) {
                    throw new Error('Failed to create account');
                }

                const data2: FetchResponse = await response2.json();
                console.log(data2);
                if (data2.status === 'success') {
                    console.log(`[Auth] Mail Verification successful.`);

                    const registerForm = document.getElementById('_sho-register-form') as HTMLElement;

                    if (registerForm) {
                        const children = registerForm.children;
                        for (let i = 0; i < children.length; i++) {
                            children[i].classList.add('hidden');
                        }

                        const headerOne = document.getElementById('_sho-register-formHeaderOne') as HTMLElement;
                        const headerTwo = document.getElementById('_sho-register-formHeaderTwo') as HTMLElement;
                        const topDiv = document.getElementById('_sho-register-TopFormDiv') as HTMLElement;

                        if (headerOne) {
                            headerOne.innerText = "Email Verification";
                            headerOne.classList.remove('hidden');
                        }

                        if (headerTwo) {
                            headerTwo.innerText = "We've sent a verification code to your email, copy and paste it below.";
                            headerTwo.classList.remove('hidden');
                        }

                        if (topDiv) {
                            topDiv.classList.remove('hidden');
                        }

                        const verificationDiv = document.createElement('div');
                        verificationDiv.classList.add('flex', 'flex-col', 'gap-2', 'px-8', 'mt-4');
                        verificationDiv.innerHTML = `
                            <p class="text-sm text-white">Verification Code <span class="text-red-600">*</span></p>
                            <div class="relative flex items-center">
                                <input id="_sho-code-field" type="text" class="w-full text-white py-1 text-lg border-b-4 bg-transparent focus:outline-none focus:border-purple-400 transition duration-75" />
                                <svg id="_sho-code-field-checkIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="green" class="hidden absolute right-2 bi bi-check-lg" viewBox="0 0 16 16">
                                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                                </svg>
                                <svg id="_sho-code-field-errorIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="red" class="hidden absolute right-2 bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                                </svg>
                            </div>
                            <p id="_sho-code-field-error" class="hidden text-red-600 text-xs mt-2">Please input a valid 6-digit code.</p>
                            <div class="flex flex-col items-center gap-4">
                                <div class="mt-4 w-36 md:w-48">
                                    <button id="_sho-code-verify" class="button-hover-effect w-full rounded-md px-4 py-2 text-white">Verify</button>
                                </div>
                            </div>
                        `;

                        registerForm.appendChild(verificationDiv);

                        document.getElementById('_sho-code-verify')!.addEventListener('click', function () {
                            const code = (document.getElementById('_sho-code-field') as HTMLInputElement).value;
                            _pvc_v(email, code, password, username, 'register');
                        });

                        const inputField = document.getElementById('_sho-code-field') as HTMLInputElement;
                        const checkIcon = document.getElementById('_sho-code-field-checkIcon') as HTMLElement;
                        const errorIcon = document.getElementById('_sho-code-field-errorIcon') as HTMLElement;
                        const errorMessage = document.getElementById('_sho-code-field-error') as HTMLElement;

                        if (inputField && checkIcon && errorIcon && errorMessage) {
                            inputField.addEventListener('blur', function () {
                                const value = inputField.value;

                                if (value.length === 6) {
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
                            });
                        }
                    }
                } else if (data2.status === 'error') {
                    console.log(`[Auth] Registration failed: ${data2.payload}`);
                    registerButton.innerHTML = 'Create Account';

                    const errorBanner = document.getElementById('_sho-register-errorBannerTop') as HTMLElement;
                    const errorMessage = document.getElementById('_sho-register-errorBannerTop-text') as HTMLElement;

                    errorBanner.classList.remove('hidden');
                    errorMessage.innerText = data2.payload;

                    void errorBanner.offsetWidth;

                    errorBanner.classList.remove('-translate-y-full');
                    errorBanner.classList.add('translate-y-0');

                    const errorBannerClose = document.getElementById('_sho-register-errorBannerTop-close');
                    if (errorBannerClose) {
                        errorBannerClose.addEventListener('click', function () {
                            const errorBanner = document.getElementById('_sho-register-errorBannerTop') as HTMLElement;
                            errorBanner.classList.add('-translate-y-full');
                            setTimeout(() => {
                                errorBanner.classList.add('hidden');
                            }, 250);
                        });
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    });
}