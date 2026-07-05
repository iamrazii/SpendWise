from pydantic import BaseModel, Field
from typing import Optional
import uuid

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True