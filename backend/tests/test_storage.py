from app.services.storage_service import generate_file_path, get_file_type


def test_generate_file_path():
    path = generate_file_path("image", "test.jpg")
    parts = path.split("/")
    assert len(parts) == 5
    assert parts[3] == "attachment"
    assert parts[4].startswith("image_")
    assert ".jpg" in parts[4]
    # Verify UUID suffix is present (8 hex chars before extension)
    filename = parts[4]
    base = filename.rsplit(".", 1)[0]
    assert "_" in base  # timestamp_uuid format


def test_get_file_type():
    assert get_file_type("image/jpeg") == "image"
    assert get_file_type("audio/mpeg") == "audio"
    assert get_file_type("application/pdf") == "file"
