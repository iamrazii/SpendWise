import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.crud import expenses, categories
from app.schemas.expense_schema import ExpenseCreate, ExpenseOut, MonthlySummaryOut
from app.routers.user_routes import get_current_user
from app.models.entity import User

router = APIRouter(prefix="/expenses", tags=["Expenses"])



@router.get("/", response_model=List[ExpenseOut])
def list_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return expenses.get_user_expenses(db, user_id=current_user.id)




@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(expense_payload: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if expense_payload.category_id:
        allowed_categories = categories.get_user_categories(db, user_id=current_user.id)
        valid_ids = [cat.id for cat in allowed_categories]
        
        if expense_payload.category_id not in valid_ids:
            raise HTTPException(
                status_code=400, 
                detail="Selected category is invalid or unauthorized."
            )

    return expenses.create_user_expense(db, expense_payload, user_id=current_user.id)




@router.get("/summary", response_model=MonthlySummaryOut)
def get_monthly_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    spending = expenses.calculate_current_month_spending(db, user_id=current_user.id)
    
    limit_exceeded = False
    if current_user.monthly_limit and spending > current_user.monthly_limit:
        limit_exceeded = True
        
    return {
        "current_month_spending": spending,
        "monthly_limit": current_user.monthly_limit,
        "limit_exceeded": limit_exceeded
    }




@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def remove_expense(
    expense_id: uuid.UUID, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    success = expenses.delete_user_expense(db, expense_id=expense_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense log not found or unauthorized")
    return {"message": "Expense record deleted permanently"}