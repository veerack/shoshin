import { FetchResponseFriends, FriendResponseRequests, FriendResponse, SearchResponse } from "../interfaces";
import { getCookie } from "../_cookie_manager";
import { _ } from "../auth/_err";

const addFriendsButton = document.getElementById('_sho-sendFriendRequest-button') as HTMLElement;

type FriendButtonKeys = 'friendList' | 'friendRequestsList' | 'blockedFriendsList';

const friendButtons: Record<FriendButtonKeys, { func: () => Promise<void>; element: HTMLElement; div: HTMLElement }> = {
    friendList: { func: fetchFriendsList, element: document.getElementById('_sho-currentFriendsButton') as HTMLElement, div: document.getElementById('_sho-acceptedFriendsDiv') as HTMLElement },
    friendRequestsList: { func: fetchFriendRequests, element: document.getElementById('_sho-requestInOutButton') as HTMLElement, div: document.getElementById('_sho-friendRequestsDiv') as HTMLElement },
    blockedFriendsList: { func: fetchFriendRequests, element: document.getElementById('_sho-blockedFriendsButton') as HTMLElement, div: document.getElementById('_sho-blockedFriendsDiv') as HTMLElement  }
};

async function fetchFriendsList(): Promise<void> {
    let uidCookie = await getCookie('_sho-session');
    if (!uidCookie) {
        _._(1, { data: 'Failed to fetch friends list' }, 'friends');
        return;
    }
    fetch('/api/friends/' + uidCookie.raw.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'token': uidCookie.raw.token })
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to fetch friends list');
    }).then((data: FriendResponse) => {
        friendButtons.friendList.div.innerHTML = '';

        // Specify the key of the element you want to keep visible
        const keepVisibleKey: FriendButtonKeys = 'friendList'; // Change this to the key you want to keep visible
        
        // Loop through the friendButtons object
        (Object.keys(friendButtons) as FriendButtonKeys[]).forEach(key => {
            const button = friendButtons[key];
            if (key !== keepVisibleKey && button.div) {
                button.div.classList.add('hidden');
            } else {
                button.div.classList.remove('hidden');
            }
        });

        if (data.payload.length === 0) {
            friendButtons.friendList.div.innerHTML = '<img src="https://beta.shoshin.moe/static/assets/nofriends.png" class="w-1/2 mx-auto mb-2">';
            return;
        }

        data.payload.forEach(friend => {
            const friendHTML = `
            <div class="flex flex-row items-center gap-4 hover:bg-gray-800/30 p-4 hover:cursor-pointer group">
                <img src="${friend.avatar || 'https://beta.shoshin.moe/static/assets/default_avatar.png'}" class="w-12 h-12 rounded-full">
                <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2 items-center">
                        <p class="text-gray-300 font-bold text-lg">${friend.username}</p>
                        <p id="_sho-requestsUserUID" class="text-gray-600 font-semibold text-xs hidden group-hover:block">${friend.uid}</p>
                    </div>
                    <p class="text-gray-400 font-medium text-sm">${friend.bio || '...'}</p>
                </div>
                <div class="flex flex-row gap-4 ml-auto">
                    <div id="_sho-copyFriendProfileUrlButton" class="group/url rounded-full bg-gray-800 relative w-auto items-center flex justify-center px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="orange" class="bi bi-link-45deg" viewBox="0 0 16 16">
                            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
                            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
                        </svg>
                        <p class="text-gray-300 font-medium text-md px-2 py-1 hover:cursor-pointer absolute bottom-8 -translate-y-1/2 hidden group-hover/url:block bg-black rounded-md w-auto text-nowrap">Copy URL</p>
                    </div>
                    <div id="_sho-removeFriendButton" class="group/remove rounded-full bg-gray-800 relative w-auto items-center flex justify-center px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="orange" class="bi bi-person-dash-fill" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M11 7.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5"/>
                            <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                        </svg>
                        <p class="text-gray-300 font-medium text-md px-2 py-1 hover:cursor-pointer absolute bottom-8 -translate-y-1/2 hidden group-hover/remove:block bg-black rounded-md">Unfriend</p>
                    </div>
                    <div id="_sho-blockFriendButton" class="group/block rounded-full bg-gray-800 relative w-auto items-center flex justify-center px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="red" class="bi bi-ban" viewBox="0 0 16 16">
                            <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>
                        </svg>
                        <p class="text-gray-300 font-medium text-md px-2 py-1 hover:cursor-pointer absolute bottom-8 -translate-y-1/2 hidden group-hover/block:block bg-black rounded-md">Block</p>
                    </div>
                </div>
            </div>
            <hr class="h-px bg-gray-200 border-0 dark:bg-gray-700">
            `;

            friendButtons.friendList.div.insertAdjacentHTML('beforeend', friendHTML);

            const removeButton = document.getElementById('_sho-removeFriendButton') as HTMLElement;
            const blockButton = document.getElementById('_sho-blockFriendButton') as HTMLElement;
            const copyUrlButton = document.getElementById('_sho-copyFriendProfileUrlButton') as HTMLElement;

            const userUID = document.getElementById('_sho-requestsUserUID') as HTMLElement;

            removeButton.addEventListener('click', function() {
                fetch('/api/friends/handle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        'friend_uid': userUID.textContent,
                        'token': uidCookie.raw.token,
                        'action': 'remove'
                    })
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                }).then((data: FetchResponseFriends) => {
                    _._(1, { data: data }, 'friends');
                    if (data.status === 'error') {
                        return;
                    }
                    fetchFriendsList();
                }).catch(error => {
                    console.error(error);
                });
            });

            blockButton.addEventListener('click', function() {
                fetch('/api/friend/handle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        'friend_uid': userUID.textContent,
                        'token': uidCookie.raw.token,
                        'action': 'block'
                    })
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                }).then((data: FetchResponseFriends) => {
                    _._(1, { data: data }, 'friends');
                    if (data.status === 'error') {
                        return;
                    }
                    fetchFriendsList();
                }).catch(error => {
                    console.error(error);
                });
            });

            copyUrlButton.addEventListener('click', function() {
                navigator.clipboard.writeText(`https://beta.shoshin.moe/u/${userUID.textContent}`).then(() => {
                    _._(1, { data: 'Copied URL to clipboard' }, 'friends');
                }).catch(error => {
                    console.error(error);
                });
            });

        });
    }).catch(error => {
        console.error(error);
    });
}

