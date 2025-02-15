from cryptography.fernet import Fernet
from ..config import settings


class Encryption:
    def __init__(self):
        self.fernet = Fernet(settings.ENCRYPTION_KEY)

    def encrypt(self, data: str) -> str:
        """Шифрование данных"""
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, data: str) -> str:
        """Расшифровка данных"""
        return self.fernet.decrypt(data.encode()).decode()


encryption = Encryption()