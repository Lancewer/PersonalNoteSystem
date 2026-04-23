from pydantic import BaseModel
from uuid import UUID


class AttachmentUploadResponse(BaseModel):
    id: UUID
    file_type: str
    file_path: str
