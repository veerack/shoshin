import { _ } from "../utils/_err";

document.addEventListener('DOMContentLoaded', function() {
    const setupToggle = (selectorId: string, optionsDivId: string, arrowIconId: string, storageKey: string): void => {
        const selector = document.getElementById(selectorId) as HTMLElement;
        const optionsDiv = document.getElementById(optionsDivId) as HTMLElement;
        const arrowIcon = document.getElementById(arrowIconId) as HTMLElement;

        const loadBackgroundImages = () => {
            optionsDiv.querySelectorAll('.bg-gray-500').forEach((bgDiv) => {
                const imgUrl = (bgDiv as HTMLElement).getAttribute('data-src');
                if (imgUrl) {
                    // Apply the same classes, styles, and elements as originally in the HTML
                    (bgDiv as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
                    (bgDiv as HTMLElement).style.backgroundSize = 'cover';
                    (bgDiv as HTMLElement).style.backgroundRepeat = 'no-repeat';

                    // Add any additional elements if necessary (SVG, text, etc.)
                    if (!(bgDiv.querySelector('.absolute'))) {
                        const overlay = document.createElement('div');
                        overlay.className = 'flex flex-row items-center gap-1 absolute bottom-1 left-1 bg-black/40 px-2 py-1 rounded-full';

                        const checkIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        checkIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                        checkIcon.setAttribute("width", "16");
                        checkIcon.setAttribute("height", "16");
                        checkIcon.setAttribute("fill", "lime");
                        checkIcon.classList.add("bi", "bi-patch-check-fill");
                        checkIcon.setAttribute("viewBox", "0 0 16 16");
                        checkIcon.innerHTML = `<path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>`;

                        const creditText = document.createElement('p');
                        creditText.className = 'text-gray-300 font-normal text-sm';
                        creditText.textContent = 'Made by Shoshin.moe';

                        overlay.appendChild(checkIcon);
                        overlay.appendChild(creditText);
                        bgDiv.appendChild(overlay);
                    }
                }
            });
        };

        const removeBackgroundImages = () => {
            optionsDiv.querySelectorAll('.bg-gray-500').forEach((bgDiv) => {
                // Remove the background image and any additional elements
                (bgDiv as HTMLElement).style.backgroundImage = '';
                const overlay = bgDiv.querySelector('.absolute');
                if (overlay) {
                    bgDiv.removeChild(overlay);
                }
            });
        };

        selector.addEventListener('click', function(event) {
            event.stopPropagation();
            optionsDiv.classList.toggle('hidden');
            arrowIcon.classList.toggle('rotate-180');
            if (!optionsDiv.classList.contains('hidden')) {
                loadBackgroundImages();
            } else {
                removeBackgroundImages();
            }
        });

        document.addEventListener('click', function(event) {
            const target = event.target as HTMLElement;
            const isClickInside = optionsDiv.contains(target) || selector.contains(target);
            if (!isClickInside) {
                optionsDiv.classList.add('hidden');
                arrowIcon.classList.remove('rotate-180');
                removeBackgroundImages();
            }
        });

        optionsDiv.querySelectorAll('.flex').forEach(function(item) {
            item.addEventListener('click', function(this: HTMLElement) {
                const selectedText = (this.querySelector('h1') as HTMLElement).textContent || '';
                selector.textContent = selectedText;
                optionsDiv.classList.add('hidden');
                arrowIcon.classList.remove('rotate-180');

                const data = {
                    text: selectedText,
                    backgroundImage: (this.querySelector('.bg-gray-500') as HTMLElement)?.style.backgroundImage || '',
                    avatarEffect: (this.querySelector('img:nth-child(2)') as HTMLImageElement)?.src || ''
                };
                localStorage.setItem(storageKey, JSON.stringify(data));
                removeBackgroundImages();
            });
        });
    }

    setupToggle('backgroundProfileSelector', 'backgroundProfileOptions', 'backgroundMenuArrow', 'selectedBackground');
    setupToggle('effectsProfileSelector', 'effectsProfileOptions', 'effectsMenuArrow', 'selectedAvatarEffect');
});