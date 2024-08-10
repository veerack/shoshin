import aiohttp
from quart import Quart, redirect, request, session, render_template, jsonify, Response, url_for
import settings as _WebSettings
import asyncpg
import datetime
import logging
from quartcord import DiscordOAuth2Session
import sentry_sdk
from sentry_sdk.integrations.quart import QuartIntegration
from blueprints.api import api_bp
from blueprints.auth import auth_bp
from blueprints.captchag import captcha_bp
from blueprints.cookies import cookies_bp
import json
from utility.methods import requires_valid_session_token, fetch_achievements, require_api_key, register_routes_with_spec, SessionManager, cookie_check
import base64
from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin

# Initialize APISpec
spec = APISpec(
    title="Shoshin API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[MarshmallowPlugin()],
)

sentry_sdk.init(
    dsn=_WebSettings.SENTRY_DSN,
    integrations=[QuartIntegration()],
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

def format_datetime(value, format='%d %b %Y, %I:%M %p'):
    """Format a timestamp to a readable date."""
    return datetime.datetime.fromtimestamp(value).strftime(format)

async def get_patrons():
    url = 'https://www.patreon.com/api/oauth2/v2/campaigns/6344774/members'
    headers = {
        'Authorization': f'Bearer {_WebSettings.PATREON_ACCESS_TOKEN}',
        'Content-Type': 'application/json',
    }

    params = {
        'include': 'user,currently_entitled_tiers',
        'fields[member]': 'full_name,patron_status',
        'fields[user]': 'full_name,image_url',
        'fields[tier]': 'title'
    }
    r = await app.session.get(url, headers=headers, params=params)
    return await r.json()

class WebQuart(Quart):
    def __init__(self, name, static_folder):
        super().__init__(name, static_folder=static_folder)
        self.pool: asyncpg.Pool = None
        self.discord: DiscordOAuth2Session = None
        self.session: aiohttp.ClientSession = None

    async def get_pool(self) -> asyncpg.Pool:
        return self.pool

app = WebQuart(__name__, static_folder="./static")
app.secret_key = b"random bytes representing quart secret key"

log = logging.getLogger("hypercorn")
log.setLevel(logging.INFO)

handler = logging.StreamHandler()
log.addHandler(handler)

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB
app.jinja_env.filters['datetime'] = format_datetime

# Register blueprints
app.register_blueprint(api_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(captcha_bp)
app.register_blueprint(cookies_bp)

@app.before_serving
async def startup():
    app.pool = await asyncpg.create_pool(_WebSettings.DB)
    print(f"[DATABASE] Connected: {app.pool}")
    app.session = aiohttp.ClientSession()
    app.spec = spec
    register_routes_with_spec(app, app.spec, [api_bp, auth_bp])

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/patrons', methods=['GET'])
async def patrons():
    data = await get_patrons()
    return jsonify(data)

@app.route('/proxy')
async def proxy():
    url = request.args.get('url')
    if not url:
        app.logger.error("URL parameter is missing")
        return Response("URL parameter is missing", status=400)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    app.logger.error(f"Error fetching the resource: {resp.status}")
                    return Response("Error fetching the resource", status=resp.status)
                data = await resp.read()
                return Response(data, content_type=resp.content_type)
    except Exception as e:
        app.logger.error(f"Error occurred: {str(e)}")
        return Response(f"Error occurred: {str(e)}", status=500)

@app.route("/privacy")
async def privacy():
    return await render_template("legal/privacy.html")

@app.route("/terms")
async def terms():
    return await render_template("legal/terms.html")

@app.route("/guidelines")
async def cguidelines():
    return await render_template("legal/cguidelines.html")

@app.route("/wuwa/news/publish", methods=["POST"])
async def wuwanews():
    data = await request.get_json()
    if not data:
        return {"status": "error", "message": "No data provided."}

    _must_have = [
        "title",
        "content",
        "author",
        "author_image_url",
        "footer",
        "date"
    ]

    if not all([x in data for x in _must_have]):
        return {"status": "error", "message": "Missing required fields: {}".format(", ".join([x for x in _must_have if x not in data]))}

    await app.pool.execute("INSERT INTO news (title, content, author, author_image_url, footer, date) VALUES ($1, $2, $3, $4, $5, $6)", data["title"], data["content"], data["author"], data["author_image_url"], data["footer"], datetime.datetime.utcfromtimestamp(data["date"]))

    return {"status": "success", "payload": data}

@app.route("/", methods=["GET"])
async def home():
    news_entry = await app.pool.fetch("SELECT * FROM news ORDER BY date DESC")
    return await render_template(f"wuwagen.html", news_entry=news_entry)

@app.route("/login")
@cookie_check(cookie_name="_sho-session", redirect='view_profile')
async def login():
    return await render_template("auth/auth.html")

@app.route("/register")
@cookie_check(cookie_name="_sho-session", redirect='view_profile')
async def register():
    return await render_template("auth/register.html")

@app.route("/profile/manage")
@requires_valid_session_token
async def view_profile(data):
    print(data)
    _un = fetch_achievements([json.loads(ach) for ach in data['achievements']])

    _fr = []

    if data['friends']:
        _f = json.loads(data['friends'])
        if len(_f['accepted']) > 0:
            for d in _f['accepted']:
                friend_data = await app.pool.fetchrow("SELECT * FROM users WHERE uid = $1", d['uid'])
                _fr.append(friend_data)

    print(_fr)

    return await render_template("profile/account.html", data=data, achievements=_un, friends=_fr)

@app.route("/u/<uid>/dms")
@cookie_check(cookie_name="_sho-session", redirect='no_redirect')
@requires_valid_session_token
async def dms(data, uid):
    _fr = []

    if data['friends']:
        _f = json.loads(data['friends'])
        if len(_f['accepted']) > 0:
            for d in _f['accepted']:
                friend_data = await app.pool.fetchrow("SELECT * FROM users WHERE uid = $1", d['uid'])
                _fr.append(friend_data)

    # Fetch messages between the current user (uid) and all friends
    messages = []
    if len(_fr) > 0:
        for friend in _fr:
            friend_uid = friend['uid']
            # Fetch messages between current user and this friend
            msgs = await app.pool.fetch(
                """
                SELECT * FROM messages
                WHERE (sender_uid = $1 AND receiver_uid = $2)
                   OR (sender_uid = $2 AND receiver_uid = $1)
                ORDER BY sent_at ASC;
                """,
                int(uid), friend_uid
            )
            messages.append({
                'friend_uid': friend_uid,
                'messages': dict(msgs)
            })

    #log.info(f"Messages between {uid} and {friend_uid}: {messages}")

    return await render_template("dms/dm.html", data=data, uid=uid, friends=_fr, messages=messages)

# Filter only specific routes for documentation
@app.route('/openapi.json')
async def openapi_json():
    paths = {k: v for k, v in spec.to_dict()["paths"].items() if k.startswith(('/api', '/auth'))}
    return jsonify({**spec.to_dict(), "paths": paths})

# Serve the custom documentation page
@app.route('/docs')
@require_api_key
async def docs():
    return await render_template('docs.html')