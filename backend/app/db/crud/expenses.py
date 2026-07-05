from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from datetime import datetime, timezone
from app.models.entity import Expense
from app.schemas.expense_schema import ExpenseCreate
from decimal import Decimal

def get_user_expenses(db: Session, user_id: uuid.UUID):
    return db.query(Expense).filter(Expense.user_id == user_id).order_by(Expense.date_added.desc()).all()

def create_user_expense(db: Session, expense_data: ExpenseCreate, user_id: uuid.UUID):
    db_expense = Expense(
        amount=expense_data.amount,
        description=expense_data.description,
        category_id=expense_data.category_id,
        user_id=user_id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_user_expense(db: Session, expense_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id, 
        Expense.user_id == user_id
    ).first()
    
    if db_expense:
        db.delete(db_expense)
        db.commit()
        return True
    return False

def calculate_current_month_spending(db: Session, user_id: uuid.UUID) -> Decimal:
    """Calculates total spending for the active calendar month dynamically."""
    now = datetime.now(timezone.utc)
    # Target the first second of the first day of the current month
    start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)
    
    total = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        Expense.date_added >= start_of_month
    ).scalar()
    
    return Decimal(total)