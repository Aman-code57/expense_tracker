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
from decouple import config
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

# SMTP Configuration (configure these in your environment variables)
SMTP_SERVER = config("SMTP_SERVER", default="smtp.gmail.com")
SMTP_PORT = config("SMTP_PORT", default=587, cast=int)
EMAIL_USER = config("EMAIL_USER", default="amanraturi5757@gmail.com")
EMAIL_PASSWORD = config("EMAIL_PASSWORD", default="epif azzt hgjg zvcy")

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

def create_reset_token(data: dict, expires_delta: timedelta = None):
    """Create JWT reset token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=1)
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

def send_reset_email(to_email: str, reset_token: str):
    """Send password reset email"""
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
    subject = "Password Reset Request"
    body = f"""
    Hi,

    You have requested to reset your password. Click the link below to reset it:

    {reset_link}

    This link will expire in 1 hour.

    If you didn't request this, please ignore this email.

    Best regards,
    Expense Tracker Team
    """
    
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
        print(f"Password reset email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise e


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

@app.post("/api/forgot-password")
async def forgot_password(request: dict, db: Session = Depends(get_db)):
    """Forgot password endpoint"""
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
        
        # Send reset email
        try:
            send_reset_email(user.email, reset_token)
        except Exception as e:
            # If email fails, still return success but log the error
            print(f"Email sending failed: {str(e)}")
        
        return JSONResponse(status_code=200, content={"status": "success", "message": "Password reset link sent!"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/api/reset-password")
async def reset_password(request: dict, db: Session = Depends(get_db)):
    """Reset password endpoint"""
    try:
        reset_token = request.get("reset_token")
        new_password = request.get("new_password")
        
        if not reset_token or not new_password:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Reset token and new password are required"})
        
        try:
            payload = jwt.decode(reset_token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            exp = payload.get("exp")
            if email is None or exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
                return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid or expired token"})
        except jwt.PyJWTError:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid token"})
        
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

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, otp: str):
    """Send OTP email"""
    subject = "Password Reset OTP"
    body = f"""
    Hi,

    You have requested to reset your password. Your OTP is:

    {otp}

    This OTP will expire in 10 minutes.

    If you didn't request this, please ignore this email.

    Best regards,
    Expense Tracker Team
    """

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
        print(f"OTP email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send OTP email: {str(e)}")
        raise e

@app.post("/api/send-otp")
async def send_otp(request: dict, db: Session = Depends(get_db)):
    """Send OTP for password reset"""
    try:
        email = request.get("email", "").strip().lower()
        if not email or not validate_email(email):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Valid email is required"})

        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        # Generate OTP
        otp = generate_otp()

        # Store OTP in database (you might want to hash this in production)
        user.reset_token = otp  # Using reset_token field to store OTP temporarily
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=10)
        db.commit()

        # Send OTP email
        try:
            send_otp_email(user.email, otp)
        except Exception as e:
            # If email fails, still return success but log the error
            print(f"OTP email sending failed: {str(e)}")

        return JSONResponse(status_code=200, content={"status": "success", "message": "OTP sent to your email"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/api/verify-otp")
async def verify_otp(request: dict, db: Session = Depends(get_db)):
    """Verify OTP and return reset token"""
    try:
        email = request.get("email", "").strip().lower()
        otp = request.get("otp", "").strip()

        if not email or not otp:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Email and OTP are required"})

        if not validate_email(email):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Valid email is required"})

        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        # Check if OTP exists and hasn't expired
        if not user.reset_token or user.reset_token != otp:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid OTP"})

        if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
            return JSONResponse(status_code=401, content={"status": "error", "message": "OTP has expired"})

        # Generate reset token
        reset_token = create_reset_token(data={"sub": user.email}, expires_delta=timedelta(hours=1))

        # Clear OTP and set reset token
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "OTP verified successfully",
                "reset_token": reset_token
            }
        )
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/api/reset-password-with-otp")
async def reset_password_with_otp(request: dict, db: Session = Depends(get_db)):
    """Reset password using OTP token"""
    try:
        reset_token = request.get("reset_token")
        new_password = request.get("new_password")

        if not reset_token or not new_password:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Reset token and new password are required"})

        # Validate password strength
        if len(new_password) < 6:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Password must be at least 6 characters"})
        elif not re.search(r"[A-Za-z]", new_password) or not re.search(r"\d", new_password):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Password must contain at least 1 letter and 1 number"})

        try:
            payload = jwt.decode(reset_token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            exp = payload.get("exp")
            if email is None or exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
                return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid or expired token"})
        except jwt.PyJWTError:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid token"})

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
