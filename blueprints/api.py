import datetime
from quart import Blueprint, current_app
from quart import request, jsonify
import settings as _WebSettings
import logging
from utility import PIL
from quart_cors import cors, route_cors
from utility.methods import requires_valid_origin, SessionManager, requires_valid_session_token, cookie_check, BucketCF
from utility.schemas import requires, SendRequestSchema, EnvSchema, UsernameSchema, SearchSchema, HandleFriendRequestSchema, HandleFriendsSchema, Token, assetsSchema
import json

api_bp = Blueprint('api', __name__, url_prefix='/api')
log = logging.getLogger("hypercorn")
log.setLevel(logging.INFO)

@api_bp.route('/gateway/session/verify', methods=['POST'])
@route_cors(allow_origin="https://gateway.shoshin.moe")
@requires(Token)
async def gt_verify_session():
    """
    Route made exclusively for the Gateway to verify session tokens.
    No documentation needed.
    """
    data = await request.get_json()
    token = data['token']
    token = await SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(token['raw']['token'])
    if not user:
        return jsonify({'status': 'error', 'payload': 'User not found'}), 400
    return jsonify({'status': 'success', 'payload': int(user['uid'])})

@api_bp.route('/assets/update', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(assetsSchema)
async def update_assets(data):
    """Update the user's assets.

    Request JSON
    ------------
    token : str
        The session token of the user.
    assets : dict
        The assets to update.
    type: str
        The type of asset to update.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the update process.
    payload : str
        The result of the update process.

    400 Bad Request
    ---------------
    status : str
        The status of the update process.
    payload : str
        The error message.
    """
    token = data.token
    file64 = data.file
    action_type = data.type

    # Strip the prefix from the base64 string if it exists
    if "," in file64:
        file64 = file64.split(",")[1]

    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])

    if not user:
        return jsonify({'status': 'error', 'payload': 'User not found'})

    if action_type == 'avatar':
        return await BucketCF.update(file64, 'avatar', user['uid'])
    elif action_type == 'banner':
        return await BucketCF.update(file64, 'banner', user['uid'])

@api_bp.route('/friends/search', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(SearchSchema)
async def search_user(data):
    """Search for users by UID or username.

    Request JSON
    ------------
    token : str
        The session token of the user.
    search : str
        The UID or username to search for.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the search process.
    payload : list
        The list of found users.
            - uid : str
                The UID of the user.
            - username : str
                The username of the user.
            - avatar : str
                The avatar of the user.
            - status : str
                The friendship status.
            - bio : str
                The bio of the user.

    400 Bad Request
    ---------------
    status : str
        The status of the search process.
    payload : str
        The error message.
    """
    token = data.token
    search = data.search

    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])
    if not user:
        return jsonify({'status': 'error', 'payload': 'User not found'}), 400

    friends = json.loads(user['friends']) if user.get('friends') else None
    if not search:
        raise ValueError("Search parameter must not be empty")

    try:
        search_int = int(search)
        is_int = True
    except ValueError:
        is_int = False

    if is_int:
        query = 'SELECT * FROM users WHERE uid=$1::bigint'
        params = [search_int]
    else:
        query = 'SELECT * FROM users WHERE username ILIKE $1'
        params = [f'%{search}%']

    friend = await current_app.pool.fetch(query, *params)
    _f = []
    for f in friend:
        if is_int and f['uid'] != search_int:
            continue
        status = 'request already sent' if friends and 'requests' in friends and f['uid'] in friends['requests'] else 'not friends'
        _f.append({
            'uid': str(f['uid']),
            'username': f['username'],
            'avatar': f['avatar'],
            'status': status,
            'bio': f['bio']
        })

    return jsonify({'status': 'success', 'payload': _f})

