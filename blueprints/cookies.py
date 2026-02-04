from quart import current_app, request, jsonify, make_response, Blueprint
import hmac
import hashlib
import os
import datetime
import json
import base64
from utility.methods import SessionManager
import logging

log = logging.getLogger("hypercorn")
log.setLevel(logging.INFO)

cookies_bp = Blueprint('cookies', __name__, url_prefix='/ck')

@cookies_bp.route('/getcookie', methods=['GET'])
async def get_cookie():
    cookie_name = request.args.get('name')
    if not cookie_name:
        return jsonify({'message': 'Cookie name not provided'}), 400

    cookie_value = request.cookies.get(cookie_name)
    if not cookie_value:
        return jsonify({'message': 'No cookie found'}), 404

    try:
        return jsonify(cookie_value)
    except Exception as e:
        log.info(e)
        return jsonify({'message': 'Error parsing cookie', 'error': str(e)}), 400

@cookies_bp.route('/erasecookie', methods=['GET'])
async def erase_cookie():
    cookie_name = request.headers.get('name')
    print(f"Cookie name: {cookie_name}")
    if not cookie_name:
        return jsonify({'message': 'Cookie name not provided'}), 400

    cookie_value = request.cookies.get(cookie_name)
    if not cookie_value:
        return jsonify({'message': 'No cookie found'}), 404

    try:
        cjson = SessionManager.parse_cookie(cookie_value)
    except Exception as e:
        return jsonify({'message': 'Error parsing cookie'}), 400

    data = await SessionManager.verify_session_token(cjson['raw']['token'], True)
    if data['status'] == "success":
        _uuid = await current_app.pool.execute("DELETE FROM sessions WHERE token = $1 RETURNING uid", cjson['raw']['token'])
        await current_app.pool.execute("UPDATE users SET sessions = array_remove(sessions, $2) WHERE uid = $1", int(_uuid), cjson['raw']['token'])

    response = await make_response(jsonify({'message': 'Cookie erased'}))
    response.set_cookie(cookie_name, '', expires=0)
    return response