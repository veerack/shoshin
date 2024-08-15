export let isReplying: boolean = false;
export let currentActiveChatbox: string = '';
import twemoji from 'twemoji';
import emojiSearchTerms from './_emojis';

let currentSelectedBox = 'emoji';
let nextToken = ''; // This will hold the next pagination token
let searchTimeout: NodeJS.Timeout;

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobileMenuButton') as HTMLElement;
    const menuSidebar = document.getElementById('menuSidebar') as HTMLElement;
    const overlay = document.getElementById('overlay') as HTMLElement;

    if (mobileMenuButton && menuSidebar && overlay) {
        mobileMenuButton.addEventListener('click', function(event: MouseEvent) {
            menuSidebar.classList.add('translate-x-0');
            menuSidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        });

        overlay.addEventListener('click', function() {
            menuSidebar.classList.add('-translate-x-full');
            menuSidebar.classList.remove('translate-x-0');
            overlay.classList.add('hidden');
        });

        menuSidebar.addEventListener('click', function() {
            menuSidebar.classList.add('-translate-x-full');
            menuSidebar.classList.remove('translate-x-0');
            overlay.classList.add('hidden');
        });
    }
});

export const updateCurrentActiveChatbox = (uid: string) => {
    currentActiveChatbox = uid;
}

