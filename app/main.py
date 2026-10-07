from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import files

# Create DB tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## Geospatial File Measurement API
    Production-grade backend service built for **Aereo** engineering assignment.
    
    ### Features:
    * **Upload Endpoint (`POST /api/files/`)**: Accepts `.zip` (Shapefile) or `.kml` geospatial files.
    * **Metadata Endpoint (`GET /api/files/{id}/`)**: Returns file status, CRS, projected CRS, and feature count.
    * **Measurements Endpoint (`GET /api/files/{id}/measurements/`)**: Returns calculated metric measurements per feature.
    * **Automatic CRS Reprojection**: Transforms geographic `EPSG:4326` lat/lon coordinates to optimal centroid Universal Transverse Mercator (UTM) metric projected CRS (`EPSG:326XX` / `EPSG:327XX`).
    * **Supported Geometries**:
      * `Polygon` / `MultiPolygon`: Area calculated in Square Meters ($m^2$).
      * `LineString` / `MultiLineString`: Length calculated in Meters ($m$).
      * `Point` / `MultiPoint`: Geometry stored, measurement non-applicable (`N/A`).
      * Unsupported Geometries: Gracefully handled without crashing.
    """
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(files.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }
