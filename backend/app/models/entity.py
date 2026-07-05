import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import ForeignKey, String, Numeric, DateTime, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# Base class for all declarative models
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=text("gen_random_uuid()")
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    monthly_limit: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=12, scale=2), 
        nullable=True, 
        default=None
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=text("TIMEZONE('utc', NOW())")
    )

    expenses: Mapped[List["Expense"]] = relationship(
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    categories: Mapped[List["Category"]] = relationship(
        back_populates="user", 
        cascade="all, delete-orphan"
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="categories")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=text("gen_random_uuid()")
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=2), 
        nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    date_added: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=text("TIMEZONE('utc', NOW())"),
        index=True 
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), 
        nullable=True # If a category is deleted, keep the expense log intact
    )

    user: Mapped["User"] = relationship(back_populates="expenses")
    category: Mapped[Optional["Category"]] = relationship(back_populates="expenses")