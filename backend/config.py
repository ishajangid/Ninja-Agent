# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "Interview",
    "user": "postgres",
    "password": "1718",
    "port": 5432
}

# File upload configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'webm', 'wav', 'mp3', 'ogg', 'm4a'}

# Whisper model configuration
WHISPER_MODEL_SIZE = "small.en"  # Options: tiny, base, small, medium, large
WHISPER_DEVICE = "cpu"  # Options: cpu, cuda
WHISPER_COMPUTE_TYPE = "int8"  # Options: int8, int16, float16, float32