import jwt
import datetime
import os

def generate_access_token(email,role='user'):
    payload = {
        'email': email,
        'role':role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", 15))),
        'iat': datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, os.getenv("JWT_KEY"), algorithm='HS256')
    return token


def generate_refresh_token(email,role='user'):
    payload = {
        'email': email,
        'role':role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=int(os.getenv("REFRESH_TOKEN_EXPIRES_DAYS", 7))),
        'iat': datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, os.getenv("JWT_REFRESH_KEY"), algorithm='HS256')
    return token


def decode_token(token, is_refresh=False):
    secret = os.getenv("JWT_REFRESH_KEY") if is_refresh else os.getenv("JWT_KEY")
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
