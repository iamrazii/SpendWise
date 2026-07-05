import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.crud import categories
from app.schemas.category_schema import CategoryCreate, CategoryOut
from app.routers.user_routes import get_current_user
from app.models.entity import User

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryOut])
def list_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return categories.get_user_categories(db, user_id=current_user.id)

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category_payload: CategoryCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    return categories.create_user_category(db, category_payload, user_id=current_user.id)

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def remove_category(
    category_id: uuid.UUID, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    success = categories.delete_user_category(db, category_id=category_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found or unauthorized")
    return {"message": "Category deleted successfully"}