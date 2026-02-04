export {};

const customSelectButton = document.getElementById('custom-select-button') as HTMLElement;
const customSelectOptions = document.getElementById('custom-select-options') as HTMLElement;

if (customSelectButton) {
    customSelectButton.addEventListener('click', function() {
        if (customSelectOptions) {
            customSelectOptions.classList.toggle('hidden');
        }
    });
}

const customSelectOptionItems = document.querySelectorAll('#custom-select-options li') as NodeListOf<HTMLLIElement>;

customSelectOptionItems.forEach(function(item) {
    item.addEventListener('click', () => {
        if (customSelectButton) {
            customSelectButton.textContent = item.textContent || '';
        }
        if (customSelectOptions) {
            customSelectOptions.classList.add('hidden');
        }
    });
});

document.addEventListener('click', function(event) {
    if (customSelectButton && customSelectOptions) {
        const target = event.target as HTMLElement;
        const isClickInside = customSelectButton.contains(target);
        const isOptionClickInside = customSelectOptions.contains(target);

        if (!isClickInside && !isOptionClickInside) {
            customSelectOptions.classList.add('hidden');
        }
    }
});