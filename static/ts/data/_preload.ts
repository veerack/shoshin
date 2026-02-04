import { Mapping } from '../interfaces'

document.addEventListener('DOMContentLoaded', function() {
    // Define your mappings with appropriate types
    const _a: Mapping = {
        "_sho-mng-details": "_sho-mng-div-details",
        "_sho-mng-security": "_sho-mng-div-security",
        "_sho-mng-general": "_sho-mng-div-general",
        "_sho-mng-achievements": "_sho-mng-div-achievements",
        "_sho-mng-appearance": "_sho-mng-div-appearance",
        "_sho-mng-friends": "_sho-mng-div-friends",
        "_sho-mng-favourites": "_sho-mng-div-favourites",
        "_sho-mng-subscriptions": "_sho-mng-div-subscriptions",
        "_sho-mng-linked": "_sho-mng-div-linked",
        "_sho-mng-logout": "_sho-mng-div-logout"
    };

    const _cfe: Mapping = {
        "_sho-mng-details": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-security": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-general": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-achievements": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-appearance": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-friends": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-favourites": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-subscriptions": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-yellow-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-yellow-300",
        "_sho-mng-linked": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-orange-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-orange-300",
        "_sho-mng-logout": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal bg-red-500/50 rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border border-red-300"
    };

    const _cfe_b: Mapping = {
        "_sho-mng-details": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-security": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-general": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-achievements": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-appearance": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-friends": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-favourites": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-subscriptions": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-yellow-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-yellow-300",
        "_sho-mng-linked": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-orange-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-orange-300",
        "_sho-mng-logout": "p-3 ml-2 flex flex-row gap-2 items-center text-white text-base font-normal hover:bg-red-500/30 hover:rounded-l-full hover:underline decoration-dotted underline-offset-4 hover:cursor-pointer hover:border hover:border-red-300"
    };

    for (let buttonId in _a) {
        const button = document.getElementById(buttonId) as HTMLElement;
        if (button) {
            button.addEventListener('click', function() {
                button.className = _cfe[buttonId];

                for (let otherButtonId in _a) {
                    if (otherButtonId !== buttonId) {
                        const otherButton = document.getElementById(otherButtonId) as HTMLElement;
                        if (otherButton && otherButton.className !== _cfe_b[otherButtonId]) {
                            otherButton.className = _cfe_b[otherButtonId];
                        }
                    }
                }

                for (let divId in _a) {
                    const div = document.getElementById(_a[divId]) as HTMLElement;
                    if (div) {
                        if (divId === buttonId) {
                            div.classList.remove('hidden');
                        } else {
                            div.classList.add('hidden');
                        }
                    }
                }
            });
        }
    }

    for (let divId in _a) {
        const div = document.getElementById(_a[divId]) as HTMLElement;
        if (div) {
            if (divId === "_sho-mng-details") {
                div.classList.remove('hidden');
            } else {
                div.classList.add('hidden');
            }
        }
    }

    const detailsButton = document.getElementById("_sho-mng-details") as HTMLElement;
    if (detailsButton) {
        detailsButton.className = _cfe["_sho-mng-details"];
    }

    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen') as HTMLElement;
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(function() {
                loadingScreen.remove();
            }, 1000);
        }
    }, 4000);
});