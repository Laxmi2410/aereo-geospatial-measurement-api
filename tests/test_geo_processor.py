import os
import tempfile
import pytest
from pathlib import Path
from app.services.geo_processor import parse_kml_fallback, process_geospatial_file, GeoProcessingError

SAMPLE_KML_CONTENT = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Polygon</name>
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
  </Document>
</kml>"""

def test_parse_kml_fallback():
    with tempfile.NamedTemporaryFile("w", suffix=".kml", delete=False) as tf:
        tf.write(SAMPLE_KML_CONTENT)
        tf_path = Path(tf.name)

    try:
        features, crs_str = parse_kml_fallback(tf_path)
        assert len(features) == 1
        assert features[0]["properties"]["name"] == "Test Polygon"
        assert features[0]["geometry"].geom_type == "Polygon"
        assert crs_str == "EPSG:4326"
    finally:
        if tf_path.exists():
            tf_path.unlink()

def test_process_kml_file():
    with tempfile.NamedTemporaryFile("w", suffix=".kml", delete=False) as tf:
        tf.write(SAMPLE_KML_CONTENT)
        tf_path = Path(tf.name)

    try:
        res = process_geospatial_file(tf_path, "sample.kml")
        assert res["file_type"] == "KML"
        assert res["feature_count"] == 1
        assert res["features"][0]["geometry_type"] == "Polygon"
        assert res["features"][0]["area_sq_m"] > 0
    finally:
        if tf_path.exists():
            tf_path.unlink()

def test_unsupported_file_extension():
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tf:
        tf.write("dummy content")
        tf_path = Path(tf.name)

    try:
        with pytest.raises(GeoProcessingError):
            process_geospatial_file(tf_path, "invalid.txt")
    finally:
        if tf_path.exists():
            tf_path.unlink()
