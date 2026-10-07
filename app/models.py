import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "SHAPEFILE_ZIP" or "KML"
    feature_count = Column(Integer, default=0)
    original_crs = Column(String, nullable=True)
    projected_crs = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    features = relationship("FeatureRecord", back_populates="file", cascade="all, delete-orphan")

class FeatureRecord(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(String, ForeignKey("files.id"), nullable=False)
    feature_index = Column(Integer, nullable=False)
    geometry_type = Column(String, nullable=False)  # Polygon, LineString, Point, etc.
    geometry_geojson = Column(JSON, nullable=True)
    properties = Column(JSON, nullable=True)
    area_sq_m = Column(Float, nullable=True)
    length_m = Column(Float, nullable=True)
    measurement_unit = Column(String, nullable=True)
    is_supported = Column(Boolean, default=True)

    file = relationship("FileRecord", back_populates="features")
