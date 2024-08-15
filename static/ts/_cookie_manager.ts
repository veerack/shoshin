import { _ck } from './auth/_proxy';
import { _ } from './utils/_err';

const gc = _ck + 'getcookie';
const ec = _ck + 'erasecookie';

interface CookieResponse {
    [key: string]: any;
}

export async function getCookie(name: string): Promise<CookieResponse | undefined> {
    try {
        const response = await fetch(gc + `?name=${encodeURIComponent(name)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'  // Ensure cookies are included in the request
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Retrieved Cookie!', data);
            return data;
        } else {
            console.error('Failed to retrieve cookie:', data.message);
        }
    } catch (error) {
        console.error('Error retrieving cookie:', error);
    }
}

export async function eraseCookie(name: string): Promise<CookieResponse | undefined> {
    try {
        const response = await fetch(ec, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'name': name,
            },
        });

        const data = await response.json();
        if (response.ok) {
            _._(1, { action: 'Cookie Erased!', cookie: data }, 'cookies');
            return data;
        } else {
            _._(0, { payload: data.message }, 'cookies');
        }
    } catch (error) {
        console.error('Error erasing cookie:', error);
    }
}