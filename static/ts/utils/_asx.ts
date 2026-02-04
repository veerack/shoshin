import { getCookie } from "../_cookie_manager";

export {};

// Utility function to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Function to handle file upload
const handleFileUpload = async (fileInput: HTMLInputElement, type: 'avatar' | 'banner') => {
    const file = fileInput.files?.[0];
    if (!file) return;

    // Get the session token from cookies
    const uidToken = await getCookie('_sho-session');
    if (!uidToken) {
        console.error('Session token not found');
        return;
    }

    console.log('Uploading file:', file, 'Type:', type, 'Session token:', uidToken);

    // Select the elements based on the type (avatar or banner)
    const imageElement = document.getElementById(`${type}Image`) as HTMLImageElement;
    const textElement = document.getElementById(`${type}Text`) as HTMLElement;

    // Store the original text content
    const originalText = textElement.textContent;

    // Set image opacity to 50% and show the loading spinner with the status text
    imageElement.classList.add('opacity-50'); // Apply Tailwind class for opacity
    textElement.innerHTML = `
        <div role="status">
            <svg aria-hidden="true" class="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span class="sr-only">Loading...</span>
        </div>
    `;
    textElement.classList.remove('hidden');

    try {
        const base64File = await fileToBase64(file);
        const response = await fetch('/api/assets/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: uidToken,
                type: type,
                file: base64File,
            }),
        });

        const data = await response.json();

        if (data.status === true) {
            // Update the avatar or banner image
            imageElement.src = base64File;

            textElement.textContent = data.payload.message || 'Upload successful';
        } else {
            textElement.textContent = data.payload.message || 'Error uploading file';
        }

        // Revert back to "Edit x" after 2 seconds, reset image opacity
        setTimeout(() => {
            imageElement.classList.remove('opacity-50'); // Reset opacity
            textElement.textContent = originalText;
            textElement.classList.add('hidden');
        }, 2000);
    } catch (error) {
        console.error('Error uploading file:', error);
        textElement.textContent = 'Error uploading file';
        setTimeout(() => {
            imageElement.classList.remove('opacity-50'); // Reset opacity
            textElement.textContent = originalText;
            textElement.classList.add('hidden');
        }, 2000);
    }
};

// Add event listeners to file inputs
document.getElementById('avatarUploader')?.addEventListener('change', (event) => {
    handleFileUpload(event.target as HTMLInputElement, 'avatar');
});

document.getElementById('bannerUploader')?.addEventListener('change', (event) => {
    handleFileUpload(event.target as HTMLInputElement, 'banner');
});