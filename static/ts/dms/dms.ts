import * as events from './_events';
import { initEmoGIFs } from '../utils/_elements'

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        events.init();
        initEmoGIFs();
    });
}

init();