'''
This file is the blueprint for the authentication routes. It handles the registration, login, and verification of users.

Legends:
    - app: The Quart application instance.
    - bcrypt: A password hashing library.
    - SnowflakeIDGenerator: A class to generate unique IDs using the Snowflake algorithm.
    - create_session_token: A function to create a session token.
    - verify_session_token: A function to verify a session token.
    - SendGridAPIClient: A class to send emails using the SendGrid API.

Routes & Their Functions:
    - /auth/verify [POST]: This route is used to verify the user's email and password. 
      It checks if the email is already registered and sends a verification email if 
      the user is registering. If the user is logging in, it sends an email with a verification code for MFA if enabled.
      We use this route mainly on login and registration pages, referring to the action parameter.

    - /auth/verify/code [POST]: This route is used to verify the verification code sent to the user's email.
        It checks if the code is correct and proceeds with the registration or login process.
        We use this route mainly on the verification page, referring to the action parameter.

    - /auth/verify/session [POST]: This route is used to verify the session token.
        It checks if the session token is valid and returns a success message if it is.
        We use this route mainly on the account page to check if the user is logged in, but it can be used as well
        on the login and register pages to check if the user is already logged in.

    - get_location: This function is used to get the location of the user using their IP address.

Javascript Reference:
    - ./static/js/auth/_proxy.js: Here we have all the auth routes masked using ASCII characters to prevent direct access to the routes. In order:
        # auth.py
        - /auth/verify > _pl
        - /auth/verify/code > _pvc
        - /auth/verify/session > _pv

        # api.py
        - /api/env > _pe

        # captchag.py
        - /captcha/google/recaptcha/verify > _px
'''

from quart import Blueprint, current_app, request, jsonify, make_response
import settings as _WebSettings
import bcrypt
import random
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import asyncio
import aiohttp
from utility.methods import SnowflakeIDGenerator, requires_valid_origin, SessionManager
from utility.schemas import Authentication, SessionToken, UserAuth, requires
import json
import datetime
from quart_cors import cors, route_cors

idgen = SnowflakeIDGenerator()

