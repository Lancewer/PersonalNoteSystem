import os
import uuid
from datetime import datetime
from fastapi import UploadFile
from ..config import settings

ALLOWED_TYPES = {
    "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "audio": ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"],
}

MAX_SIZES = {
    "image": 5 * 1024 * 1024,  # 5MB
    "audio": 10 * 1024 * 1024,  # 10MB
}


def get_file_type(content_type: str) -> str:
    for file_type, types in ALLOWED_TYPES.items():
        if content_type in types:
            return file_type
    return "file"


def generate_file_path(file_type: str, original_name: str) -> str:
    now = datetime.now()
    date_dir = now.strftime("%Y/%m/%d")
    timestamp = now.strftime("%Y%m%dT%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    ext = os.path.splitext(original_name)[1] or f".{file_type}"
    filename = f"{file_type}_{timestamp}_{unique_id}{ext}"
    return f"{date_dir}/attachment/{filename}"


async def save_upload_file(upload_file: UploadFile) -> dict:
    content = await upload_file.read()
    file_type = get_file_type(upload_file.content_type or "")
    max_size = MAX_SIZES.get(file_type, 10 * 1024 * 1024)

    if len(content) > max_size:
        raise ValueError(f"File too large. Max size: {max_size / 1024 / 1024}MB")

    file_path = generate_file_path(file_type, upload_file.filename)
    full_path = os.path.join(settings.UPLOAD_DIR, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with open(full_path, "wb") as f:
        f.write(content)

    return {
        "file_path": file_path,
        "file_type": file_type,
        "file_size": len(content),
    }
