import os
import zipfile
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import geopandas as gpd
from shapely.geometry import shape, mapping, Polygon, LineString, Point, MultiPolygon, MultiLineString
from shapely.wkt import loads as wkt_loads
from app.services.crs_utils import calculate_geometry_measurements

class GeoProcessingError(Exception):
    pass

def parse_kml_fallback(kml_path: Path) -> Tuple[List[Dict[str, Any]], str]:
    """
    Fallback KML parser using Python standard library xml.etree.ElementTree.
    Parses Placemarks containing Polygon, LineString, and Point geometries.
    """
    tree = ET.parse(kml_path)
    root = tree.getroot()
    
    # Handle KML namespaces dynamically
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    def find_all(element, tag):
        res = element.findall(f".//kml:{tag}", ns)
        if not res:
            res = element.findall(f".//{tag}")
        return res

    placemarks = find_all(root, 'Placemark')
    features = []

    for idx, pm in enumerate(placemarks):
        name_elem = pm.find(".//kml:name", ns) or pm.find(".//name")
        name = name_elem.text.strip() if name_elem is not None and name_elem.text else f"Feature_{idx}"
        
        desc_elem = pm.find(".//kml:description", ns) or pm.find(".//description")
        description = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""

        props = {"name": name, "description": description}

        # Check Polygon
        poly_elem = pm.find(".//kml:Polygon", ns) or pm.find(".//Polygon")
        line_elem = pm.find(".//kml:LineString", ns) or pm.find(".//LineString")
        point_elem = pm.find(".//kml:Point", ns) or pm.find(".//Point")

        geom = None
        if poly_elem is not None:
            coords_elem = poly_elem.find(".//kml:coordinates", ns) or poly_elem.find(".//coordinates")
            if coords_elem is not None and coords_elem.text:
                raw_coords = coords_elem.text.strip().split()
                pts = []
                for c in raw_coords:
                    parts = [float(p) for p in c.split(',') if p]
                    if len(parts) >= 2:
                        pts.append((parts[0], parts[1]))
                if len(pts) >= 3:
                    geom = Polygon(pts)

        elif line_elem is not None:
            coords_elem = line_elem.find(".//kml:coordinates", ns) or line_elem.find(".//coordinates")
            if coords_elem is not None and coords_elem.text:
                raw_coords = coords_elem.text.strip().split()
                pts = []
                for c in raw_coords:
                    parts = [float(p) for p in c.split(',') if p]
                    if len(parts) >= 2:
                        pts.append((parts[0], parts[1]))
                if len(pts) >= 2:
                    geom = LineString(pts)

        elif point_elem is not None:
            coords_elem = point_elem.find(".//kml:coordinates", ns) or point_elem.find(".//coordinates")
            if coords_elem is not None and coords_elem.text:
                parts = [float(p) for p in coords_elem.text.strip().split(',') if p]
                if len(parts) >= 2:
                    geom = Point(parts[0], parts[1])

        if geom is not None:
            features.append({
                "geometry": geom,
                "properties": props
            })

    return features, "EPSG:4326"

def process_geospatial_file(file_path: Path, filename: str) -> Dict[str, Any]:
    """
    Reads Shapefile (.zip) or KML (.kml) files, extracts features, properties,
    and calculates projected metric measurements for each feature.
    """
    ext = file_path.suffix.lower()
    features_data = []
    crs_str = "EPSG:4326"
    file_type = "KML" if ext == ".kml" else "SHAPEFILE_ZIP"

    if ext == ".kml":
        try:
            # Try reading with GeoPandas / Fiona KML driver first
            gdf = gpd.read_file(file_path, driver="KML")
            crs_str = str(gdf.crs) if gdf.crs else "EPSG:4326"
            for idx, row in gdf.iterrows():
                geom = row.geometry
                props = {k: str(v) for k, v in row.items() if k != "geometry" and v is not None}
                if geom is not None and not geom.is_empty:
                    features_data.append({"geometry": geom, "properties": props})
        except Exception:
            # Fallback to custom robust XML KML parser if Fiona GDAL KML driver is unavailable
            kml_features, crs_str = parse_kml_fallback(file_path)
            features_data = kml_features

    elif ext == ".zip":
        with tempfile.TemporaryDirectory() as tmp_dir:
            try:
                with zipfile.ZipFile(file_path, "r") as zip_ref:
                    zip_ref.extractall(tmp_dir)
            except zipfile.BadZipFile:
                raise GeoProcessingError("Invalid ZIP file archive provided.")

            # Search for .shp file
            shp_files = list(Path(tmp_dir).rglob("*.shp"))
            if not shp_files:
                raise GeoProcessingError("No .shp (Shapefile) found inside the provided .zip archive.")

            shp_path = shp_files[0]
            try:
                gdf = gpd.read_file(shp_path)
                crs_str = str(gdf.crs) if gdf.crs else "EPSG:4326"
                for idx, row in gdf.iterrows():
                    geom = row.geometry
                    props = {k: (v if isinstance(v, (int, float, str, bool)) else str(v)) 
                             for k, v in row.items() if k != "geometry" and v is not None}
                    if geom is not None and not geom.is_empty:
                        features_data.append({"geometry": geom, "properties": props})
            except Exception as e:
                raise GeoProcessingError(f"Error reading shapefile: {str(e)}")

    else:
        raise GeoProcessingError("Unsupported file extension. Only .zip (Shapefile) and .kml are supported.")

    processed_features = []
    used_projected_epsg = None

    for idx, item in enumerate(features_data):
        geom = item["geometry"]
        props = item["properties"]
        geom_type = geom.geom_type
        geojson_dict = mapping(geom)

        try:
            area, length, unit, proj_epsg, is_supp = calculate_geometry_measurements(geom, source_crs=crs_str)
            if proj_epsg and not used_projected_epsg:
                used_projected_epsg = f"EPSG:{proj_epsg}"
        except Exception as err:
            # Graceful failure handling per requirement 3
            area, length, unit, proj_epsg, is_supp = None, None, "ERROR", 4326, False

        processed_features.append({
            "feature_index": idx,
            "geometry_type": geom_type,
            "geometry_geojson": geojson_dict,
            "properties": props,
            "area_sq_m": area,
            "length_m": length,
            "measurement_unit": unit,
            "is_supported": is_supp
        })

    return {
        "file_type": file_type,
        "feature_count": len(processed_features),
        "original_crs": crs_str,
        "projected_crs": used_projected_epsg or "EPSG:3857",
        "features": processed_features
    }