async def get_location(ip):
    """
    Get the location of the user using their IP address.

    Parameters
    ----------
    ip : str
        The IP address of the user.

    Returns
    -------
    dict
        A dictionary containing the city and country of the user.
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://ipinfo.io/{ip}/json') as resp:
            if resp.status == 200:
                data = await resp.json()
                return {'city': data['city'], 'country': data['country']}
            else:
                return None

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route("/verify", methods=["POST"])
@requires(UserAuth)
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
async def auth_verify(data):
    """
    Verify the user's email and password. If the user is registering, send a verification email. 
    If the user is logging in, send an email with a verification code for MFA if enabled.

    Request JSON
    ------------
    action : str
        The action to perform ('register' or 'login').
    email : str
        The email of the user.
    password : str, optional
        The password of the user (required for login).

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the verification process.
    payload : str
        The result of the verification.
    mfa : str
        Whether MFA is required or not.
    raw : dict
        The raw data of the user.

    400 Bad Request
    ---------------
    status : str
        The status of the verification process.
    payload : str
        The result of the verification.
    error : str
        The error message.
    """
    if data.action == "register":
        user = await current_app.pool.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
        if user:
            return {"status": "error", "payload": "This email is already registered. Please login."}
        
        message = Mail(
            from_email='no-reply@shoshin.moe',
            to_emails=data.email,
            subject='Welcome to Shoshin!'
        )

        # Generate a 6-digit verification code using random.randint
        vc = random.randint(100000, 999999)

        # Check if there is already a code for this email
        existing_code = await current_app.pool.fetchrow("SELECT code FROM verification_codes WHERE email = $1", data.email)
        if existing_code:
            vc = existing_code['code']
        else:
            await current_app.pool.execute("INSERT INTO verification_codes (email, code) VALUES ($1, $2)", data.email, vc)

        message.dynamic_template_data = {
            'VERIFICATION_CODE': vc,
        }
        
        message.template_id = "d-b68f308872694602ae2c6183a0daa077"

        try:
            sg = SendGridAPIClient(_WebSettings.SENDGRID_API_KEY)
            sg.send(message)
            return {"status": "success", "payload": "Email sent"}
        except Exception as e:
            return {"status": "error", "payload": "There was an error sending the email, please try again later.", "error": e}
    
    elif data.action == "login":
        # Get the client's IP address
        client_ip = request.remote_addr
        
        # Check if the X-Forwarded-For header is present (for proxy support)
        if 'X-Forwarded-For' in request.headers:
            client_ip = request.headers['X-Forwarded-For'].split(',')[0].strip()

        user = await current_app.pool.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
        if not user:
            return {"status": "error", "payload": "This email is not registered. Please register."}
        
        if bcrypt.checkpw(data.password.encode('utf-8'), user['password'].encode('utf-8')):

            if user['mfa'] == True:
                message = Mail(
                    from_email='no-reply@shoshin.moe',
                    to_emails=data.email,
                    subject='New Login Request'
                )

                # Generate a 6-digit verification code using random.randint
                vc = random.randint(100000, 999999)

                # Check if there is already a code for this email
                existing_code = await current_app.pool.fetchrow("SELECT code FROM verification_codes WHERE email = $1", data.email)
                if existing_code:
                    vc = existing_code['code']
                else:
                    await current_app.pool.execute("INSERT INTO verification_codes (email, code) VALUES ($1, $2)", data.email, vc)

                # Get the country from the IP address
                ip_data = await get_location(client_ip)    

                message.dynamic_template_data = {
                    'VERIFICATION_CODE': vc,
                    'user': user['username'],
                    'LOCATION': f"{ip_data['city']}, {ip_data['country']}"
                }
                
                message.template_id = "d-2c2ac49467a24cc9a14ea7b6a826005e"

                try:
                    sg = SendGridAPIClient(_WebSettings.SENDGRID_API_KEY)
                    sg.send(message)
                except Exception as e:
                    return {"status": "error", "payload": "There was an error sending the email, please try again later.", "error": e}

                return {"status": "success", "payload": "Login successful", "mfa": "required", "raw": { "uid": user['uid'], "username": user['username']}}
            else:
                token = SessionManager.create_session_token(user['username'])
                await current_app.pool.execute("INSERT INTO sessions (token, uid) VALUES ($1, $2) ON CONFLICT (token) DO UPDATE SET token = $1", token, int(user['uid']))
                await current_app.pool.execute("UPDATE users SET sessions = array_append(sessions, $2) WHERE uid = $1", int(user['uid']), token)
                
                # Create the response object
                response = await make_response(jsonify({
                    "status": "success",
                    "payload": "Login successful, redirecting you to the account page...",
                    "mfa": "not required",
                    "raw": {"uid": user['uid'], "username": user['username'], "token": token}
                }))
                
                # Set the cookie on the response object
                print(response)
                response = await SessionManager.set_cookie(response, token, 1)
                
                return response
        else:
            return {"status": "error", "payload": "The password you entered is incorrect."}

@auth_bp.route('/verify/code', methods=['POST'])
@requires(Authentication)
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
async def verify_code(data):
    """
    Verify the verification code sent to the user's email. If the code is correct, proceed with the registration or login process.

    Request JSON
    ------------
    action : str
        The action to perform ('register' or 'login').
    email : str
        The email of the user.
    code : int
        The verification code sent to the user's email.
    passw : str, optional
        The password of the user (required for registration).
    username : str, optional
        The username of the user (required for registration).

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the verification process.
    payload : str
        The result of the verification.
    raw : dict
        The raw data of the user.

    400 Bad Request
    ---------------
    status : str
        The status of the verification process.
    payload : str
        The result of the verification.
    error : str
        The error message.
    """
    if data.action == "register":
        if not all([data.email, data.code, data.passw, data.username, data.action]):
            return {"status": "error", "payload": "Missing required fields: email, code, passw, uid, username, action"}
        
        code = await current_app.pool.fetchrow("SELECT * FROM verification_codes WHERE email = $1 AND code = $2", data.email, int(data.code))
        if code:
            await current_app.pool.execute("DELETE FROM verification_codes WHERE email = $1", data.email)
            
            hashed_password = await asyncio.to_thread(bcrypt.hashpw, data.passw.encode('utf-8'), bcrypt.gensalt())
            _uuid = idgen.generate_id()

            token = SessionManager.create_session_token(data.username)
            await current_app.pool.execute("""
                                           INSERT INTO users 
                                           (email, 
                                           password, 
                                           username, 
                                           uid, 
                                           sessions, 
                                           achievements, 
                                           registered_at) 
                                           VALUES ($1, $2, $3, $4, $5, ARRAY[$6::json], $7)
                                           """, 
                                           data.email, hashed_password.decode('utf-8'), data.username, _uuid, [token], json.dumps({'name': 'create_account', 'time': datetime.datetime.now().timestamp()}), datetime.datetime.now()
                                           )
            await current_app.pool.execute("INSERT INTO sessions (token, uid) VALUES ($1, $2)", token, _uuid)

            # Create the response object
            response = await make_response(jsonify({
                "status": "success",
                "payload": "Code is correct, redirecting you to the account page...",
                "raw": { "uid": _uuid, "username": data.username, "token": token}
            }))
        

            # Set the cookie on the response object
            response = await SessionManager.set_cookie(response, token, 1)
            
            return response
        else:
            return {"status": "error", "payload": "The code you entered is incorrect."}
        
    elif data.action == "login":
        code = await current_app.pool.fetchrow("SELECT * FROM verification_codes WHERE email = $1 AND code = $2", data.email, int(data.code))
        if code:
            await current_app.pool.execute("DELETE FROM verification_codes WHERE email = $1", data.email)
            token = SessionManager.create_session_token(data.username)
            uid = await current_app.pool.fetchval("SELECT uid FROM users WHERE email = $1", data.email)
            await current_app.pool.execute("INSERT INTO sessions (token, uid) VALUES ($1, $2)", token, uid)
            await current_app.pool.execute("UPDATE users SET sessions = array_append(sessions, $2) WHERE uid = $1", uid, token)

            # Create the response object
            response = await make_response(jsonify({
                "status": "success",
                "payload": "Code is correct, redirecting you to the account page...",
                "raw": { "uid": uid, "username": data.username, "token": token}
            }))
            
            # Set the cookie on the response object
            response = await SessionManager.set_cookie(response, token, 1)
            
            return response
        else:
            return {"status": "error", "payload": "The code you entered is incorrect."}

@auth_bp.route('/verify/session', methods=['POST'])
@requires(SessionToken)
@route_cors(allow_origin="https://beta.shoshin.moe")
@requires_valid_origin
async def verify_token(data):
    """
    Verify the session token to check if it is valid.

    Request JSON
    ------------
    token : str
        The session token to verify.
    just_verify : bool
        Whether to just verify the token or perform additional actions.
    action : str
        The action to perform (optional).

    Returns
    -------
    200 OK
    ---------
    status : str
        The status of the verification process.
    payload : str
        The result of the verification process.

    400 Bad Request
    ---------------
    status : str
        The status of the verification process.
    payload : str
        The result of the verification process.
    """
    token = data.token
    jv = data.just_verify
    ac = data.action

    verify = await SessionManager.verify_session_token(token, jv)
    
    if verify['status'] == "success":
        return {"status": "success", "payload": "Valid session token."}
    else:
        return {"status": "error", "payload": "Invalid session token."}