import calendar
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import func
from app.models.entity import Expense, Category, User

class AnalyticsEngine:
    @staticmethod
    def generate_insights(user_id: int, db) -> dict:
        now = datetime.utcnow()
        current_day = now.day
        total_days = calendar.monthrange(now.year, now.month)[1]
        
        user = db.query(User).filter(User.id == user_id).first()
        monthly_limit = user.monthly_limit or Decimal("0.00")
        
        start_of_month = datetime(now.year, now.month, 1)
        current_spent = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.date_added >= start_of_month
        ).scalar() or Decimal("0.00")
        
        velocity_per_day = current_spent / Decimal(current_day)
        projected_month_end = velocity_per_day * Decimal(total_days)
        
        is_overshooting = False
        overshoot_percentage = Decimal("0.00")
        
        if monthly_limit > 0 and projected_month_end > monthly_limit:
            is_overshooting = True
            overshoot_percentage = ((projected_month_end - monthly_limit) / monthly_limit) * 100

        start_of_week = now - timedelta(days=now.weekday())
        anomalies = []
        
        weekly_spending = db.query(
            Category.name, 
            func.sum(Expense.amount).label("total")
        ).join(Expense).filter(
            Expense.user_id == user_id,
            Expense.date_added >= start_of_week
        ).group_by(Category.name).all()
        
        for item in weekly_spending:
            hist_avg = db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.date_added < start_of_week
            ).scalar()
            
            historical_baseline = Decimal("1500.00") # Replace with dynamic average calculation if tracking historic weeks
            
            if item.total > (historical_baseline * Decimal("1.4")):
                pct = ((item.total - historical_baseline) / historical_baseline) * 100
                anomalies.append({
                    "category_name": item.name,
                    "current_week_spent": item.total,
                    "historical_weekly_avg": historical_baseline,
                    "increase_percentage": round(pct, 2)
                })

        return {
            "current_month_spending": current_spent,
            "monthly_limit": monthly_limit,
            "projected_month_end": round(projected_month_end, 2),
            "velocity_per_day": round(velocity_per_day, 2),
            "is_overshooting": is_overshooting,
            "overshoot_percentage": round(overshoot_percentage, 2),
            "anomalies": anomalies
        }