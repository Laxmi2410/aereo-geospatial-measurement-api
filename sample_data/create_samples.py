import os
import zipfile
from pathlib import Path

SAMPLE_DIR = Path(__file__).resolve().parent
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

def generate_kml_sample():
    kml_content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Aereo Bangalore Survey Sample</name>
    <Placemark>
      <name>Drone Survey Polygon A</name>
      <description>Agricultural Land Boundary</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              77.5946,12.9716,0
              77.5960,12.9716,0
              77.5960,12.9725,0
              77.5946,12.9725,0
              77.5946,12.9716,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>Infrastructure Pipeline B</name>
      <description>Road Survey Line</description>
      <LineString>
        <coordinates>
          77.5900,12.9700,0
          77.5920,12.9710,0
          77.5950,12.9730,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Base Station Point C</name>
      <description>GPS Control Point</description>
      <Point>
        <coordinates>77.5930,12.9720,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>"""

    kml_path = SAMPLE_DIR / "sample_survey.kml"
    with open(kml_path, "w", encoding="utf-8") as f:
        f.write(kml_content)
    print(f"Created sample KML at: {kml_path}")

def generate_shapefile_zip_sample():
    try:
        import geopandas as gpd
        from shapely.geometry import Polygon, LineString, Point

        poly1 = Polygon([(77.5946, 12.9716), (77.5960, 12.9716), (77.5960, 12.9725), (77.5946, 12.9725)])
        line1 = LineString([(77.5900, 12.9700), (77.5920, 12.9710), (77.5950, 12.9730)])
        point1 = Point(77.5930, 12.9720)

        gdf = gpd.GeoDataFrame(
            [
              {"name": "Mining Plot A", "type": "Polygon", "geometry": poly1},
              {"name": "Access Road 1", "type": "LineString", "geometry": line1},
              {"name": "Tower Alpha", "type": "Point", "geometry": point1}
            ],
            crs="EPSG:4326"
        )

        temp_shp_dir = SAMPLE_DIR / "temp_shp"
        temp_shp_dir.mkdir(exist_ok=True)
        shp_path = temp_shp_dir / "survey_features.shp"
        gdf.to_file(shp_path)

        zip_path = SAMPLE_DIR / "sample_shapefile.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(temp_shp_dir):
                for file in files:
                    file_full_path = Path(root) / file
                    zipf.write(file_full_path, file)

        # Cleanup temp directory
        for item in temp_shp_dir.glob("*"):
            item.unlink()
        temp_shp_dir.rmdir()
        print(f"Created sample Shapefile ZIP at: {zip_path}")
    except ModuleNotFoundError:
        print("Note: geopandas not installed in global environment yet. KML sample generated cleanly.")

if __name__ == "__main__":
    generate_kml_sample()
    generate_shapefile_zip_sample()
