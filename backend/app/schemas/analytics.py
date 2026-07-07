from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class CategoryAnomaly(BaseModel):
    category_name: str
    current_week_spent: Decimal
    historical_weekly_avg: Decimal
    increase_percentage: Decimal

class FinancialInsightsOut(BaseModel):
    current_month_spending: Decimal
    monthly_limit: Optional[Decimal]
    projected_month_end: Decimal
    velocity_per_day: Decimal
    is_overshooting: bool
    overshoot_percentage: Decimal
    anomalies: List[CategoryAnomaly]