export function initEmoGIFs() {
    const emojiGifButton = document.querySelector('#emojiGifButton') as HTMLElement;
    const emojiTab = document.querySelector('#emojiTab') as HTMLButtonElement;
    const gifTab = document.querySelector('#gifTab') as HTMLButtonElement;
    const emojiContent = document.querySelector('#emojiContent') as HTMLElement;
    const gifContent = document.querySelector('#gifContent') as HTMLElement;
    const textarea = document.querySelector('#chatTextarea') as HTMLTextAreaElement;
    const emojiGifMenu = document.querySelector('#emojiGifMenu') as HTMLElement;
    const inputSearch = document.querySelector('#_sho-EmojiOrGIFSearch') as HTMLInputElement;

    const tenorApiKey = 'AIzaSyCD0oPZ18UHb_fhCw9DvwJXOfm5AnM_W1U';

    // Toggle Emoji/GIF menu
    emojiGifButton.addEventListener('click', () => {
        emojiGifMenu.classList.toggle('hidden');
        showEmojis(); // Show emojis by default when the menu opens
    });

    // Switch to Emoji tab
    emojiTab.addEventListener('click', () => {
        inputSearch.placeholder = 'Search the right emoji';
        currentSelectedBox = 'emoji';
        gifTab.classList.remove('bg-gray-500/30');
        emojiTab.classList.add('bg-gray-500/30');
        showEmojis();
    });

    // Switch to GIF tab
    gifTab.addEventListener('click', () => {
        inputSearch.placeholder = 'Search the right GIF';
        currentSelectedBox = 'gif';
        emojiTab.classList.remove('bg-gray-500/30');
        gifTab.classList.add('bg-gray-500/30');
        showGifs();
    });

    // Handle search input with a 0.5-second delay
    inputSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (currentSelectedBox === 'emoji') {
                searchEmojis(inputSearch.value);
            } else if (currentSelectedBox === 'gif') {
                searchGifs(inputSearch.value);
            }
        }, 500); // Reduced delay to 0.5 seconds
    });

    function showEmojis(): void {
        emojiContent.classList.remove('hidden');
        gifContent.classList.add('hidden');
        emojiContent.innerHTML = ''; // Clear any previous content

        // Render the full list of emojis using Twemoji
        Object.keys(emojiSearchTerms).forEach(term => {
            emojiSearchTerms[term].forEach(emoji => {
                const button = document.createElement('button');
                button.innerHTML = twemoji.parse(emoji, {
                    base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/', // Correct base URL
                    folder: '72x72', // Use 72x72 size and scale down with CSS
                    ext: '.png',
                });
                button.classList.add('emoji-button', 'cursor-pointer', 'p-1');

                // Add CSS to scale the image down to 24x24
                const img = button.querySelector('img');
                if (img) {
                    img.style.width = '24px';
                    img.style.height = '24px';
                }

                button.addEventListener('click', () => {
                    insertAtCursor(textarea, emoji);
                    emojiGifMenu.classList.add('hidden');
                });
                emojiContent.appendChild(button);
            });
        });
    }

    function searchEmojis(query: string): void {
        emojiContent.innerHTML = ''; // Clear previous emojis
        let filteredEmojis: string[] = [];
    
        // Convert query to lowercase for case-insensitive matching
        const lowerCaseQuery = query.toLowerCase();
    
        // Check for partial matches in emojiSearchTerms
        Object.keys(emojiSearchTerms).forEach(term => {
            if (term.includes(lowerCaseQuery)) {
                filteredEmojis = filteredEmojis.concat(emojiSearchTerms[term]);
            }
        });
    
        // If no match and query length is 3 or more, search directly within emoji strings
        if (filteredEmojis.length === 0 && lowerCaseQuery.length >= 3) {
            filteredEmojis = Object.values(emojiSearchTerms)
                .flat()
                .filter(emoji => emoji.includes(lowerCaseQuery));
        }
    
        // If still no match, return all emojis as fallback
        if (filteredEmojis.length === 0) {
            filteredEmojis = Object.values(emojiSearchTerms).flat();
        }
    
        // Render the filtered list of emojis using Twemoji
        filteredEmojis.forEach(emoji => {
            const button = document.createElement('button');
            button.innerHTML = twemoji.parse(emoji, {
                base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
                folder: '72x72',
                ext: '.png',
            });
            button.classList.add('emoji-button', 'cursor-pointer', 'p-1');
    
            const img = button.querySelector('img');
            if (img) {
                img.style.width = '24px';
                img.style.height = '24px';
            }
    
            button.addEventListener('click', () => {
                insertAtCursor(textarea, emoji);
                emojiGifMenu.classList.add('hidden');
            });
            emojiContent.appendChild(button);
        });
    }

    function showGifs(): void {
        emojiContent.classList.add('hidden');
        gifContent.classList.remove('hidden');
        gifContent.innerHTML = ''; // Clear previous GIFs
        nextToken = ''; // Reset the token when showing GIFs
        loadMoreGifs('funny'); // Initial load with a default search query
    }
    
    function searchGifs(query: string): void {
        gifContent.innerHTML = ''; // Clear previous GIFs
        nextToken = ''; // Reset the token for the new search
        if (query.length < 1) {
            loadMoreGifs('funny');
        } else {
            loadMoreGifs(query);
        };
    }

    function loadMoreGifs(searchQuery: string): void {
        let apiUrl = `https://tenor.googleapis.com/v2/search?q=${searchQuery}&key=${tenorApiKey}&limit=10`;
        if (nextToken) {
            apiUrl += `&pos=${nextToken}`;
        }

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                data.results.forEach((result: any) => {
                    const img = document.createElement('img');
                    img.src = result.media_formats.gif.url;
                    img.alt = 'GIF';
                    img.classList.add('gif-item', 'cursor-pointer', 'w-full');
                    img.style.height = '120px'; // Set a fixed height for all GIFs
                    img.style.objectFit = 'cover'; // Ensure the GIF fills the space without stretching
                    img.addEventListener('click', () => {
                        insertAtCursor(textarea, `${result.media_formats.gif.url}`);
                        // Trigger the Enter key event to send the message
                        const enterKeyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                        textarea.dispatchEvent(enterKeyEvent);

                        // Hide the menu after inserting the GIF
                        emojiGifMenu.classList.add('hidden');
                    });
                    gifContent.appendChild(img);
                });
                nextToken = data.next; // Store the next pagination token
            })
            .catch(error => console.error('Error fetching Tenor GIFs:', error));
    }

    // Infinite scrolling implementation
    gifContent.addEventListener('scroll', () => {
        if (gifContent.scrollTop + gifContent.clientHeight >= gifContent.scrollHeight) {
            if (currentSelectedBox === 'gif') {
                loadMoreGifs(inputSearch.value || 'funny'); // Fetch more GIFs when scrolled to bottom
            }
        }
    });

    // Function to insert content at the cursor position
    function insertAtCursor(input: HTMLTextAreaElement, textToInsert: string): void {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentText = input.value;

        input.value = currentText.substring(0, start) + textToInsert + currentText.substring(end);
        input.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        input.focus();
    }

    // Close the menu if clicking outside
    document.addEventListener('click', function(event: MouseEvent) {
        if (!emojiGifButton.contains(event.target as Node) && !emojiGifMenu.contains(event.target as Node)) {
            emojiGifMenu.classList.add('hidden');

            // Reset the default tab to Emoji and the search input placeholder text to 'Search the right emoji'
            currentSelectedBox = 'emoji';
            inputSearch.placeholder = 'Search the right emoji';
            emojiTab.classList.add('bg-gray-500/30');
            gifTab.classList.remove('bg-gray-500/30');
        }
    });
}

