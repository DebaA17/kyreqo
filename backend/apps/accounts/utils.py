import os
import requests

def validate_turnstile_token(token, ip_address=None):
    secret = os.getenv('TURNSTILE_SECRET_KEY')
    if not secret:
        # If no secret is configured (e.g. in local development), bypass validation
        return True
    
    if not token:
        return False
        
    try:
        data = {
            'secret': secret,
            'response': token
        }
        if ip_address:
            data['remoteip'] = ip_address
            
        res = requests.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data=data,
            timeout=5
        )
        res_data = res.json()
        return res_data.get('success', False)
    except Exception:
        return False