@api_bp.route('/friends/request', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(SendRequestSchema)
async def send_friend_request(data):
    """Send a friend request to another user.

    Request JSON
    ------------
    token : str
        The session token of the user.
    friend_id : int
        The ID of the user to send a friend request to.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    payload : str
        The result of the friend request process.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    payload : str
        The error message.
    """
    token = data.token
    friend_id = data.friend_id

    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])

    friend = await current_app.pool.fetchrow('SELECT * FROM users WHERE uid=$1', int(friend_id))

    if not user or not friend:
        return jsonify({'status': 'error', 'payload': 'User not found'})

    user_friends = json.loads(user['friends']) if user.get('friends') else None
    friend_friends = json.loads(friend['friends']) if friend.get('friends') else None

    if friend_friends:
        for f in friend_friends['accepted']:
            if f['uid'] == int(user['uid']):
                return jsonify({'status': 'error', 'payload': 'Already friends'})
            pass

    if user_friends:
        if int(friend_id) in user_friends['accepted']:
            return jsonify({'status': 'error', 'payload': 'Already friends'})

    if not friend_friends:
        friend_friends = {
            'accepted': [],
            'requests': [],
            'blocked': []
        }

    if not user_friends:
        user_friends = {
            'accepted': [],
            'requests': [],
            'blocked': []
        }

    if user['uid'] in friend_friends['requests']:
        return jsonify({'status': 'error', 'payload': 'Request already sent'})

    if user_friends:
        if friend['uid'] in user_friends['requests']:
            return jsonify({'status': 'error', 'payload': 'Pending request'})

    friend_friends['requests'].append(user['uid'])

    await current_app.pool.execute(
        'UPDATE users SET friends=$1 WHERE uid=$2',
        json.dumps(friend_friends),
        int(friend_id)
    )

    if not user_friends:
        await current_app.pool.execute(
            'UPDATE users SET friends=$1 WHERE uid=$2',
            json.dumps({'requests': [friend['uid']]}),
            user['uid']
        )

    return jsonify({'status': 'success', 'payload': 'Friend request sent'})

@api_bp.route('/friend/request/handle', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(HandleFriendRequestSchema)
async def handle_friend_request(data):
    """Handle incoming friend requests (accept or reject).

    Request JSON
    ------------
    token : str
        The session token of the user.
    friend_id : int
        The ID of the user who sent the friend request.
    action : str
        The action to take ('accept' or 'reject').

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    payload : str
        The result of the friend request process.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    payload : str
        The error message.
    """
    token = data.token
    request_uid = data.request_uid
    action = data.action

    log.info(f"Data: {data}")

    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])
    friend = await current_app.pool.fetchrow('SELECT friends FROM users WHERE uid=$1', int(request_uid))

    log.info(f"Searching {request_uid} in {json.loads(user['friends'])['requests']}")

    if not user or not friend:
        return jsonify({'status': 'error', 'payload': 'User not found'}), 400

    if not friend['friends']:
        friend_friends = {
            'accepted': [],
            'requests': [],
            'blocked': []
        }
    else:
        friend_friends = json.loads(friend['friends'])

    if not user['friends']:
        user_friends = {
            'accepted': [],
            'requests': [],
            'blocked': []
        }
    else:
        user_friends = json.loads(user['friends'])

    if action == 'accept':
        user_friends['requests'].remove(int(request_uid))
        user_friends['accepted'].append({'uid': int(request_uid), 'friends_since': datetime.datetime.now().isoformat()})
        friend_friends['accepted'].append({'uid': user['uid'], 'friends_since': datetime.datetime.now().isoformat()})
        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(user_friends), user['uid'])
        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(friend_friends), int(request_uid))

    elif action == 'deny':
        user_friends['requests'].remove(int(request_uid))
        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(user_friends), user['uid'])

    return jsonify({'status': 'success', 'payload': f'Friend request {action}ed'}), 200

@api_bp.route('/friends/<token>', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
async def friends_list(token):
    """Get the list of friends for the authenticated user.

    Parameters
    ----------
    token : str
        The session token of the user.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    payload : list
        The list of friends.
            - uid : str
                The UID of the friend.
            - username : str
                The username of the friend.
            - avatar : str
                The avatar of the friend.
            - bio : str
                The bio of the friend.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    payload : str
        The error message.
    """
    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])

    if not user:
        return jsonify({'status': 'error', 'payload': 'User not found'}), 400

    if not user.get('friends'):
        return jsonify({'status': 'error', 'payload': 'No friends found'}), 400
    
    friends = json.loads(user['friends'])

    friends_data = []
    for f in friends['accepted']:
        friend = await current_app.pool.fetchrow('SELECT * FROM users WHERE uid=$1', int(f['uid']))
        friends_data.append({
            'uid': str(friend['uid']),
            'username': friend['username'],
            'avatar': friend['avatar'],
            'bio': friend['bio']
        })

    return jsonify({'status': 'success', 'payload': friends_data}), 200

