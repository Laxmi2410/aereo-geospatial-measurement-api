import os
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

SAMPLE_KML = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Survey Field Alpha</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              77.5946,12.9716,0 77.5960,12.9716,0 77.5960,12.9725,0 77.5946,12.9725,0 77.5946,12.9716,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>Access Road</name>
      <LineString>
        <coordinates>
          77.5900,12.9700,0 77.5920,12.9710,0 77.5950,12.9730,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>"""

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_upload_and_get_measurements():
    with tempfile.NamedTemporaryFile("w+", suffix=".kml", delete=False) as tmp:
        tmp.write(SAMPLE_KML)
        tmp.seek(0)
        tmp_path = Path(tmp.name)

    try:
        with open(tmp_path, "rb") as f:
            upload_resp = client.post(
                "/api/files/",
                files={"file": ("test_survey.kml", f, "application/vnd.google-earth.kml+xml")}
            )
        
        assert upload_resp.status_code == 201
        data = upload_resp.json()
        assert "id" in data
        file_id = data["id"]
        assert data["feature_count"] == 2
        assert data["status"] == "COMPLETED"

        # Test GET /api/files/{id}/
        info_resp = client.get(f"/api/files/{file_id}/")
        assert info_resp.status_code == 200
        info_data = info_resp.json()
        assert info_data["filename"] == "test_survey.kml"
        assert info_data["feature_count"] == 2
        assert "EPSG:32643" in info_data["projected_crs"]

        # Test GET /api/files/{id}/measurements/
        meas_resp = client.get(f"/api/files/{file_id}/measurements/")
        assert meas_resp.status_code == 200
        meas_data = meas_resp.json()
        assert len(meas_data["measurements"]) == 2
        
        # Verify Polygon measurement
        poly_feat = meas_data["measurements"][0]
        assert poly_feat["geometry_type"] == "Polygon"
        assert poly_feat["area_sq_m"] > 0
        assert poly_feat["measurement_unit"] == "sq_m"

        # Verify LineString measurement
        line_feat = meas_data["measurements"][1]
        assert line_feat["geometry_type"] == "LineString"
        assert line_feat["length_m"] > 0
        assert line_feat["measurement_unit"] == "meters"

        # Test DELETE /api/files/{id}/
        del_resp = client.delete(f"/api/files/{file_id}/")
        assert del_resp.status_code == 200

        # Verify file is deleted
        get_deleted = client.get(f"/api/files/{file_id}/")
        assert get_deleted.status_code == 404

    finally:
        if tmp_path.exists():
            tmp_path.unlink()

def test_invalid_file_extension():
    with tempfile.NamedTemporaryFile("w+", suffix=".csv", delete=False) as tmp:
        tmp.write("invalid,data")
        tmp.seek(0)
        tmp_path = Path(tmp.name)

    try:
        with open(tmp_path, "rb") as f:
            resp = client.post(
                "/api/files/",
                files={"file": ("invalid.csv", f, "text/csv")}
            )
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.json()["detail"]
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

def test_file_not_found():
    resp = client.get("/api/files/nonexistent_id/")
    assert resp.status_code == 404
