export function renderMessage(message: any, type: string): string {
    const formattedMessage = message.message.replace(/\n/g, '<br>');
    const currentUserName = document.querySelector('#_sho-loggedInUserName') as HTMLElement;
    if (type === 'message_in') {
        return `
        ${message.reply_to ? `
        <div class="flex flex-row gap-8 items-center px-12 mb-2">
            <div class="relative">
                <hr class="w-1 h-8 bg-orange-500 absolute rounded-t-md translate-x-1/2">
                <hr class="w-8 h-1 bg-orange-500 absolute rounded-md -translate-y-1/2">
                <hr class="h-1 p-1 w-1 bg-white rounded-full z-30 absolute -translate-y-1/2"/>
            </div>
            <div class="flex flex-row gap-2 items-center ml-2">
                <p id="_sho-messageAuthorName" class="text-gray-500 font-semibold text-sm">${message.reply_to.author}</p>
                <p id="_sho-messageAuthorName" class="text-gray-400 font-normal text-xs mt-[2px]">${message.reply_to.message}</p>
            </div>
        </div>
        ` : ''}
        <div class="flex flex-row gap-4 mr-auto group/message w-full px-8 hover:bg-gray-500/30 transition duration-150">
            <img id="_sho-chatBoxMessageIcon" src=${message.avatar_url} class="w-10 rounded-full border-2 border-teal-500 border-double h-10">
            <div class="relative flex flex-col gap-2 w-full">
                <!-- Hover menu icon -->
                <div class="hidden group-hover/message:block absolute right-0 -top-4 z-30 bg-gray-600 rounded-md p-1">
                    <div class="flex flex-row gap-2 items-center">
                        <div class="hover:cursor-pointer hover:bg-gray-500/30 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-arrow-return-left" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </div>
                        <div class="hover:cursor-pointer hover:bg-gray-500/30 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="red" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row gap-2 items-center mr-auto">
                    <p id="_sho-messageAuthorName" class="text-white font-semibold text-md">${message.username}</p>
                    <p class="text-green-400">•</p>
                    <p class="text-gray-500 font-normal text-sm">${message.sent_at}</p>
                </div>
                <div class="relative bg-gradient-to-l from-gray-700 to-gray-600 p-2 rounded-md w-auto h-auto max-w-screen-lg mr-auto break-words">
                    <p id="_sho-messageContent" class="text-white font-medium text-md text-wrap">${formattedMessage}</p>
                </div>
            </div>
        </div>
        ` as string;
    } else if (type === 'message_out') {
        return `
        ${message.reply_to ? `
        <div class="flex flex-row gap-8 items-center px-12 mb-2">
            <div class="flex flex-row gap-2 items-center ml-auto">
                <p id="_sho-messageAuthorName" class="text-gray-400 font-normal text-xs mt-[2px]">${message.reply_to.message}</p>
                <p id="_sho-messageAuthorName" class="text-gray-500 font-semibold text-sm">${message.reply_to.author}</p>
            </div>
            <div class="relative ml-2">
                <hr class="w-1 h-8 bg-teal-500 absolute rounded-t-md translate-x-1/2">
                <hr class="w-8 h-1 bg-teal-500 absolute rounded-md -translate-y-1/2 -translate-x-full">
                <hr class="h-1 p-1 w-1 bg-white rounded-full z-30 absolute -translate-y-1/2"/>
            </div>
        </div>
        ` : ''}
        <div class="flex flex-row gap-4 ml-auto group/message w-full px-8 hover:bg-gray-500/30 transition duration-150 py-2">
            <div class="relative flex flex-col gap-2 w-full">
                <!-- Hover menu icon -->
                <div class="hidden group-hover/message:block absolute right-0 -top-4 z-30 bg-gray-600 rounded-md p-1">
                    <div class="flex flex-row gap-2 items-center">
                        <div class="hover:cursor-pointer hover:bg-gray-500/30 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-arrow-return-left" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </div>
                        <div class="hover:cursor-pointer hover:bg-gray-500/30 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="red" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row gap-2 items-center ml-auto">
                    <p id="_sho-messageAuthorName" class="text-white font-semibold text-md">${currentUserName.textContent}</p>
                    <p class="text-green-400">•</p>
                    <p class="text-gray-500 font-normal text-sm">${message.sent_at}</p>
                </div>
                <div class="relative bg-gradient-to-r from-orange-500 to-orange-800 p-2 rounded-md w-auto h-auto max-w-screen-lg ml-auto break-words">
                    <p id="_sho-messageContent" class="text-white font-medium text-md text-wrap">${formattedMessage}</p>
                </div>
            </div>
            <img id="_sho-chatBoxMessageIcon" src=${message.avatar_url} class="w-10 rounded-full border-2 border-teal-500 border-double h-10">
        </div>
        ` as string;
    } else {
        return '';
    }
}
