from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from decimal import Decimal
import uuid
from datetime import datetime


class UserBase(BaseModel): # Base Model
    username: str = Field(...,min_length=3,max_length= 20)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(...,min_length=6,max_length=20)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Data returned to the frontend 
class UserOut(UserBase):
    id: uuid.UUID
    monthly_limit: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy models directly

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None



class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    monthly_limit: Optional[Decimal] = Field(None, gt=0)