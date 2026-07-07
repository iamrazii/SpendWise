from fastapi import APIRouter,Depends,HTTPException,status
from app.schemas.analytics import FinancialInsightsOut
from app.services.analytics import AnalyticsEngine
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.routers.user_routes import get_current_user
from app.models.entity import User


router = APIRouter( prefix="/expenses" , tags=["insights"])

@router.get("/insights", response_model=FinancialInsightsOut)
def get_financial_insights(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    return AnalyticsEngine.generate_insights(current_user.id, db)