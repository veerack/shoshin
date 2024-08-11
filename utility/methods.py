import os
import time
import hashlib
from quart import current_app, request, jsonify, redirect, url_for
import hmac
import datetime
import json
import base64
from functools import wraps
import logging
import re
import settings as _WebSettings

log = logging.getLogger("hypercorn")
log.setLevel(logging.INFO)

secret_key = 'your-secret-key'  # Store this securely, e.g., in environment variables

def parse_docstring(docstring):
    """
    Parse the docstring to extract summary, description, parameters, request body schema, and response schema.
    """
    summary = ""
    description = ""
    request_body = {}
    parameters = []
    responses = {}

    if docstring:
        lines = docstring.strip().split("\n")
        summary = lines[0]
        description_lines = []
        current_section = None
        current_response_code = None

        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue

            section_match = re.match(r"^(Parameters|Request JSON|Request Headers|Request Form Data|Request Files|Returns|200 OK|400 Bad Request)\s*-*\s*$", line)
            if section_match:
                current_section = section_match.group(1)
                if current_section in ["200 OK", "400 Bad Request"]:
                    current_response_code = current_section.split()[0]
                    responses[current_response_code] = {}
                continue

            if current_section in ["Parameters", "Request JSON", "Request Headers", "Request Form Data", "Request Files"]:
                param_match = re.match(r"(\w+)\s*:\s*([\w.]+)\s*(.*)", line)
                if param_match:
                    name, _type, _desc = param_match.groups()
                    if current_section == "Parameters":
                        parameters.append({"name": name, "in": "path", "schema": {"type": _type.lower()}, "description": _desc})
                    else:
                        request_body[name] = {"type": _type.lower(), "description": _desc}
                continue

            if current_section in ["200 OK", "400 Bad Request"]:
                response_match = re.match(r"(\w+)\s*:\s*([\w.]+)\s*(.*)", line)
                if response_match:
                    name, _type, _desc = response_match.groups()
                    responses[current_response_code][name] = {"type": _type.lower(), "description": _desc}
                continue

            description_lines.append(line)

        description = "\n".join(description_lines)

    return summary, description, parameters, request_body, responses

def register_routes_with_spec(app, spec, blueprint: list):
    """Register all routes in a blueprint with the APISpec object.

    Parameters
    ----------
    app : :class:`quart.Quart`
        The Quart application instance.
    spec : :class:`apispec.APISpec`
        The APISpec instance.
    blueprint : :class:`quart.Blueprint`
        The blueprint containing the routes to register.
    """
    for rule in app.url_map.iter_rules():
        for bp in blueprint:
            if rule.endpoint.startswith(f"{bp.name}."):
                log.info(f"Processing rule: {rule}")
                view_func = app.view_functions[rule.endpoint]
                path = str(rule).replace('<', '{').replace('>', '}')  # Convert to OpenAPI path format

                if 'GET' in rule.methods:
                    method = 'get'
                elif 'POST' in rule.methods:
                    method = 'post'
                else:
                    continue

                log.info(f"Adding operation for path: {path} method: {method}")

                # Parse the docstring to get operation details
                summary, description, parameters, request_body, responses = parse_docstring(view_func.__doc__)

                # Define the operation
                operation = {
                    "summary": summary,
                    "description": description,
                    "parameters": parameters,
                    "responses": {}
                }

                for code, schema in responses.items():
                    operation["responses"][code] = {
                        "description": "Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": schema
                                }
                            }
                        }
                    }

                if request_body:
                    operation["requestBody"] = {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": request_body
                                }
                            }
                        }
                    }

                # Directly update the spec paths
                if path not in spec._paths:
                    spec._paths[path] = {}
                spec._paths[path][method] = operation

                # Log the updated spec
                log.info(f"[DOCS] API Paths Updated. Total paths: {len(spec._paths)}")

