from quart import request, Blueprint
import settings as _WebSettings
from utility.grecaptcha import create_assessment

captcha_bp = Blueprint('captcha', __name__, url_prefix='/captcha')

@captcha_bp.route("/google/recaptcha/verify", methods=["POST"])
async def verify_recaptcha():
    data = await request.get_json()
    if not data:
        return {"status": "error", "message": "No data provided."}

    if not all([x in data for x in ["token", "action"]]):
        return {"status": "error", "message": "Missing required fields: token, action"}

    assessment = await create_assessment(
        _WebSettings.RECAPTCHA_PROJECT_ID,
        _WebSettings.RECAPTCHA_KEY,
        data["token"],
        data["action"]
    )

    return {"status": "success", "payload": assessment}