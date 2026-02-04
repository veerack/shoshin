from typing import Optional
import msgspec
from functools import wraps
from quart import request, jsonify
import json

def requires(spec_type):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                data = await request.get_json()
                json_data = json.dumps(data).encode('utf-8')  # Convert dict to JSON string and then to bytes
                validated_data = msgspec.json.decode(json_data, type=spec_type)
            except (msgspec.ValidationError, msgspec.DecodeError) as e:
                print("Validation error:", str(e))  # Debugging line
                return jsonify({"msg": str(e)}), 400
            return await func(validated_data, *args, **kwargs)
        return wrapper
    return decorator

class SessionToken(msgspec.Struct):
    token: str
    just_verify: bool
    action: Optional[str] = None

class Authentication(msgspec.Struct):
    email: str
    code: str
    passw: Optional[str] = None
    username: Optional[str] = None
    action: Optional[str] = None

class UserAuth(msgspec.Struct):
    email: str
    action: str
    password: Optional[str] = None

class EnvSchema(msgspec.Struct):
    key: str

class UsernameSchema(msgspec.Struct):
    username: str

class SearchSchema(msgspec.Struct):
    token: str
    search: str

class SendRequestSchema(msgspec.Struct):
    token: str
    friend_id: str

class HandleFriendRequestSchema(msgspec.Struct):
    token: str
    request_uid: str
    action: str

class Token(msgspec.Struct):
    token: str

class HandleFriendsSchema(msgspec.Struct):
    token: str
    friend_uid: str
    action: str

class assetsSchema(msgspec.Struct):
    token: str
    file: str
    type: str