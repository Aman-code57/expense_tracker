from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import re
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config, UndefinedValueError
from fastapi.responses import JSONResponse
from database import get_db, engine
from models import Base, User

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

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Safe .env loading
def safe_config(key, default=None, cast=str):
    try:
        return config(key, default=default, cast=cast)
    except (UnicodeDecodeError, UndefinedValueError, ValueError):
        print(f"[CONFIG WARNING] Using default for {key}")
        return default

SMTP_SERVER = safe_config("SMTP_SERVER", default="smtp.gmail.com")
SMTP_PORT = safe_config("SMTP_PORT", default=587, cast=int)
EMAIL_USER = safe_config("EMAIL_USER", default="amanraturi5757@gmail.com")
EMAIL_PASSWORD = safe_config("EMAIL_PASSWORD", default="epif azzt hgjg zvcy")

security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(hours=1))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

def validate_email(email: str) -> bool:
    return re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email) is not None

def validate_mobile(mobile: str) -> bool:
    return re.match(r'^\d{10}$', mobile) is not None

def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise e

def generate_otp() -> str:
    return str(random.randint(100000, 999999))


@app.post("/api/signup")
async def signup(user_data: dict, db: Session = Depends(get_db)):
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
            return JSONResponse(status_code=400, content={"status": "error", "message": "Validation failed", "errors": errors})

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

        return JSONResponse(status_code=201, content={"status": "success", "message": "User registered successfully", "user_id": new_user.id})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Registration failed: {str(e)}"})

@app.post("/api/signin")
async def signin(credentials: dict, db: Session = Depends(get_db)):
    try:
        email = credentials.get("email", "").strip().lower()
        password = credentials.get("password", "")
        if not email or not password:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Email and password are required"})

        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password):
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid email or password"})

        access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return JSONResponse(status_code=200, content={"status": "success", "message": "Login successful", "access_token": access_token, "user": {"id": user.id, "fullname": user.fullname, "email": user.email, "gender": user.gender}})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Login failed: {str(e)}"})

@app.post("/api/forgot-password")
async def forgot_password(request: dict, db: Session = Depends(get_db)):
    try:
        email = request.get("email", "").strip().lower()
        if not email or not validate_email(email):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Valid email is required"})
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        reset_token = create_reset_token(data={"sub": user.email})
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        send_email(user.email, "Password Reset Request", f"Click to reset password: http://localhost:5173/reset-password?token={reset_token}")

        return JSONResponse(status_code=200, content={"status": "success", "message": "Password reset link sent!"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/api/send-otp")
async def send_otp(request: dict, db: Session = Depends(get_db)):
    try:
        email = request.get("email", "").strip().lower()
        if not email or not validate_email(email):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Valid email is required"})

        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        otp = generate_otp()
        user.reset_token = otp
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        send_email(user.email, "OTP for Password Reset", f"Your OTP is {otp}")
        return JSONResponse(status_code=200, content={"status": "success", "message": "OTP sent to your email"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/api/verify-otp")
async def verify_otp(request: dict, db: Session = Depends(get_db)):
    try:
        email = request.get("email", "").strip().lower()
        otp = request.get("otp", "").strip()
        if not email or not otp:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Email and OTP are required"})

        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})
        if not user.reset_token or user.reset_token != otp:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid OTP"})
        if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
            return JSONResponse(status_code=401, content={"status": "error", "message": "OTP expired"})

        reset_token = create_reset_token(data={"sub": user.email}, expires_delta=timedelta(hours=1))
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        return JSONResponse(status_code=200, content={"status": "success", "message": "OTP verified", "reset_token": reset_token})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/api/reset-password-with-otp")
async def reset_password_with_otp(request: dict, db: Session = Depends(get_db)):
    try:
        reset_token = request.get("reset_token")
        new_password = request.get("new_password")
        if not reset_token or not new_password:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Reset token and new password required"})

        payload = jwt.decode(reset_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        user.password = get_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        return JSONResponse(status_code=200, content={"status": "success", "message": "Password reset successfully"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.get("/api/dashboard")
async def get_dashboard_data(email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        dashboard_data = {
            "total_spent": 0,
            "recent_expenses": [
                {"date": "2025-09-20", "category": "Food", "amount": 20.0, "description": "Lunch at Cafe"},
                {"date": "2025-09-21", "category": "Transport", "amount": 15.0, "description": "Cab Ride"}
            ],
            "category_breakdown": {"Food": 2000.0, "Transport": 1500.0, "Other": 1500.0}
        }
        return JSONResponse(status_code=200, content={"status": "success", "data": dashboard_data})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error fetching dashboard data: {str(e)}"})

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Expense Tracker API is running"}

@app.get("/")
async def root():
    return {"message": "Welcome to Expense Tracker API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
