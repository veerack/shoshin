import { _f } from './_e';

// Type declaration for google.accounts.id
declare namespace google.accounts.id {
    interface InitializeConfig {
        client_id: string;
        callback: (response: CredentialResponse) => void;
    }

    interface CredentialResponse {
        credential: string;
    }

    function initialize(config: InitializeConfig): void;
}

export function handleCredentialResponse(response: google.accounts.id.CredentialResponse): void {
    console.log("Encoded JWT ID token: " + response.credential);
    // Handle the response. You can send the token to your backend for verification and user login.
}

window.onload = async function (): Promise<void> {
    try {
        let _i = await _f('google_client_id');
        google.accounts.id.initialize({
            client_id: _i,
            callback: handleCredentialResponse
        });
    } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
    }
};