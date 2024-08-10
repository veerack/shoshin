import * as events from './_events';

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        events.init();
    });
}

init();