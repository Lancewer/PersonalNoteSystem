import tempfile
import os
import shutil
from app.services.storage_service import (
    generate_file_path,
    get_file_type,
    compute_file_hash,
    find_duplicate_in_today_dir,
)


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


def test_compute_file_hash():
    """Same content produces same hash, different content produces different hash."""
    with tempfile.NamedTemporaryFile(delete=False) as f1:
        f1.write(b"same content")
        f1_path = f1.name
    with tempfile.NamedTemporaryFile(delete=False) as f2:
        f2.write(b"same content")
        f2_path = f2.name
    with tempfile.NamedTemporaryFile(delete=False) as f3:
        f3.write(b"different content")
        f3_path = f3.name

    try:
        hash1 = compute_file_hash(f1_path)
        hash2 = compute_file_hash(f2_path)
        hash3 = compute_file_hash(f3_path)

        assert hash1 == hash2  # Same content = same hash
        assert hash1 != hash3  # Different content = different hash
        assert len(hash1) == 32  # MD5 hex length
    finally:
        os.unlink(f1_path)
        os.unlink(f2_path)
        os.unlink(f3_path)


def test_find_duplicate_in_today_dir():
    """Should find existing file with same hash in today's directory."""
    # Create a temp directory structure mimicking today's upload dir
    with tempfile.TemporaryDirectory() as tmpdir:
        today_dir = os.path.join(tmpdir, "2026", "04", "24", "attachment")
        os.makedirs(today_dir)

        # Create an existing file
        existing_file = os.path.join(today_dir, "image_20260424T120000_abc12345.jpg")
        with open(existing_file, "wb") as f:
            f.write(b"unique content for dedup test")

        expected_hash = compute_file_hash(existing_file)

        # Should find the duplicate
        result = find_duplicate_in_today_dir(tmpdir, expected_hash)
        assert result is not None
        assert "image_20260424T120000_abc12345.jpg" in result

        # Should not find a different hash
        result = find_duplicate_in_today_dir(tmpdir, "nonexistenthash")
        assert result is None
