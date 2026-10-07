from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class FileUploadResponse(BaseModel):
    id: str
    filename: str
    feature_count: int
    crs: Optional[str]
    status: str
    message: str

class FileInfoResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    feature_count: int
    crs: Optional[str]
    projected_crs: Optional[str]
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FeatureMeasurementDetail(BaseModel):
    feature_index: int
    geometry_type: str
    geometry: Optional[Dict[str, Any]] = None
    crs: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    area_sq_m: Optional[float] = Field(None, description="Area in square meters (Polygons)")
    length_m: Optional[float] = Field(None, description="Length in meters (LineStrings)")
    measurement_unit: Optional[str] = Field(None, description="Measurement unit (sq_m, meters, N/A)")
    is_supported: bool = Field(True, description="Whether geometry type is supported for measurement")

    class Config:
        from_attributes = True

class FileMeasurementsResponse(BaseModel):
    file_id: str
    filename: str
    feature_count: int
    original_crs: Optional[str]
    projected_crs: Optional[str]
    measurements: List[FeatureMeasurementDetail]

class ErrorResponse(BaseModel):
    detail: str
