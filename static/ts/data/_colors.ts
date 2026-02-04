export {};

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle color selection and store it in local storage
    function handleColorSelection(button: Element) {
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.classList.remove('outline-none', 'outline-offset-2', 'outline-orange-500');
            const divElement = btn.querySelector('div');
            if (divElement) {
                divElement.classList.add('hidden');
            }
        });
        button.classList.add('outline-none', 'outline-offset-2', 'outline-orange-500');
        const buttonDivElement = button.querySelector('div');
        if (buttonDivElement) {
            buttonDivElement.classList.remove('hidden');
        }

        // Store the selected color in local storage
        const selectedColor = button.getAttribute('data-color');
        if (selectedColor) {
            localStorage.setItem('selectedColor', selectedColor);
        }
    }

    // Add event listeners to all buttons with data-color attribute
    document.querySelectorAll('[data-color]').forEach(button => {
        button.addEventListener('click', () => handleColorSelection(button));
    });

    // Function to apply the stored color on page load
    function applyStoredColor() {
        const storedColor = localStorage.getItem('selectedColor');
        if (storedColor) {
            const button = document.querySelector(`[data-color="${storedColor}"]`);
            if (button) {
                button.classList.add('outline-none', 'outline-offset-2', 'outline-orange-500');
                const buttonDivElement = button.querySelector('div');
                if (buttonDivElement) {
                    buttonDivElement.classList.remove('hidden');
                }
            }
        }
    }

    // Apply the stored color when the page loads
    applyStoredColor();
});