fetchFriendsList();

async function fetchFriendRequests(): Promise<void> {
    let uidCookie = await getCookie('_sho-session');
    if (!uidCookie) {
        _._(1, { data: 'Failed to fetch friends list' }, 'friends');
        return;
    }
    fetch('/api/friends/requests/in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'token': uidCookie.raw.token })
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to fetch friend requests');
    }).then((data: FriendResponseRequests) => {
        _._(1, { data: data }, 'friends');
        friendButtons.friendRequestsList.div.innerHTML = '';

        // Specify the key of the element you want to keep visible
        const keepVisibleKey: FriendButtonKeys = 'friendRequestsList'; // Change this to the key you want to keep visible
        
        // Loop through the friendButtons object
        (Object.keys(friendButtons) as FriendButtonKeys[]).forEach(key => {
            const button = friendButtons[key];
            if (key !== keepVisibleKey && button.div) {
                button.div.classList.add('hidden');
            } else {
                button.div.classList.remove('hidden');
            }
        });

        data.payload.in.forEach((friend, index) => {
            const uniqueId = friend.uid; // Using UID to ensure uniqueness
        
            const friendHTML = `
            <div class="flex flex-row items-center gap-4 hover:bg-gray-800/30 p-4 hover:cursor-pointer group">
                <img src="${friend.avatar || 'https://beta.shoshin.moe/static/assets/default_avatar.png'}" class="w-12 h-12 rounded-full">
                <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2 items-center">
                        <p class="text-gray-300 font-bold text-lg">${friend.username}</p>
                        <p id="_sho-requestsUserUID-${uniqueId}" class="text-gray-600 font-semibold text-xs hidden group-hover:block">${friend.uid}</p>
                    </div>
                    <p class="text-gray-400 font-medium text-sm">${'Incoming Request'}</p>
                </div>
                <div class="flex flex-row gap-4 ml-auto">
                    <div id="_sho-accept-request-${uniqueId}" class="group/accept rounded-full bg-gray-800 relative w-auto items-center flex justify-center px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="green" class="bi bi-person-plus" viewBox="0 0 16 16">
                            <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                            <path fill-rule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5"/>
                        </svg>
                        <p class="text-gray-300 font-medium text-md px-2 py-1 hover:cursor-pointer absolute bottom-8 -translate-y-1/2 hidden group-hover/accept:block bg-black rounded-md w-auto text-nowrap">Accept</p>
                    </div>
                    <div id="_sho-deny-request-${uniqueId}" class="group/deny rounded-full bg-gray-800 relative w-auto items-center flex justify-center px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="red" class="bi bi-person-slash" viewBox="0 0 16 16">
                            <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465m-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                        </svg>
                        <p class="text-gray-300 font-medium text-md px-2 py-1 hover:cursor-pointer absolute bottom-8 -translate-y-1/2 hidden group-hover/deny:block bg-black rounded-md">Deny</p>
                    </div>
                </div>
            </div>
            <hr class="h-px bg-gray-200 border-0 dark:bg-gray-700">
            `;
            friendButtons.friendRequestsList.div.insertAdjacentHTML('beforeend', friendHTML);
        
            const acceptButton = document.getElementById(`_sho-accept-request-${uniqueId}`) as HTMLElement;
            const denyButton = document.getElementById(`_sho-deny-request-${uniqueId}`) as HTMLElement;
            const userUID = document.getElementById(`_sho-requestsUserUID-${uniqueId}`) as HTMLElement;
        
            acceptButton.addEventListener('click', function() {
                fetch('/api/friend/request/handle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        'request_uid': userUID.textContent,
                        'token': uidCookie.raw.token,
                        'action': 'accept'
                    })
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    if (response.status === 400) {
                        response.json().then(console.log);
                        return;
                    }
                }).then((data: FetchResponseFriends) => {
                    _._(1, { data: data }, 'friends');
                    if (data.status === 'error') {
                        return;
                    }
                    fetchFriendRequests();
                }).catch(error => {
                    console.error(error);
                });
            });
        
            denyButton.addEventListener('click', function() {
                fetch('/api/friend/request/handle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        'request_uid': userUID.textContent,
                        'token': uidCookie.raw.token,
                        'action': 'deny'
                    })
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    if (response.status === 400) {
                        response.json().then(console.log);
                        return;
                    }
                }).then((data: FetchResponseFriends) => {
                    _._(1, { data: data }, 'friends');
                    if (data.status === 'error') {
                        return;
                    }
                    fetchFriendRequests();
                }).catch(error => {
                    console.error(error);
                });
            });
        
        });

        data.payload.out.forEach(friend => {
            const friendHTML = `
            <div class="flex flex-row items-center gap-4 hover:bg-gray-800/30 p-4 hover:cursor-pointer group">
                <img src="${friend.avatar || 'https://beta.shoshin.moe/static/assets/default_avatar.png'}" class="w-12 h-12 rounded-full">
                <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2 items-center">
                        <p class="text-gray-300 font-bold text-lg">${friend.username}</p>
                        <p id="_sho-requestsUserUID" class="text-gray-600 font-semibold text-xs hidden group-hover:block">${friend.uid}</p>
                    </div>
                    <p class="text-gray-400 font-medium text-sm">${'Outgoing Request'}</p>
                </div>
                <div class="flex flex-row gap-4 ml-auto">
                    <div id="_sho-cancel-request" class="group/cancel rounded-full bg-gray-800 relative w-auto items-center flex justify-center px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="yellow" class="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                        </svg>
                        <p class="text-gray-300 font-medium text-md px-2 py-1 hover:cursor-pointer absolute bottom-8 -translate-y-1/2 hidden group-hover/cancel:block bg-black rounded-md w-auto text-nowrap">Cancel Request</p>
                    </div>
                </div>
            </div>
            <hr class="h-px bg-gray-200 border-0 dark:bg-gray-700">
            `;
            friendButtons.friendRequestsList.div.insertAdjacentHTML('beforeend', friendHTML);

            const cancelButton = document.getElementById('_sho-cancel-request') as HTMLElement;
            
            const userUID = document.getElementById('_sho-requestsUserUID') as HTMLElement;

            cancelButton.addEventListener('click', function() {
                fetch('/api/friend/request/handle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        'request_uid': userUID.textContent,
                        'token': uidCookie.raw.token,
                        'action': 'cancel'
                    })
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    if (response.status === 400) {
                        // Since i'm doing jsonify in quart like `jsonify({'error': 'Request already accepted'}), 400`, let's console.log the json
                        response.json().then(console.log);
                        return;
                    }
                }).then((data: FetchResponseFriends) => {
                    _._(1, { data: data }, 'friends');
                    if (data.status === 'error') {
                        return;
                    }
                    fetchFriendRequests();
                }).catch(error => {
                    console.error(error);
                });
            });

        });

    }).catch(error => {
        console.error(error);
    });
}

