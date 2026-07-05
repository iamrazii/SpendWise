from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from app.core.config import Settings



pwd_context = CryptContext(schemes=["bcrypt"] , deprecated = "auto")

def get_password_hash(password:str) ->str:
    return pwd_context.hash(password)

def verify_password(plain_password:str, hashed_password:str) -> bool:
    return pwd_context.verify(plain_password,hashed_password)

def create_access_token(data:dict, expires_delta: Optional[timedelta] = None):
    encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    encode["exp"] = expire
    encoded_jwt = jwt.encode(encode,Settings.SECRET_KEY, Settings.ALGORITHM)
    return encoded_jwt
