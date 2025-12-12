# auth.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError

SECRET_KEY = "supersecretkey"  # store in .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Use a hashing scheme that does not require native bcrypt install for portability
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

MAX_BCRYPT_BYTES = 72  # bcrypt limit

def hash_password(password: str) -> str:
    # truncate password bytes before hashing (bcrypt limit ~72 bytes)
    # then decode safely to a valid string for passlib
    truncated_bytes = password.encode("utf-8")[:MAX_BCRYPT_BYTES]
    truncated = truncated_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(truncated)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    truncated_bytes = plain_password.encode("utf-8")[:MAX_BCRYPT_BYTES]
    truncated = truncated_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(truncated, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