@api_bp.route('/friends/requests/in-out', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(Token)
async def friends_requests(data):
    """Get incoming and outgoing friend requests for the authenticated user.

    Request JSON
    ------------
    token : str
        The session token of the user.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    payload : dict
        The incoming and outgoing friend requests.
            - in : list
                - uid : str
                    The UID of the user who sent the friend request.
                - username : str
                    The username of the user who sent the friend request.
                - avatar : str
                    The avatar of the user who sent the friend request.
                - bio : str
                    The bio of the user who sent the friend request.
            - out : list
                - uid : str
                    The UID of the user to whom the friend request was sent.
                - username : str
                    The username of the user to whom the friend request was sent.
                - avatar : str
                    The avatar of the user to whom the friend request was sent.
                - bio : str
                    The bio of the user to whom the friend request was sent.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    payload : str
        The error message.
    """
    token = data.token

    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])

    if user.get('friends'):
        friends = json.loads(user['friends'])

        requests = friends['requests']
        _in = []
        for uid in requests:
            friend = await current_app.pool.fetchrow('SELECT * FROM users WHERE uid=$1', uid)
            _in.append({
                'uid': str(friend['uid']),
                'username': friend['username'],
                'avatar': friend['avatar'],
                'bio': friend['bio']
            })

        _out = []
        all_users = await current_app.pool.fetch('SELECT * FROM users')
        for u in all_users:
            if u.get('friends'):
                _friends = json.loads(u['friends'])
                if user['uid'] in _friends['requests']:
                    _out.append({
                        'uid': str(u['uid']),
                        'username': u['username'],
                        'avatar': u['avatar'],
                        'bio': u['bio']
                    })

        return jsonify({'status': 'success', 'payload': {'in': _in, 'out': _out}}), 200
    return jsonify({'status': 'error', 'payload': 'No friend requests found'}), 400

@api_bp.route('/friends/handle', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(HandleFriendsSchema)
async def handle_friends(data):
    """Handle friend actions (accept, reject, block).

    Request JSON
    ------------
    token : str
        The session token of the user.
    action : str
        The action to take ('accept', 'reject', 'block').
    friend_id : str
        The UID of the friend to take action on.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    payload : str
        The result of the friend action process.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    payload : str
        The error message.
    """
    token = data.token
    action = data.action
    friend_id = data.friend_uid

    _pt = SessionManager.parse_cookie(token)
    user = await SessionManager.validate_token(_pt['raw']['token'])
    friend = await current_app.pool.fetchrow('SELECT friends FROM users WHERE uid=$1', int(friend_id))

    if not user or not friend:
        return jsonify({'status': 'error', 'payload': 'User not found'}), 400

    if not user.get('friends'):
        return jsonify({'status': 'error', 'payload': 'No friends found'}), 400

    user_friends = json.loads(user['friends'])
    friend_friends = json.loads(friend['friends']) if friend.get('friends') else None

    if action == 'remove':
        if 'accepted' in user_friends:
            for f in user_friends['accepted']:
                if f['uid'] == int(friend_id):
                    user_friends['accepted'].remove(f)
                    break

        if 'accepted' in friend_friends:
            for f in friend_friends['accepted']:
                if f['uid'] == int(user['uid']):
                    friend_friends['accepted'].remove(f)
                    break

        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(user_friends), user['uid'])
        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(friend_friends), int(friend_id))

        return jsonify({'status': 'success', 'payload': 'Friend removed'})
    
    elif action == 'block':
        if 'accepted' in user_friends:
            for f in user_friends['accepted']:
                if f['uid'] == int(friend_id):
                    user_friends['accepted'].remove(f)
                    break

        if 'accepted' in friend_friends:
            for f in friend_friends['accepted']:
                if f['uid'] == int(user['uid']):
                    friend_friends['accepted'].remove(f)
                    break

        if 'blocked' not in user_friends:
            user_friends['blocked'] = []

        if 'blocked' not in friend_friends:
            friend_friends['blocked'] = []

        user_friends['blocked'].append({'uid': int(friend_id), 'blocked_since': datetime.datetime.now().isoformat()})
        friend_friends['blocked'].append({'uid': user['uid'], 'blocked_since': datetime.datetime.now().isoformat()})

        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(user_friends), user['uid'])
        await current_app.pool.execute('UPDATE users SET friends=$1 WHERE uid=$2', json.dumps(friend_friends), int(friend_id))

        return jsonify({'status': 'success', 'payload': 'Friend blocked'})


