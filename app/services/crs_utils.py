import math
from typing import Tuple, Optional
from shapely.geometry import base, shape
from shapely.ops import transform
import pyproj

def get_utm_epsg(lon: float, lat: float) -> int:
    """
    Calculate the appropriate EPSG code for Universal Transverse Mercator (UTM) zone
    based on longitude and latitude centroid coordinates.
    """
    # Ensure longitude is in [-180, 180]
    lon = ((lon + 180) % 360) - 180
    zone = int((lon + 180) / 6) + 1
    zone = min(max(zone, 1), 60)
    
    if lat >= 0:
        return 32600 + zone  # WGS 84 / UTM zone N
    else:
        return 32700 + zone  # WGS 84 / UTM zone S

def is_geographic_crs(crs_string: Optional[str]) -> bool:
    """
    Check whether a CRS string or EPSG represents geographic coordinates (lat/lon degrees).
    """
    if not crs_string:
        return True  # Default fallback assumption for KML / standard GeoJSON is EPSG:4326 (lat/lon)
    crs_lower = str(crs_string).lower()
    if "4326" in crs_lower or "wgs 84" in crs_lower or "geographic" in crs_lower or "degree" in crs_lower:
        return True
    
    try:
        crs_obj = pyproj.CRS.from_user_input(crs_string)
        return crs_obj.is_geographic
    except Exception:
        return True

def reproject_geometry(geom: base.BaseGeometry, source_crs: str, target_epsg: int) -> base.BaseGeometry:
    """
    Reproject a Shapely geometry from source CRS to a target projected EPSG code (e.g. UTM).
    """
    try:
        source_proj = pyproj.CRS.from_user_input(source_crs if source_crs else "EPSG:4326")
        target_proj = pyproj.CRS.from_epsg(target_epsg)
        
        projector = pyproj.Transformer.from_crs(source_proj, target_proj, always_xy=True).transform
        return transform(projector, geom)
    except Exception as e:
        raise ValueError(f"Failed to reproject geometry from {source_crs} to EPSG:{target_epsg}: {str(e)}")

def calculate_geometry_measurements(
    geom: base.BaseGeometry,
    source_crs: Optional[str] = "EPSG:4326"
) -> Tuple[Optional[float], Optional[float], str, int, bool]:
    """
    Calculate area (sq meters) for Polygon/MultiPolygon and length (meters) for LineString/MultiLineString.
    Handles CRS reprojection to appropriate projected UTM coordinate system if source CRS is geographic.

    Returns:
        (area_sq_m, length_m, measurement_unit, projected_epsg, is_supported)
    """
    geom_type = geom.geom_type
    
    if geom_type in ["Point", "MultiPoint"]:
        return (None, None, "N/A", 4326, True)

    if geom_type not in ["Polygon", "MultiPolygon", "LineString", "MultiLineString"]:
        return (None, None, "UNSUPPORTED", 4326, False)

    # Calculate centroid to find proper UTM projection
    centroid = geom.centroid
    lon, lat = centroid.x, centroid.y
    
    # Determine target projected CRS (UTM)
    if is_geographic_crs(source_crs):
        target_epsg = get_utm_epsg(lon, lat)
        projected_geom = reproject_geometry(geom, source_crs or "EPSG:4326", target_epsg)
    else:
        target_epsg = 3857  # Fallback projected CRS
        projected_geom = geom

    area_sq_m = None
    length_m = None
    unit = "N/A"

    if geom_type in ["Polygon", "MultiPolygon"]:
        area_sq_m = round(float(projected_geom.area), 2)
        unit = "sq_m"
    elif geom_type in ["LineString", "MultiLineString"]:
        length_m = round(float(projected_geom.length), 2)
        unit = "meters"

    return (area_sq_m, length_m, unit, target_epsg, True)