export const autoResize = () => {
    const textarea = document.getElementById('chatTextarea') as HTMLTextAreaElement;
    const maxLines = 7;
    const maxChars = 3000;
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

export function cleanAreaHolder() {
    const areaHolderMessage = document.getElementById('_sho-upperAreaHolderReply') as HTMLElement;
    const areaHolderAuthor = document.getElementById('_sho-upperAreaMessageAuthor') as HTMLElement;
    const areaHolderMessageContent = document.getElementById('_sho-upperAreaMessageContent') as HTMLElement;

    areaHolderAuthor.innerHTML = '';
    areaHolderMessageContent.textContent = '';
    areaHolderMessage.classList.add('hidden');
    isReplying = false;
    return;
}

export const initMessageOptions = () => {
    document.querySelectorAll('.group\\/message').forEach((messageElement) => {
        const replyButton = messageElement.querySelector('.bi-arrow-return-left');
        const closeHolder = document.getElementById('_sho-closeAreaHolder') as HTMLElement;

        const messageContentElement = messageElement.querySelector('#_sho-messageContent') as HTMLElement;
        const recipientName = messageElement.querySelector('#_sho-messageAuthorName')?.textContent as string;
        const areaHolderMessage = document.getElementById('_sho-upperAreaHolderReply') as HTMLElement;
        const areaHolderAuthor = document.getElementById('_sho-upperAreaMessageAuthor') as HTMLElement;
        const areaHolderMessageContent = document.getElementById('_sho-upperAreaMessageContent') as HTMLElement;

        replyButton?.addEventListener('click', () => {
            areaHolderMessage.classList.remove('hidden');
            areaHolderAuthor.innerHTML = 'Replying to ' + `<a class='font-bold text-orange-500'>${recipientName}</a>`;

            if (messageContentElement.querySelector('img')) {
                // If the message content contains an image
                const imgElement = messageContentElement.querySelector('img') as HTMLImageElement;
                if (imgElement) {
                    areaHolderMessageContent.innerHTML = `<img src="${imgElement.src}" alt="Image" class="max-w-full h-auto rounded-md">`;
                }
            } else {
                // If the message content is text
                areaHolderMessageContent.textContent = messageContentElement.textContent || '';
            }

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

export function renderMessage(message: any, type: string): string {
    
    function customMarkdownParser(text: string): string {
        const regex =
            /(\*\*(.*?)\*\*(?!\*))|(\*(?!\*)(.*?)\*)|(__(.*?)__)|(`(.*?)`)|(~~(.*?)~~)|(>(.*?)$)|((https?:\/\/[^\s]+))/gm;
        let match;
        let lastIndex = 0;
        let result = '';
    
        while ((match = regex.exec(text)) !== null) {
            // Add the text before the match as plain text
            if (match.index > lastIndex) {
                result += text.slice(lastIndex, match.index);
            }
    
            if (match[1]) { // Bold
                result += `<span class="font-bold">${customMarkdownParser(match[2])}</span>`;
            } else if (match[3]) { // Italic
                result += `<span class="italic">${customMarkdownParser(match[4])}</span>`;
            } else if (match[5]) { // Underline
                result += `<span class="underline underline-offset-2">${customMarkdownParser(match[6])}</span>`;
            } else if (match[7]) { // Code
                result += `<span class="bg-gray-600/75 text-white p-1 rounded-md">${customMarkdownParser(match[8])}</span>`;
            } else if (match[9]) { // Strikethrough
                result += `<span class="line-through">${customMarkdownParser(match[10])}</span>`;
            } else if (match[11]) { // Block Quote
                result += `<blockquote class="border-l-4 border-gray-500 pl-4 italic text-gray-400">${customMarkdownParser(match[12].trim())}</blockquote>`;
            } else if (match[13]) { // Links
                result += `<a href="${match[13]}" target="_blank" class="text-blue-500 underline">${match[13]}</a>`;
            }
    
            lastIndex = regex.lastIndex;
        }
    
        // Add the text after the last match as plain text
        if (lastIndex < text.length) {
            result += text.slice(lastIndex);
        }
    
        return result;
    }

    const formattedMessage = customMarkdownParser(message.message)
        .replace(/\n/g, '<br>')
        .replace(/(https?:\/\/\S+\.(?:gif|jpg|jpeg|png))/g, '<img src="$1" alt="Image" class="max-w-full h-auto rounded-md">');

    const currentUserName = document.querySelector('#_sho-loggedInUserName') as HTMLElement;

    let replyMessageContent = '';
    if (message.reply_to) {
        if (/(https?:\/\/\S+\.(?:gif|jpg|jpeg|png))/.test(message.reply_to.message)) {
            replyMessageContent = message.reply_to.message.match(/(https?:\/\/\S+\.(?:gif|jpg|jpeg|png))/)[0];
        } else {
            replyMessageContent = customMarkdownParser(message.reply_to.message).replace(/\n/g, '<br>');
        }
    }

    if (type === 'message_in') {
        return `
        ${message.reply_to ? `
        <div class="flex flex-row gap-8 items-center px-12 -mb-1">
            <div class="relative">
                <hr class="w-1 h-4 bg-orange-500 absolute rounded-t-md translate-x-1/2">
                <hr class="w-8 h-1 bg-orange-500 absolute rounded-md -translate-y-1/2">
                <hr class="h-1 p-1 w-1 bg-white rounded-full z-30 absolute -translate-y-1/2"/>
            </div>
            <div class="flex flex-row gap-2 items-center ml-2 w-full overflow-auto">
                <p id="_sho-replymessageAuthorName" class="text-gray-500 font-semibold text-sm">${message.reply_to.author}</p>
                <p id="_sho-replymessageContent" class="text-gray-400 font-normal text-xs mt-[2px] truncate ...">${replyMessageContent}</p>
            </div>
        </div>
        ` : ''}
        <div class="flex flex-row gap-4 mr-auto group/message w-full px-8 hover:bg-gray-500/30 transition duration-150 py-2">
            <img id="_sho-chatBoxMessageIcon" src=${message.avatar_url} class="w-10 rounded-full border-2 border-orange-500 border-double h-10 z-30">
            <div class="relative flex flex-col gap-2 w-full">
                <!-- Hover menu icon -->
                <div class="hidden group-hover/message:block absolute right-0 -top-4 z-30 bg-gray-600 rounded-md">
                    <div class="flex flex-row items-center">
                        <div class="hover:cursor-pointer hover:bg-gray-500/60 group/reply-icon">
                            <div class="relative">
                                <p class="hidden group-hover/reply-icon:block opacity:0 group-hover/reply-icon:opacity-100 transition duration-150 absolute -translate-y-full -right-1/3 bottom-1 bg-gray-900 rounded-md px-2 py-1 text-white border border-gray-300 border-double">Reply</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-arrow-return-left m-2" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="hover:cursor-pointer hover:bg-gray-500/60 group/reply-icon">
                            <div class="relative">
                                <p class="hidden group-hover/reply-icon:block opacity:0 group-hover/reply-icon:opacity-100 transition duration-150 absolute -translate-y-full bottom-1 -right-1/3 bg-gray-900 rounded-md px-2 py-1 text-white text-nowrap border border-gray-300 border-double">Add Reaction</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-emoji-sunglasses-fill m-2" viewBox="0 0 16 16">
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M2.31 5.243A1 1 0 0 1 3.28 4H6a1 1 0 0 1 1 1v.116A4.2 4.2 0 0 1 8 5c.35 0 .69.04 1 .116V5a1 1 0 0 1 1-1h2.72a1 1 0 0 1 .97 1.243l-.311 1.242A2 2 0 0 1 11.439 8H11a2 2 0 0 1-1.994-1.839A3 3 0 0 0 8 6c-.393 0-.74.064-1.006.161A2 2 0 0 1 5 8h-.438a2 2 0 0 1-1.94-1.515zM4.969 9.75A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .866-.5z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="hover:cursor-pointer hover:bg-gray-500/60 group/reply-icon">
                            <div class="relative">
                                <p class="hidden group-hover/reply-icon:block opacity:0 group-hover/reply-icon:opacity-100 transition duration-150 absolute -translate-y-full bottom-1 -right-1/3 bg-gray-900 rounded-md px-2 py-1 text-white text-nowrap border  border-gray-300 border-double">Copy Text</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-chat-text-fill m-2" viewBox="0 0 16 16">
                                    <path d="M16 8c0 3.866-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M4.5 5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row gap-2 items-center mr-auto w-full overflow-visible">
                    <p id="_sho-messageAuthorName" class="text-white font-semibold text-md">${message.username}</p>
                    <p class="text-green-400">•</p>
                    <p class="text-gray-500 font-normal text-sm">${message.sent_at}</p>
                </div>
                <div class="relative bg-gradient-to-l from-gray-700 to-gray-600 p-2 rounded-md h-auto w-auto max-w-64 md:max-w-screen-sm lg:max-w-screen-lg mr-auto break-words">
                    <p id="_sho-messageContent" class="text-white font-medium text-md text-wrap">${formattedMessage}</p>
                </div>
            </div>
        </div>
        ` as string;
    } else if (type === 'message_out') {
        return `
        ${message.reply_to ? `
        <div class="flex flex-row gap-8 items-center px-12 -mb-1 w-auto">
            <div class="flex flex-row gap-2 items-center ml-auto overflow-auto">
                <p id="_sho-replymessageContent" class="text-gray-400 font-normal text-xs text-right mt-[2px]  truncate ...">${replyMessageContent}</p>
                <p id="_sho-replymessageAuthorName" class="text-gray-500 font-semibold text-sm">${message.reply_to.author}</p>
            </div>
            <div class="relative ml-1 mr-2">
                <hr class="w-1 h-4 bg-teal-500 absolute rounded-t-md translate-x-1/2">
                <hr class="w-8 h-1 bg-teal-500 absolute rounded-md -translate-y-1/2 -translate-x-full">
                <hr class="h-1 p-1 w-1 bg-white rounded-full z-30 absolute -translate-y-1/2"/>
            </div>
        </div>
        ` : ''}
        <div class="flex flex-row gap-4 ml-auto group/message w-full px-8 hover:bg-gray-500/30 transition duration-150 py-2">
            <div class="relative flex flex-col gap-2 w-full">
                <!-- Hover menu icon -->
                <div class="hidden group-hover/message:block absolute right-0 -top-4 z-30 bg-gray-600 rounded-md">
                    <div class="flex flex-row items-center">
                        <div class="hover:cursor-pointer hover:bg-gray-500/60 group/reply-icon">
                            <div class="relative">
                                <p class="hidden group-hover/reply-icon:block opacity:0 group-hover/reply-icon:opacity-100 transition duration-150 absolute -translate-y-full -right-1/3 bottom-1 bg-gray-900 rounded-md px-2 py-1 text-white border border-gray-300 border-double">Reply</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-arrow-return-left m-2" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="hover:cursor-pointer hover:bg-gray-500/60 group/reply-icon">
                            <div class="relative">
                                <p class="hidden group-hover/reply-icon:block opacity:0 group-hover/reply-icon:opacity-100 transition duration-150 absolute -translate-y-full bottom-1 -right-1/3 bg-gray-900 rounded-md px-2 py-1 text-white text-nowrap border border-gray-300 border-double">Add Reaction</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-emoji-sunglasses-fill m-2" viewBox="0 0 16 16">
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M2.31 5.243A1 1 0 0 1 3.28 4H6a1 1 0 0 1 1 1v.116A4.2 4.2 0 0 1 8 5c.35 0 .69.04 1 .116V5a1 1 0 0 1 1-1h2.72a1 1 0 0 1 .97 1.243l-.311 1.242A2 2 0 0 1 11.439 8H11a2 2 0 0 1-1.994-1.839A3 3 0 0 0 8 6c-.393 0-.74.064-1.006.161A2 2 0 0 1 5 8h-.438a2 2 0 0 1-1.94-1.515zM4.969 9.75A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .866-.5z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="hover:cursor-pointer hover:bg-gray-500/60 group/reply-icon">
                            <div class="relative">
                                <p class="hidden group-hover/reply-icon:block opacity:0 group-hover/reply-icon:opacity-100 transition duration-150 absolute -translate-y-full bottom-1 -right-1/3 bg-gray-900 rounded-md px-2 py-1 text-white text-nowrap border  border-gray-300 border-double">Copy Text</p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-chat-text-fill m-2" viewBox="0 0 16 16">
                                    <path d="M16 8c0 3.866-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M4.5 5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row gap-2 items-center ml-auto">
                    <p id="_sho-messageAuthorName" class="text-white font-semibold text-md">${currentUserName.textContent}</p>
                    <p class="text-green-400">•</p>
                    <p class="text-gray-500 font-normal text-sm">${message.sent_at}</p>
                </div>
                <div class="relative bg-gradient-to-r from-orange-500 to-orange-800 p-2 rounded-md h-auto w-auto max-w-64 md:max-w-screen-sm lg:max-w-screen-lg ml-auto break-words">
                    <p id="_sho-messageContent" class="text-white font-medium text-md text-wrap">${formattedMessage}</p>
                </div>
            </div>
            <img id="_sho-chatBoxMessageIcon" src=${message.avatar_url} class="w-10 rounded-full border-2 border-teal-500 border-double h-10 z-30">
        </div>
        ` as string;
    } else {
        return '';
    }
}
