export {};

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