@api_bp.route('/env', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(EnvSchema)
async def get_env(data):
    """Get environment settings based on the provided key.

    Request JSON
    ------------
    key : str
        The key of the environment setting to retrieve.

    Returns
    -------
    200 OK
    ---------
    key : str
        The value of the environment setting.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    payload : str
        The error message.
    """
    _vv = {
        "recaptcha_token": _WebSettings.RECAPTCHA_TOKEN,
        "google_client_id": _WebSettings.GOOGLE_CLIENT_ID,
        "u:/": _WebSettings.URLS,
    }

    return jsonify({'key': _vv[data.key]}), 200

@api_bp.route('/username/availability', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
@requires(UsernameSchema)
async def check_username(data):
    """Check the availability of a username.

    Request JSON
    ------------
    username : str
        The username to check for availability.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    message : str
        The result of the availability check.
    result : bool
        Whether the username is available or not.

    400 Bad Request
    ---------------
    status : str
        The status of the request process.
    message : str
        The error message.
    """

    user = await current_app.pool.fetchrow("SELECT * FROM users WHERE username = $1", data.username)
    if user:
        return {"status": "error", "message": "This username is already taken.", "result": False}, 400
    else:
        return {"status": "success", "message": "This username is available.", "result": True}, 200
    
@api_bp.route('/messages/<user_uid>', methods=['POST'])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
async def get_messages(user_uid):
    """Get the messages between the authenticated user and another user.

    Parameters
    ----------
    user_uid : str
        The UID of the other user.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the request process.
    payload : list
        The list of messages.
            - message : str
                The message content.
            - sender : str
                The UID of the sender.
            - receiver : str
                The UID of the receiver.
            - timestamp : str
                The timestamp of the message.
    """
    uid_cookie = request.cookies.get('_sho-session')
    if uid_cookie:
        uid_data = SessionManager.parse_cookie(uid_cookie)
        data = await SessionManager.validate_token(uid_data['raw']['token'])

        messages = await current_app.pool.fetch(
            "SELECT * FROM messages WHERE (sender_uid=$1 AND receiver_uid=$2) OR (sender_uid=$2 AND receiver_uid=$1) ORDER BY sent_at ASC",
            data['uid'],
            int(user_uid)
        )

        return jsonify({"status": "success", "payload": dict(messages)})


@api_bp.route("/generate_build", methods=["POST"])
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
async def gen_build():
    """Generate a build based on the provided files and payload.

    Request Headers
    ---------------
    User-Agent : str
        The User-Agent header of the request, indicating the client device type.

    Request Form Data
    -----------------
    confirmPayload : optional

    Request Files
    -------------
    files : list of files
        The files to be processed.

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the build process.
    result : dict
        The result of the build process.

    400 Bad Request
    ---------------
    status : str
        The status of the build process.
    result : str
        The error message.
    """
    user_agent = request.headers.get('User-Agent').lower()

    if 'windows' in user_agent:
        device_type = 'desktop'
    else:
        device_type = 'mobile'

    files = await request.files
    form = await request.form
    confirm_payload = form.get('confirmPayload')

    data = bool(confirm_payload)

    result = await PIL.process_images(
        files,
        current_app,
        is_mobile=device_type == 'mobile',
        is_rover=data
    )

    return jsonify({"status": "success", "result": result}), 200