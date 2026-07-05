from sqlalchemy.orm import Session
import uuid
from app.models.entity import Category
from app.schemas.category_schema import CategoryCreate
from sqlalchemy import or_


def get_user_categories(db: Session, user_id: uuid.UUID):
    return db.query(Category).filter(or_(Category.user_id==None ,Category.user_id == user_id) ).all()

def create_user_category(db: Session, category_data: CategoryCreate, user_id: uuid.UUID):
    db_category = Category(
        name=category_data.name,
        user_id=user_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_user_category(db: Session, category_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    db_category = db.query(Category).filter(
        Category.id == category_id, 
        Category.user_id == user_id
    ).first()
    
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False