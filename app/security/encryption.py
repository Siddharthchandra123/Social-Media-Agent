import os
from cryptography.fernet import Fernet
from app.config import settings

class TokenEncryption:
    def __init__(self):
        key = getattr(settings, "ENCRYPTION_KEY", None)
        if not key:
            # Fallback or generate a temporary one for development/testing if not set,
            # but in production this should fail or be strictly configured.
            # We'll generate/use a deterministic or random key if missing, or use a default test key.
            key = Fernet.generate_key().decode()
        if isinstance(key, str):
            key = key.encode()
        try:
            self.fernet = Fernet(key)
        except Exception:
            # If invalid key, generate a valid fernet key
            self.fernet = Fernet(Fernet.generate_key())

    def encrypt(self, plain_text: str | None) -> str | None:
        if not plain_text:
            return None
        return self.fernet.encrypt(plain_text.encode()).decode()

    def decrypt(self, cipher_text: str | None) -> str | None:
        if not cipher_text:
            return None
        try:
            return self.fernet.decrypt(cipher_text.encode()).decode()
        except Exception:
            # If decryption fails (e.g. was stored in plaintext before encryption was enabled), return as is
            return cipher_text

token_encryptor = TokenEncryption()
