import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import FileRecord, FeatureRecord
from app.schemas import FileUploadResponse, FileInfoResponse, FileMeasurementsResponse, FeatureMeasurementDetail, ErrorResponse
from app.services.geo_processor import process_geospatial_file, GeoProcessingError

router = APIRouter(prefix="/api/files", tags=["Geospatial Files"])

ALLOWED_EXTENSIONS = {".zip", ".kml"}

@router.post(
    "/",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file format or corrupt file"},
        500: {"model": ErrorResponse, "description": "Internal server processing error"}
    }
)
async def upload_file(
    file: UploadFile = File(..., description="Geospatial file (.zip containing Shapefile, or .kml)"),
    db: Session = Depends(get_db)
):
    """
    Upload and process a geospatial file (.zip Shapefile or .kml).
    Extracts features, determines CRS, transforms coordinates to projected UTM,
    and calculates area (sq meters) and length (meters).
    """
    filename = file.filename or "uploaded_file"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed extensions are: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    file_id = str(uuid.uuid4())[:8]
    saved_file_path = settings.UPLOAD_DIR / f"{file_id}_{filename}"

    try:
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Process file features and measurements
    try:
        proc_result = process_geospatial_file(saved_file_path, filename)
    except GeoProcessingError as ge:
        # Cleanup uploaded file on processing error
        if saved_file_path.exists():
            saved_file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geospatial processing failed: {str(ge)}"
        )
    except Exception as e:
        if saved_file_path.exists():
            saved_file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during file parsing: {str(e)}"
        )

    # Save to Database
    file_record = FileRecord(
        id=file_id,
        filename=filename,
        file_type=proc_result["file_type"],
        feature_count=proc_result["feature_count"],
        original_crs=proc_result["original_crs"],
        projected_crs=proc_result["projected_crs"],
        status="COMPLETED"
    )
    db.add(file_record)
    db.flush()

    for item in proc_result["features"]:
        feat_record = FeatureRecord(
            file_id=file_id,
            feature_index=item["feature_index"],
            geometry_type=item["geometry_type"],
            geometry_geojson=item["geometry_geojson"],
            properties=item["properties"],
            area_sq_m=item["area_sq_m"],
            length_m=item["length_m"],
            measurement_unit=item["measurement_unit"],
            is_supported=item["is_supported"]
        )
        db.add(feat_record)

    db.commit()
    db.refresh(file_record)

    return FileUploadResponse(
        id=file_record.id,
        filename=file_record.filename,
        feature_count=file_record.feature_count,
        crs=file_record.original_crs,
        status=file_record.status,
        message=f"File successfully uploaded and {file_record.feature_count} features processed."
    )


@router.get(
    "/{file_id}/",
    response_model=FileInfoResponse,
    responses={404: {"model": ErrorResponse, "description": "File not found"}}
)
def get_file_info(file_id: str, db: Session = Depends(get_db)):
    """
    Retrieve metadata summary for an uploaded geospatial file by ID.
    """
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geospatial file with ID '{file_id}' not found."
        )

    return FileInfoResponse(
        id=file_record.id,
        filename=file_record.filename,
        file_type=file_record.file_type,
        feature_count=file_record.feature_count,
        crs=file_record.original_crs,
        projected_crs=file_record.projected_crs,
        status=file_record.status,
        error_message=file_record.error_message,
        created_at=file_record.created_at
    )


@router.get(
    "/{file_id}/measurements/",
    response_model=FileMeasurementsResponse,
    responses={404: {"model": ErrorResponse, "description": "File not found"}}
)
def get_file_measurements(file_id: str, db: Session = Depends(get_db)):
    """
    Retrieve calculated feature measurements (Area, Length, Units, GeoJSON geometry)
    for all features contained in the uploaded file.
    """
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geospatial file with ID '{file_id}' not found."
        )

    features = db.query(FeatureRecord).filter(FeatureRecord.file_id == file_id).order_by(FeatureRecord.feature_index).all()

    measurements_list = []
    for f in features:
        measurements_list.append(
            FeatureMeasurementDetail(
                feature_index=f.feature_index,
                geometry_type=f.geometry_type,
                geometry=f.geometry_geojson,
                crs=file_record.original_crs,
                properties=f.properties,
                area_sq_m=f.area_sq_m,
                length_m=f.length_m,
                measurement_unit=f.measurement_unit,
                is_supported=f.is_supported
            )
        )

    return FileMeasurementsResponse(
        file_id=file_record.id,
        filename=file_record.filename,
        feature_count=file_record.feature_count,
        original_crs=file_record.original_crs,
        projected_crs=file_record.projected_crs,
        measurements=measurements_list
    )


@router.delete(
    "/{file_id}/",
    status_code=status.HTTP_200_OK,
    responses={404: {"model": ErrorResponse, "description": "File not found"}}
)
def delete_file(file_id: str, db: Session = Depends(get_db)):
    """
    Delete file record and associated feature measurements.
    """
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geospatial file with ID '{file_id}' not found."
        )

    # Remove physical file if present
    file_pattern = f"{file_id}_*"
    for p in settings.UPLOAD_DIR.glob(file_pattern):
        try:
            p.unlink()
        except Exception:
            pass

    db.delete(file_record)
    db.commit()

    return {"detail": f"File '{file_id}' and associated measurements deleted successfully."}
