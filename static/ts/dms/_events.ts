export function init() {
    const DMsSidebarItems = document.querySelectorAll('._sho-DMsSidebarUserElement');

    DMsSidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Get the username and avatar within the clicked div
            const usernameElement = item.querySelector('#_sho-DMsUsername') as HTMLElement;
            const avatarElement = item.querySelector('#_sho-DMsAvatar') as HTMLImageElement;

            const username = usernameElement.textContent as string;
            const avatarSrc = avatarElement.src as string;

            // Update the chat box
            const chatBox = document.querySelector('#_sho-chatBox') as HTMLElement;
            const chatBoxPlaceholder = document.querySelector('#_sho-DMsPlaceholder') as HTMLElement;
            const chatBoxUserAvatar = document.querySelector('#_sho-chatBoxUserAvatar') as HTMLImageElement;
            const chatBoxUserUsername = document.querySelector('#_sho-chatBoxUserUsername') as HTMLElement;

            // Remove the 'hidden' class from the chat box and apply it to the placeholder
            chatBox.classList.remove('hidden');
            chatBoxPlaceholder.classList.add('hidden');

            // Update the chat box avatar and username
            chatBoxUserAvatar.src = avatarSrc;
            chatBoxUserUsername.textContent = username;

            console.log('DM clicked:', username);
        });
    });

    const textarea = document.getElementById('chatTextarea') as HTMLTextAreaElement;
    const maxLines = 7;
    const maxChars = 3000;

    const autoResize = () => {
        textarea.style.height = '24px'; // Reset height to one line
        const newHeight = textarea.scrollHeight;
        const lineHeight = 24; // Assuming 24px is the line height

        // Calculate the number of lines
        const numberOfLines = Math.floor(newHeight / lineHeight);

        // Enforce the maximum lines
        if (numberOfLines <= maxLines) {
            textarea.style.height = `${newHeight}px`;
        } else {
            textarea.style.height = `${maxLines * lineHeight}px`;
        }

        // Enforce the character limit
        if (textarea.value.length > maxChars) {
            textarea.value = textarea.value.substring(0, maxChars);
        }
    };

    // Set the initial height to one line
    textarea.style.height = '24px';

    // Attach event listener to automatically resize on input
    textarea.addEventListener('input', autoResize);
}