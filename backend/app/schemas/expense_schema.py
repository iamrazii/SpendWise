from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.category_schema import CategoryOut 
from decimal import Decimal
from datetime import datetime
import uuid

class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    description: Optional[str] = Field(None, max_length=255)
    category_id: Optional[uuid.UUID] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseOut(ExpenseBase):
    id: uuid.UUID
    user_id: uuid.UUID
    date_added: datetime
    category: Optional[CategoryOut] = None
    class Config:
        from_attributes = True

# Target response schema for your React Native dashboard
class MonthlySummaryOut(BaseModel):
    current_month_spending: Decimal
    monthly_limit: Optional[Decimal]
    limit_exceeded: bool # TODO: need to think about allwoing past limit or not 