// socket.ts
import { io, Socket } from 'socket.io-client';
import { getCookie } from '../_cookie_manager';
import chalk from "chalk";
import { getCurrentTime } from '../utils/_time';
import { renderMessage, initMessageOptions } from '../utils/_elements';
import { currentActiveChatbox } from '../utils/_elements';
import { _ } from '../utils/_err';

let socket: Socket | null = null;

export const initializeSocket = async () => {
    const chatMessages = document.getElementById('chatMessages') as HTMLElement;
    const chatBox = document.querySelector('#_sho-chatBox') as HTMLElement;
    if (!socket) {
        const st = await getCookie('_sho-session');
        const v = 1; // Replace with the actual version you're using
        const _gateway = 'https://gateway.shoshin.moe';

        if (st) {
            socket = io(_gateway, {
                transports: ['websocket', 'polling'],
                query: { t: st, v: v }
            });

            // Listen for the connection_info event
            socket.on('connection_info', (data: { version: string, session_token: string }) => {
                console.log(
                    chalk.magenta('[Websocket] ') + 
                    _gateway + `?t=${data.session_token}&v=${data.version},   ` + 
                    chalk.bold.gray(`v${data.version},   `) + 
                    chalk.green('Connected')
                );
            });

            // Send a ping every 10 seconds
            setInterval(() => {
                socket?.emit('ping_event', 'ping');
                console.log(chalk.cyan('Ping sent'));
            }, 10000);

            socket.on('message', (message: string) => {
                console.log(chalk.green('Message received from server:'), chalk.magenta(message));
                const data = JSON.parse(message);
                const currentTime = getCurrentTime();
                const formattedMessage = data.message.replace(/\n/g, '<br>');
                let chatBoxMessageHTML = renderMessage({
                    message: formattedMessage,
                    username: data.sender.username,
                    avatar_url: data.sender.avatar || '/static/assets/default_avatar.png',
                    sent_at: currentTime,
                    reply_to: data.reply_to
                }, 'message_in');
            
                _._(2, { chatBoxActiveUID: currentActiveChatbox, current_uid: data.sender.uid }, 'messages');
            
                if (currentActiveChatbox === data.sender.uid) {
                    // Only append the message if the current active chatbox matches the sender's UID
                    chatMessages.insertAdjacentHTML('beforeend', chatBoxMessageHTML);
                    chatBox.scrollTop = chatBox.scrollHeight;
                    initMessageOptions();
                } else {
                    // Find the element inside const DMsSidebarItems = document.querySelectorAll('._sho-DMsSidebarUserElement');
                    // that matches the sender's UID
                    const DMsSidebarItems = document.querySelectorAll('._sho-DMsSidebarUserElement');
                    DMsSidebarItems.forEach((element) => {
                        const uid = element.querySelector('#_sho-DMsUid')?.textContent;
                        console.log(`Matching UID: ${uid} with sender UID: ${data.sender.uid}. Current active chatbox: ${currentActiveChatbox}. Types of UIDs: ${typeof uid}, ${typeof data.sender.uid}`);
                        if (uid === data.sender.uid) {
                            const lastMessageInChat = element.querySelector('#_sho-lastMessageInChat') as HTMLElement;
                            lastMessageInChat.textContent = formattedMessage;
                            element.classList.add('_sho-newMessageIndicator');
                        }
                    });
                }
            });

            socket.on('pong', () => {
                console.log(chalk.green('Pong received'));
            });

            socket.on('disconnect', (reason: string) => {
                console.log(chalk.red('WebSocket connection closed, reason:'), chalk.yellow(reason));
            });

            socket.on('connect_error', (error: Error) => {
                console.error(chalk.red('WebSocket connection error:'), chalk.magenta(error.message));
            });
        } else {
            console.error(chalk.red('Session token is missing.'));
        }
    }
};

// Export the socket for use in other files
export const getSocket = (): Socket | null => socket;