class SnowflakeIDGenerator:
    """
    A class to generate unique IDs using the Snowflake algorithm.
    The Snowflake algorithm is used to generate unique IDs at a large scale in a distributed environment without the need for a central authority to allocate IDs.
    This class is a Python implementation of the Snowflake algorithm that generates unique IDs using the worker ID, timestamp, and sequence number.
    """
    def __init__(self):
        self.worker_id = os.getpid()
        self.sequence = 0
        self.last_timestamp = -1

    def generate_id(self):
        timestamp = int(time.time() * 1000)

        if timestamp == self.last_timestamp:
            self.sequence = (self.sequence + 1) & 4095
        else:
            self.sequence = 0

        self.last_timestamp = timestamp

        return (timestamp << 22) | (self.worker_id << 12) | self.sequence

class SessionManager:
    def __init__(self):
        pass

    @staticmethod
    def create_session_token(username):
        token = hashlib.sha256(f"{username}{time.time()}".encode()).hexdigest()
        return token

    @staticmethod
    async def verify_session_token(token, just_verify: bool = True):
        _v = await current_app.pool.fetchrow("SELECT * FROM sessions WHERE token = $1", token)
        if just_verify:
            if not _v:
                return {"status": "error", "payload": False}
            return {"status": "success", "payload": True}

        if not _v:
            return {"status": "error", "payload": "Invalid", "message": "Invalid session token."}

        data = await current_app.pool.fetchrow("SELECT * FROM users WHERE uid = $1", _v['uid'])
        if not data:
            return {"status": "error", "payload": "Invalid", "message": "Unable to find user."}

        return {"status": "success", "payload": data}

    @staticmethod
    async def validate_token(token):
        data = await SessionManager.verify_session_token(token, False)
        if data['status'] == "error":
            if data['message'] == "Invalid session token.":
                return jsonify({'status': 'error', 'payload': 'Invalid session token'}), 400
            return redirect(url_for('login'))

        return data['payload']

    @staticmethod
    def sign_cookie(value):
        return hmac.new(secret_key.encode(), value.encode(), hashlib.sha256).hexdigest()

    @staticmethod
    def parse_cookie(cookie):
        value, signature = cookie.rsplit('.', 1)
        if SessionManager.sign_cookie(value) != signature:
            return jsonify({'message': 'Invalid cookie signature'}), 403

        # Base64 decode the value
        cookie_value_json = base64.b64decode(value).decode()
        return json.loads(cookie_value_json)

    @staticmethod
    async def set_cookie(response, token, days):
        date = datetime.datetime.utcnow() + datetime.timedelta(days=days)
        expires = date.strftime("%a, %d-%b-%Y %H:%M:%S GMT")

        # Create a dictionary to store both the value and the expiration time
        cookie_value = {'raw': {'token': token, 'expiry': date.timestamp()}}
        cookie_value_json = json.dumps(cookie_value)

        # Base64 encode the JSON string to avoid issues with special characters
        cookie_value_encoded = base64.b64encode(cookie_value_json.encode()).decode()

        signature = SessionManager.sign_cookie(cookie_value_encoded)
        signed_value = f"{cookie_value_encoded}.{signature}"

        response.set_cookie(
            '_sho-session',
            value=signed_value,
            max_age=days * 24 * 60 * 60,
            httponly=True,
            secure=True,
            samesite='Strict',
            expires=expires
        )
        return response

# Function to check API key
def require_api_key(func):
    @wraps(func)
    async def decorated_function(*args, **kwargs):
        if request.args.get('k') == _WebSettings.API_KEY:
            return await func(*args, **kwargs)
        else:
            return jsonify({"message": "Forbidden"}), 403
    return decorated_function

