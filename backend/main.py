from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import re

from backend.database import get_db, engine
from backend.models import Base, User


Base.metadata.create_all(bind=engine)


app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",  
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://[::1]:5174",  
        "http://localhost:3000", 
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def validate_mobile(mobile: str) -> bool:
    """Validate mobile number (10 digits)"""
    pattern = r'^\d{10}$'
    return re.match(pattern, mobile) is not None

from fastapi.responses import JSONResponse

@app.post("/api/signup")
async def signup(user_data: dict, db: Session = Depends(get_db)):
    """User registration endpoint"""
    try:
        fullname = user_data.get("fullname", "").strip()
        email = user_data.get("email", "").strip().lower()
        gender = user_data.get("gender", "").strip()
        mobilenumber = user_data.get("mobilenumber", "").strip()
        password = user_data.get("password", "")

        errors = {}

        if not fullname or len(fullname) < 3 or len(fullname) > 100:
            errors["fullname"] = "Full name must be 3-100 characters"
        elif not re.match(r"^[A-Za-z\s]+$", fullname):
            errors["fullname"] = "Full name can only contain letters and spaces"

        if not email or not validate_email(email):
            errors["email"] = "Valid email is required"

        if not gender:
            errors["gender"] = "Gender is required"

        if not mobilenumber or not validate_mobile(mobilenumber):
            errors["mobilenumber"] = "Valid 10-digit mobile number is required"

        if not password or len(password) < 6:
            errors["password"] = "Password must be at least 6 characters"
        elif not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
            errors["password"] = "Password must contain at least 1 letter and 1 number"

        existing_user = db.query(User).filter(
            (User.email == email) | (User.mobilenumber == mobilenumber)
        ).first()

        if existing_user:
            if existing_user.email == email:
                errors["email"] = "Email already registered"
            if existing_user.mobilenumber == mobilenumber:
                errors["mobilenumber"] = "Mobile number already registered"

        if errors:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Validation failed", "errors": errors}
            )

        # Create new user
        hashed_password = get_password_hash(password)
        new_user = User(
            fullname=fullname,
            email=email,
            gender=gender,
            mobilenumber=mobilenumber,
            password=hashed_password
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return JSONResponse(
            status_code=201,
            content={"status": "success", "message": "User registered successfully", "user_id": new_user.id}
        )

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Registration failed: {str(e)}"}
        )


@app.post("/api/signin")
async def signin(credentials: dict, db: Session = Depends(get_db)):
    """User login endpoint"""
    try:
        email = credentials.get("email", "").strip().lower()
        password = credentials.get("password", "")

        if not email or not password:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Email and password are required"}
            )

        user = db.query(User).filter(User.email == email).first()

        if not user or not verify_password(password, user.password):
            return JSONResponse(
                status_code=401,
                content={"status": "error", "message": "Invalid email or password"}
            )

        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Login successful",
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "fullname": user.fullname,
                    "email": user.email,
                    "gender": user.gender
                }
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Login failed: {str(e)}"}
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Expense Tracker API is running"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Expense Tracker API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
