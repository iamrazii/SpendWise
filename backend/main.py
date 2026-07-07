from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine, SessionLocal
from app.models.entity import Base, Category
from app.routers import (
    user_routes,
    categories_route,
    expenses_route,
    insight_route
)


def seed_default_categories():
    db = SessionLocal()

    try:
        default_categories = [
            "Food & Dining",
            "Transportation",
            "Utilities",
            "Entertainment",
            "Shopping",
        ]

        for category_name in default_categories:
            exists = (
                db.query(Category)
                .filter(
                    Category.name == category_name,
                    Category.user_id == None,
                )
                .first()
            )

            if not exists:
                db.add(Category(name=category_name, user_id=None))

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error seeding default categories: {e}")

    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create db tables if not exist
    Base.metadata.create_all(bind=engine)

    seed_default_categories()

    yield



app = FastAPI(
    title="Expense Tracker Hub API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(user_routes.router)
app.include_router(categories_route.router)
app.include_router(expenses_route.router)
app.include_router(insight_route.router)


@app.get("/")
def home():
    return {"status": "online"}