for (const [, value] of Object.entries(friendButtons)) {
    value.element.addEventListener('click', function() {
        for (const [, value] of Object.entries(friendButtons)) {
            value.element.classList.remove('bg-gray-700/30');
        }
        this.classList.add('bg-gray-700/30');
        value.func();
    });
}

const popup = document.getElementById('shoshin-friends-popup') as HTMLElement;
const addFriendSearch = document.getElementById('_sho-friendSearchInput') as HTMLInputElement;

addFriendsButton.addEventListener('click', function() {
    popup.classList.toggle('hidden');
});

document.addEventListener('click', function(event) {
    const target = event.target as HTMLElement;
    if (!popup.contains(target) && target !== addFriendsButton) {
        popup.classList.add('hidden');
    }
});

addFriendSearch.addEventListener('keyup', async function(event) {
    if (event.key === 'Enter') {
        const searchQuery = addFriendSearch.value.trim();
        let uidCookie = await getCookie('_sho-session');
        if (!uidCookie) {
            _._(1, { data: 'Failed to fetch friends list' }, 'friends');
            return;
        }

        console.log('Search Query:', searchQuery);

        fetch('/api/friends/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                'search': searchQuery,
                'token': uidCookie.raw.token
            })
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to search for friends');
        }).then((data: SearchResponse) => {
            _._(1, { data: data }, 'friends');
            const searchResults = document.getElementById('shoshin-friends-found') as HTMLElement;
            searchResults.innerHTML = '';

            data.payload.forEach(user => {
                const userHtml = `
                    <div class="flex cursor-pointer items-center gap-4 p-2 hover:bg-gray-300/30 rounded-md">
                        <img src="${user.avatar || 'https://beta.shoshin.moe/static/assets/default_avatar.png'}" class="h-8 w-8 rounded-full" />
                        <div class="flex flex-col">
                            <h1 class="text-gray-300 font-semibold text-lg">${user.username}</h1>
                            <p class="text-white font-light text-xs">${user.bio}</p>
                        </div>
                        <svg id="shoshin-add-friend-icon" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" class="bi bi-plus-circle ml-auto hover:bg-orange-500 rounded-full transform transition duration-150" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
                        <div id="shoshin-requestSentCheck" class="flex flex-row items-center gap-1 hidden ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="lime" class="bi bi-check2-all" viewBox="0 0 16 16">
                            <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0"/>
                            <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708"/>
                            </svg>
                            <p class="text-green-400 text-lg">Request Sent!</p>
                        </div>
                        <div id="shoshin-requestSentError" class="flex flex-row items-center gap-1 hidden ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="red" class="bi bi-x-lg" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L7.293 8z"/>
                            </svg>
                            <p class="text-red-400 text-lg"></p>
                        </div>
                    </div>
                `;
                searchResults.insertAdjacentHTML('beforeend', userHtml);

                const sendFriendRequestIcon = document.getElementById('shoshin-add-friend-icon') as HTMLElement;
                const requestSentCheck = document.getElementById('shoshin-requestSentCheck') as HTMLElement;
                const errorMessage = document.getElementById('shoshin-requestSentError') as HTMLElement;

                sendFriendRequestIcon.addEventListener('click', function() {
                    fetch('/api/friends/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            'friend_id': user.uid,
                            'token': uidCookie.raw.token
                        })
                    }).then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error('Failed to send friend request');
                    }).then((data: FetchResponseFriends) => {
                        _._(1, { data: data }, 'friends');

                        if (data.status === 'error') {
                            const errorTextField = errorMessage.querySelector('p') as HTMLElement;
                            errorTextField.textContent = data.payload as string;
                            sendFriendRequestIcon.classList.add('hidden');
                            errorMessage.classList.remove('hidden');
                            return;
                        }

                        sendFriendRequestIcon.classList.add('hidden');
                        requestSentCheck.classList.remove('hidden');
                    }).catch(error => {
                        console.error(error);
                    });
                });
            });
        }).catch(error => {
            console.error(error);
        });
    }
});