def requires_valid_origin(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        origin = request.headers.get('Origin')
        allowed_origin = "https://beta.shoshin.moe"
        if origin != allowed_origin:
            return jsonify({"msg": "Forbidden"}), 403
        return await func(*args, **kwargs)
    return wrapper

"""
This decorator checks if a valid session token is provided in the following way:
    uid_cookie = request.cookies.get('_sho-session')
    if uid_cookie:
        _c = parse_cookie(uid_cookie)
        uid_data = json.loads(_c)

        data = await validate_token(uid_data['raw']['token'], False)
"""
def requires_valid_session_token(func):
    @wraps(func)
    async def wrapper_session(*args, **kwargs):
        uid_cookie = request.cookies.get('_sho-session')
        if uid_cookie:
            uid_data = SessionManager.parse_cookie(uid_cookie)

            validation_result = await SessionManager.validate_token(uid_data['raw']['token'])
            if isinstance(validation_result, tuple):
                # validation_result is (response, status_code)
                return validation_result

            # Pass the validated user data to the decorated function
            return await func(data=validation_result, *args, **kwargs)
        return redirect(url_for('login'))
    return wrapper_session

def cookie_check(cookie_name, red: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cookie_value = request.cookies.get(cookie_name)
            if cookie_value:
                if red == "no_redirect":
                    return await func(*args, **kwargs)
                return redirect(url_for(red))
            # If the cookie does not exist, call the original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def fetch_achievements(achievements):
    achivements_icons_folder_path = "https://beta.shoshin.moe/static/achievements"

    achievements_data = {
        "comment_post": {
            "name": "Social Butterfly",
            "description": "People love your comments, you've commented over 500 times!",
            "icon": f"{achivements_icons_folder_path}/comment_post.png"
        },
        "contributor": {
            "name": "Contributor",
            "description": "Developers love you, you've contributed to this project!",
            "icon": f"{achivements_icons_folder_path}/contributor.png"
        },
        "create_account": {
            "name": "One Of Us",
            "description": "Brave enough to join us, nothing less than a hero!",
            "icon": f"{achivements_icons_folder_path}/create_account.png"
        },
        "leave_a_like": {
            "name": "Sharing Love",
            "description": "Can't stop liking posts, you've liked over 1.500 posts!",
            "icon": f"{achivements_icons_folder_path}/leave_a_like.png"
        },
        "link_discord": {
            "name": "Multi-Platform",
            "description": "Uh-oh? Discord? Everything is connected!",
            "icon": f"{achivements_icons_folder_path}/link_discord.png"
        },
        "one_year": {
            "name": "Veteran",
            "description": "Not even moving, you've been here for over a year!",
            "icon": f"{achivements_icons_folder_path}/one_year.png"
        },
        "repost_post": {
            "name": "Repost King",
            "description": "Don't you get tired of reposting? You've reposted over 500 posts!",
            "icon": f"{achivements_icons_folder_path}/repost_post.png"
        },
        "select_gender": {
            "name": "Identified",
            "description": "They/them? He/him? She/her? Who knows... You do!",
            "icon": f"{achivements_icons_folder_path}/select_gender.png"
        },
        "special": {
            "name": "Truly Special",
            "description": "You're special! (seriously, you are)",
            "icon": f"{achivements_icons_folder_path}/special.png"
        },
        "upload_picture": {
            "name": "Memory Keeper",
            "description": "Every picture tells a story, you've uploaded over 200 pictures!",
            "icon": f"{achivements_icons_folder_path}/upload_picture.png"
        },
        "upload_video": {
            "name": "Videographer",
            "description": "Lights, camera, action! You've uploaded over 200 videos!",
            "icon": f"{achivements_icons_folder_path}/upload_video.png"
        }
    }

    for ach in achievements:
        if ach['name'] in achievements_data:
            achievements_data[ach['name']]['time'] = ach['time']

    return {
        "owned": [achievements_data[ach['name']] for ach in achievements if ach['name'] in achievements_data],
        "not_owned": [achievements_data[ach] for ach in achievements_data if ach not in [ac['name'] for ac in achievements]]
    }

    