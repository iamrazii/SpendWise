from fastapi import APIRouter,Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from app.core import security
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user_schema import UserCreate,UserOut,PasswordUpdate,UserLogin,Token,UserUpdate
from app.db.crud import users
import jwt
from app.core.config import Settings
from app.models.entity import User

router = APIRouter(prefix="/users" , tags=["Users & Authentication"])
auth = OAuth2PasswordBearer(tokenUrl="users/login")



# Authentication for protected routes

def get_current_user(token:str =Depends(auth) , db:Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token,Settings.SECRET_KEY , algorithms=[Settings.ALGORITHM])
        user_id:str = payload["sub"]
        if not user_id:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = users.get_user_by_id(db,user_id=user_id)
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserOut,status_code=status.HTTP_201_CREATED)
def register_user(user:UserCreate, db:Session=Depends(get_db)):
    if users.get_user_by_email(db,email=user.email):
        raise HTTPException(status_code=400 , detail = "Email is already registered")
    
    if users.get_user_by_username(db,username=user.username):
        raise HTTPException(status_code=400 , detail = "Username already exists")
    
    return users.create_user(db=db , user_data = user)
    

@router.post("/login", response_model=Token)
def login_user(login:UserLogin , db:Session = Depends(get_db)):
    user = users.get_user_by_email(db,login.email)
    print(user.password)
    print(security.get_password_hash(login.password))
    if not user or not security.verify_password(login.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = security.create_access_token(data={"sub":str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
        
    


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieves the authenticated user's details profile based on their token."""
    return current_user



@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    payload: PasswordUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not security.verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Old password verification failed")
        
    current_user.password_hash = security.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users.delete_user(db, user_id=str(current_user.id))
    return {"message": "Account successfully terminated"}



@router.patch("/me",response_model=UserUpdate)
def update_profile(payload:UserUpdate , db:Session = Depends(get_db) , current_user:User = Depends(get_current_user)):
    update_data = payload.model_dump(exclude_unset=True)
    
    # Dynamically apply the changes directly to the database model row
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user