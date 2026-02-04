from google.cloud import recaptchaenterprise_v1
from google.protobuf.json_format import MessageToDict
import logging

log = logging.getLogger("hypercorn")
log.setLevel(logging.INFO)

async def create_assessment(
    project_id: str, recaptcha_key: str, token: str, recaptcha_action: str
) -> dict:
    """Crea una valutazione per analizzare il rischio di un'azione della UI.
    Args:
        project_id: L'ID del tuo progetto Google Cloud.
        recaptcha_key: La chiave reCAPTCHA associata al sito o all'app
        token: Il token generato ottenuto dal client.
        recaptcha_action: Nome dell'azione corrispondente al token.
    """

    client = recaptchaenterprise_v1.RecaptchaEnterpriseServiceClient()

    # Imposta le proprietà dell'evento da monitorare.
    event = recaptchaenterprise_v1.Event()
    event.site_key = recaptcha_key
    event.token = token

    assessment = recaptchaenterprise_v1.Assessment()
    assessment.event = event

    project_name = f"projects/{project_id}"

    # Crea la richiesta di valutazione.
    request = recaptchaenterprise_v1.CreateAssessmentRequest()
    request.assessment = assessment
    request.parent = project_name

    response = client.create_assessment(request)

    # Verifica che il token sia valido.
    if not response.token_properties.valid:
        log.info(
            "The CreateAssessment call failed because the token was "
            + "invalid for the following reasons: "
            + str(response.token_properties.invalid_reason)
        )
        return {"error": "Invalid token", "reason": response.token_properties.invalid_reason}

    # Controlla se è stata eseguita l'azione prevista.
    if response.token_properties.action != recaptcha_action:
        log.info(
            "The action attribute in your reCAPTCHA tag does"
            + "not match the action you are expecting to score"
        )
        return {"error": "Invalid action", "reason": response.token_properties.action}
    else:
        # Ottieni il punteggio di rischio e i motivi.
        # Per ulteriori informazioni sull'interpretazione del test, consulta:
        # https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment

        if (round(response.risk_analysis.score, 2) * 100) in [0.1, 0.3]:
            log.info(f"Risk score: {round(response.risk_analysis.score, 2) * 100}")
            log.info(f"Reasons: {response.risk_analysis.reasons}")
            return {
                "status": "failed",
                "score": round(response.risk_analysis.score, 2) * 100,
                "reasons": response.risk_analysis.reasons,
            }

    response_dict = MessageToDict(response._pb)
    return response_dict