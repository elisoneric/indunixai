import uuid
from sqlalchemy import Column, String, Boolean, JSON
from backend.core.database import Base

class ModelRoute(Base):
    __tablename__ = "model_routes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    public_model_id = Column(String(64), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    upstream_provider = Column(String(64), nullable=False) # Internal only
    upstream_model = Column(String(100), nullable=False)    # Internal only
    fallback_model_id = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=True)
