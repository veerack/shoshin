import { _f } from './_e';

const d = {
    'baseUrl': 'https://beta.shoshin.moe',
    '_px': '/captcha/google/recaptcha/verify',
    '_pl': '/auth/verify',
    '_pvc': '/auth/verify/code',
    '_pe': '/api/env',
    '_pv': '/auth/verify/session',
    '_ck': '/ck/'
}

const _px = d['baseUrl'] + d['_px'];
const _pl = d['baseUrl'] + d['_pl'];
const _pvc = d['baseUrl'] + d['_pvc'];
const _pe = d['baseUrl'] + d['_pe'];
const _pv = d['baseUrl'] + d['_pv'];
const _ck = d['baseUrl'] + d['_ck'];

export { _px, _pl, _pvc, _pe, _pv, _ck }