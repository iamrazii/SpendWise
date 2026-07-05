from app.schemas.user_schema import UserCreate,PasswordUpdate
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.entity import User

from app.core.security import get_password_hash


def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user_data: UserCreate):

    hashed_pwd = get_password_hash(user_data.password)
    db_user = User(
        username = user_data.username,
        email= user_data.email,
        password= hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: str) -> bool:
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False