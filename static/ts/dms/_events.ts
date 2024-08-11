import chalk from "chalk";
import { getSocket, initializeSocket } from "../socket/_connector";
import { getCurrentTime } from "../utils/_time";
import { renderMessage } from "../utils/_elements";
import { Payload, RenderPayload } from "../interfaces";

let isReplying = false;

export async function init() {

    await initializeSocket();

    const socket = getSocket();

    const DMsSidebarItems = document.querySelectorAll('._sho-DMsSidebarUserElement');

    DMsSidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Get the username and avatar within the clicked div
            const usernameElement = item.querySelector('#_sho-DMsUsername') as HTMLElement;
            const avatarElement = item.querySelector('#_sho-DMsAvatar') as HTMLImageElement;
            const uidElement = item.querySelector('#_sho-DMsUid') as HTMLElement;

            const username = usernameElement.textContent as string;
            const avatarSrc = avatarElement.src as string;
            const uid = uidElement.textContent as string;

            // Update the chat box
            const chatBox = document.querySelector('#_sho-chatBox') as HTMLElement;
            const chatMessages = document.getElementById('chatMessages') as HTMLElement;
            const chatBoxPlaceholder = document.querySelector('#_sho-DMsPlaceholder') as HTMLElement;
            const chatBoxTextArea = document.getElementById('chatTextAreaDiv') as HTMLElement;
            const chatBoxUserAvatar = document.querySelector('#_sho-chatBoxUserAvatar') as HTMLImageElement;
            const chatBoxUserUsername = document.querySelector('#_sho-chatBoxUserUsername') as HTMLElement;
            const chatBoxFirstSeenAvatar = document.querySelector('#_sho-chatBoxFirstSeenAvatar') as HTMLImageElement;
            const chatBoxFirstSeenName = document.querySelector('#_sho-chatBoxFirstSeenName') as HTMLElement;
            const chatBoxFirstSeenUid = document.querySelector('#_sho-chatBoxFirstSeenUid') as HTMLElement;

            const currentUserAvatar = document.querySelector('#_sho-loggedInUserAvatar') as HTMLImageElement;
            const currentUserName = document.querySelector('#_sho-loggedInUserName') as HTMLElement;

            // Remove the 'hidden' class from the chat box and apply it to the placeholder
            chatBox.classList.remove('hidden');
            chatBoxPlaceholder.classList.add('hidden');
            chatBoxTextArea.classList.remove('hidden');

            // Update the chat box avatar and username
            chatBoxUserAvatar.src = avatarSrc;
            chatBoxUserUsername.textContent = username;
            chatBoxFirstSeenAvatar.src = avatarSrc;
            chatBoxFirstSeenName.textContent = username;
            chatBoxFirstSeenUid.textContent = uid;

            console.log('DM clicked:', username);

            fetch(`/api/messages/${uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
            }})
            .then(response => response.json())
                .then(data => {
                    console.log(
                        chalk.magenta(`[FETCH] `) + 
                        `Fetched messages for ${uid} at url https://beta.shoshin.moe/api/messages/${uid} ` + 
                        chalk.green('|Success|'), 
                        data
                    );

                    chatMessages.innerHTML = '';

                    data.forEach((message: any) => {
                        if (message.sender_uid === uid) {
                            let chatBoxMessageHTML = renderMessage(message, 'message_out');
                            chatMessages.insertAdjacentHTML('beforeend', chatBoxMessageHTML);
                        } else {
                            let chatBoxMessageHTML = renderMessage(message, 'message_in');
                            chatMessages.insertAdjacentHTML('beforeend', chatBoxMessageHTML);
                        };
                        initMessageOptions();
                    });
                });

            if (socket) {
                const textarea = document.getElementById('chatTextarea') as HTMLTextAreaElement;
        
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                textarea.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' ) {
                        if (event.shiftKey) {
                            // Allow Shift+Enter to create a new line
                            const cursorPosition = textarea.selectionStart;
                            textarea.value = textarea.value.substring(0, cursorPosition) + '\n' + textarea.value.substring(cursorPosition);
                            textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1; // Move the cursor after the new line
                            autoResize();  // Resize the textarea to reflect the new line
                            return event.preventDefault();  // Prevent the default action
                        };

                        event.preventDefault();  // Prevents the default action of Enter key which is to create a new line
                
                        const message = textarea.value.trim();  // Get the content of the textarea
                
                        if (message) {
                            const currentTime = getCurrentTime(); // Get the current time
                
                            const payload: Payload = {
                                message: message,
                                recipient_uid: uid,
                                timezone: userTimezone,  // Send the timezone with the message
                            };

                            if (isReplying) {
                                const replyTo = document.getElementById('_sho-upperAreaMessageContent') as HTMLElement;
                                const replyToContent = replyTo.textContent;
                                const replyToAuthor = document.getElementById('_sho-upperAreaMessageAuthor') as HTMLElement;
                                const replyToAuthorContent = replyToAuthor.textContent;
                                payload.reply_to = {
                                    message: replyToContent,
                                    author: replyToAuthorContent?.replace('Replying to ', '') as string
                                };
                            };

                            // Send the message along with the user's timezone to the server
                            socket.emit('message', JSON.stringify(payload));  
                
                            textarea.value = '';  // Clear the textarea
                            autoResize();  // Reset the height of the textarea

                            const renderpayload: RenderPayload = {
                                message: message,
                                sent_at: currentTime,
                                avatar_url: currentUserAvatar.src,
                                username: currentUserName.textContent
                            };

                            if (isReplying) {
                                renderpayload.reply_to = {
                                    message: payload.reply_to.message,
                                    author: payload.reply_to.author,
                                };
                            }

                            let chatBoxMessageHTML = renderMessage(renderpayload, 'message_out');
                            chatMessages.insertAdjacentHTML('beforeend', chatBoxMessageHTML);
                
                            // Scroll to the bottom of the chat
                            chatBox.scrollTop = chatBox.scrollHeight;
                            isReplying = false;
                            cleanAreaHolder();
                            initMessageOptions();
                        }
                    }
                });
            }
        });
    });

    const initMessageOptions = () => {
        document.querySelectorAll('.group\\/message').forEach((messageElement) => {
            const replyButton = messageElement.querySelector('.bi-arrow-return-left');
            const closeHolder = document.getElementById('_sho-closeAreaHolder') as HTMLElement;

            const message = messageElement.querySelector('.text-wrap')?.textContent as string;
            const recipientName = messageElement.querySelector('#_sho-messageAuthorName')?.textContent as string;
            const areaHolderMessage = document.getElementById('_sho-upperAreaHolderReply') as HTMLElement;
            const areaHolderAuthor = document.getElementById('_sho-upperAreaMessageAuthor') as HTMLElement;
            const areaHolderMessageContent = document.getElementById('_sho-upperAreaMessageContent') as HTMLElement;

            replyButton?.addEventListener('click', () => {

                areaHolderMessage.classList.remove('hidden');
                areaHolderAuthor.innerHTML = 'Replying to ' + `<a class='font-bold text-orange-500'>${recipientName}</a>`;
                areaHolderMessageContent.textContent = message;

                const textarea = document.getElementById('chatTextarea') as HTMLTextAreaElement;
                textarea.focus();
                autoResize();
                isReplying = true;
            });

            closeHolder?.addEventListener('click', () => {
                cleanAreaHolder();
            });
        });
    };

    function cleanAreaHolder() {
        const areaHolderMessage = document.getElementById('_sho-upperAreaHolderReply') as HTMLElement;
        const areaHolderAuthor = document.getElementById('_sho-upperAreaMessageAuthor') as HTMLElement;
        const areaHolderMessageContent = document.getElementById('_sho-upperAreaMessageContent') as HTMLElement;

        areaHolderAuthor.innerHTML = '';
        areaHolderMessageContent.textContent = '';
        areaHolderMessage.classList.add('hidden');
        isReplying = false;
        return;
    }

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

    // Attach event listener to automatically resize on input and when the Enter key is pressed
    textarea.addEventListener('input', autoResize);
}