import pytest
from shapely.geometry import Polygon, LineString, Point
from app.services.crs_utils import get_utm_epsg, is_geographic_crs, calculate_geometry_measurements

def test_get_utm_epsg_bangalore():
    # Bangalore, India ~ (77.59 deg E, 12.97 deg N)
    # Zone = int((77.59 + 180)/6) + 1 = int(257.59/6) + 1 = 42 + 1 = 43.
    # Northern Hemisphere -> 32643
    epsg = get_utm_epsg(77.59, 12.97)
    assert epsg == 32643

def test_get_utm_epsg_southern_hemisphere():
    # Sydney, Australia ~ (151.2 deg E, -33.8 deg S)
    epsg = get_utm_epsg(151.2, -33.8)
    assert epsg == 32756

def test_is_geographic_crs():
    assert is_geographic_crs("EPSG:4326") is True
    assert is_geographic_crs("WGS 84") is True
    assert is_geographic_crs("EPSG:32643") is False

def test_polygon_area_measurement():
    # Rectangle roughly ~ 150m x 100m in Bangalore WGS84
    poly = Polygon([(77.5946, 12.9716), (77.5960, 12.9716), (77.5960, 12.9725), (77.5946, 12.9725)])
    area, length, unit, proj_epsg, is_supp = calculate_geometry_measurements(poly, "EPSG:4326")

    assert is_supp is True
    assert unit == "sq_m"
    assert area is not None
    assert area > 1000.0  # Reasonable positive metric area in sq meters
    assert length is None
    assert proj_epsg == 32643

def test_linestring_length_measurement():
    line = LineString([(77.5900, 12.9700), (77.5920, 12.9710), (77.5950, 12.9730)])
    area, length, unit, proj_epsg, is_supp = calculate_geometry_measurements(line, "EPSG:4326")

    assert is_supp is True
    assert unit == "meters"
    assert length is not None
    assert length > 100.0  # Metric length in meters
    assert area is None

def test_point_measurement():
    pt = Point(77.5930, 12.9720)
    area, length, unit, proj_epsg, is_supp = calculate_geometry_measurements(pt, "EPSG:4326")

    assert is_supp is True
    assert unit == "N/A"
    assert area is None
    assert length is None
