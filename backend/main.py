from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from collections import defaultdict
import re
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config, UndefinedValueError
from database import get_db, engine
from models import Base, User, Expense, Income

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API", version="1.0.0")

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
ACCESS_TOKEN_EXPIRE_MINUTES = 120
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=120))
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

def generate_otp() -> str:
    return str(random.randint(100000, 999999))


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

def send_email_bg(to_email: str, subject: str, body: str):
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
        print(f"[INFO] Email sent to {to_email}")
    except Exception as e:
        print(f"[ERROR] Failed to send email: {str(e)}")

@app.post("/auth/signup")
async def signup(user_data: dict, db: Session = Depends(get_db), background_tasks: BackgroundTasks = None):
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

# SIGNIN
@app.post("/auth/signin")
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

@app.post("/auth/forgot-password")
async def forgot_password(request: dict, db: Session = Depends(get_db), background_tasks: BackgroundTasks = None):
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

        if background_tasks:
            background_tasks.add_task(
                send_email_bg,
                user.email,
                "Password Reset Request",
                f"Click to reset password: http://localhost:5173/reset-password?token={reset_token}"
            )

        return JSONResponse(status_code=200, content={"status": "success", "message": "Password reset link sent!"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/auth/send-otp")
async def send_otp(request: dict, db: Session = Depends(get_db), background_tasks: BackgroundTasks = None):
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

        if background_tasks:
            background_tasks.add_task(
                send_email_bg,
                user.email,
                "OTP for Password Reset",
                f"Your OTP is {otp}"
            )

        return JSONResponse(status_code=200, content={"status": "success", "message": "OTP sent to your email"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error: {str(e)}"})

@app.post("/auth/verify-otp")
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


@app.post("/auth/reset-password-with-otp")
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

@app.get("/dashboard")
async def get_dashboard_data(email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    
        expenses = db.query(Expense).filter(Expense.user_id == user.id).order_by(Expense.date.desc()).all()
        incomes = db.query(Income).filter(Income.user_id == user.id).all()

        total_spent = sum(exp.amount for exp in expenses)
        total_income = sum(inc.amount for inc in incomes)
        recent_expenses = [
            {
                "date": exp.date.strftime("%Y-%m-%d"),
                "category": exp.category,
                "amount": exp.amount,
                "description": exp.description or ""
            }
            for exp in expenses[:5]
        ]

        category_breakdown = {}
        for exp in expenses:
            category_breakdown[exp.category] = category_breakdown.get(exp.category, 0) + exp.amount

        monthly_expenses = defaultdict(float)
        monthly_incomes = defaultdict(float)
        now = datetime.utcnow()
        two_months_ago = now - timedelta(days=30)

        for exp in expenses:
            if exp.date >= two_months_ago:
                month_key = exp.date.strftime("%Y-%m")
                monthly_expenses[month_key] += exp.amount

        for inc in incomes:
            if inc.income_date >= two_months_ago:
                month_key = inc.income_date.strftime("%Y-%m")
                monthly_incomes[month_key] += inc.amount

        all_months = set(monthly_expenses.keys()) | set(monthly_incomes.keys())

        monthly_trend = [
            {
                "month": month,
                "income": monthly_incomes.get(month, 0),
                "expense": monthly_expenses.get(month, 0)
            }
            for month in sorted(all_months)
        ]

        monthly_average = total_spent / 2 if expenses else 0

        dashboard_data = {
            "total_spent": total_spent,
            "total_income": total_income,
            "recent_expenses": recent_expenses,
            "category_breakdown": category_breakdown,
            "monthly_trend": monthly_trend,
            "monthly_average": monthly_average
        }
        return JSONResponse(status_code=200, content={"status": "success", "data": dashboard_data})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error fetching dashboard data: {str(e)}"})

@app.get("/api/incomes")
async def get_incomes(email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        incomes = db.query(Income).filter(Income.user_id == user.id).order_by(Income.income_date.desc()).all()
        income_list = [
            {
                "id": inc.id,
                "source": inc.source,
                "amount": inc.amount,
                "description": inc.description or "",
                "income_date": inc.income_date.strftime("%Y-%m-%d")
            }
            for inc in incomes
        ]
        return JSONResponse(status_code=200, content={"status": "success", "data": income_list})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error fetching incomes: {str(e)}"})

@app.post("/api/incomes")
async def create_income(income_data: dict, email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        source = income_data.get("source", "").strip()
        amount = income_data.get("amount")
        description = income_data.get("description", "").strip()
        income_date = income_data.get("income_date")

        errors = {}
        if not source:
            errors["source"] = "Source is required"
        if not amount or float(amount) <= 0:
            errors["amount"] = "Amount must be > 0"
        if not income_date:
            errors["income_date"] = "Date is required"

        if errors:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Validation failed", "errors": errors})

        new_income = Income(
            user_id=user.id,
            source=source,
            amount=float(amount),
            description=description or None,
            income_date=datetime.strptime(income_date, "%Y-%m-%d")
        )

        db.add(new_income)
        db.commit()
        db.refresh(new_income)

        return JSONResponse(status_code=201, content={"status": "success", "message": "Income added successfully", "data": {
            "id": new_income.id,
            "source": new_income.source,
            "amount": new_income.amount,
            "description": new_income.description,
            "income_date": new_income.income_date.strftime("%Y-%m-%d")
        }})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error adding income: {str(e)}"})

@app.put("/api/incomes/{income_id}")
async def update_income(income_id: int, income_data: dict, email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        income = db.query(Income).filter(Income.id == income_id, Income.user_id == user.id).first()
        if not income:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Income not found"})

        source = income_data.get("source", "").strip()
        amount = income_data.get("amount")
        description = income_data.get("description", "").strip()
        income_date = income_data.get("income_date")

        errors = {}
        if not source:
            errors["source"] = "Source is required"
        if not amount or float(amount) <= 0:
            errors["amount"] = "Amount must be > 0"
        if not income_date:
            errors["income_date"] = "Date is required"

        if errors:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Validation failed", "errors": errors})

        income.source = source
        income.amount = float(amount)
        income.description = description or None
        income.income_date = datetime.strptime(income_date, "%Y-%m-%d")

        db.commit()
        db.refresh(income)

        return JSONResponse(status_code=200, content={"status": "success", "message": "Income updated successfully", "data": {
            "id": income.id,
            "source": income.source,
            "amount": income.amount,
            "description": income.description,
            "income_date": income.income_date.strftime("%Y-%m-%d")
        }})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error updating income: {str(e)}"})

@app.delete("/api/incomes/{income_id}")
async def delete_income(income_id: int, email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        income = db.query(Income).filter(Income.id == income_id, Income.user_id == user.id).first()
        if not income:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Income not found"})

        db.delete(income)
        db.commit()

        return JSONResponse(status_code=200, content={"status": "success", "message": "Income deleted successfully"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error deleting income: {str(e)}"})

@app.get("/api/expenses")
async def get_expenses(email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
        expense_list = [
            {
                "id": exp.id,
                "amount": exp.amount,
                "category": exp.category,
                "description": exp.description or "",
                "date": exp.date.strftime("%Y-%m-%d")
            }
            for exp in expenses
        ]
        return JSONResponse(status_code=200, content={"status": "success", "data": expense_list})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error fetching expenses: {str(e)}"})

@app.post("/api/expenses")
async def create_expense(expense_data: dict, email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        amount = expense_data.get("amount")
        category = expense_data.get("category", "").strip()
        description = expense_data.get("description", "").strip()
        date = expense_data.get("date")

        errors = {}
        if not amount or float(amount) <= 0:
            errors["amount"] = "Amount must be > 0"
        if not category:
            errors["category"] = "Category is required"
        if not date:
            errors["date"] = "Date is required"

        if errors:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Validation failed", "errors": errors})

        new_expense = Expense(
            user_id=user.id,
            amount=float(amount),
            category=category,
            description=description or None,
            date=datetime.strptime(date, "%Y-%m-%d")
        )

        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)

        return JSONResponse(status_code=201, content={"status": "success", "message": "Expense added successfully", "data": {
            "id": new_expense.id,
            "amount": new_expense.amount,
            "category": new_expense.category,
            "description": new_expense.description,
            "date": new_expense.date.strftime("%Y-%m-%d")
        }})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error adding expense: {str(e)}"})

@app.put("/api/expenses/{expense_id}")
async def update_expense(expense_id: int, expense_data: dict, email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
        if not expense:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Expense not found"})

        amount = expense_data.get("amount")
        category = expense_data.get("category", "").strip()
        description = expense_data.get("description", "").strip()
        date = expense_data.get("date")

        errors = {}
        if not amount or float(amount) <= 0:
            errors["amount"] = "Amount must be > 0"
        if not category:
            errors["category"] = "Category is required"
        if not date:
            errors["date"] = "Date is required"

        if errors:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Validation failed", "errors": errors})

        expense.amount = float(amount)
        expense.category = category
        expense.description = description or None
        expense.date = datetime.strptime(date, "%Y-%m-%d")

        db.commit()
        db.refresh(expense)

        return JSONResponse(status_code=200, content={"status": "success", "message": "Expense updated successfully", "data": {
            "id": expense.id,
            "amount": expense.amount,
            "category": expense.category,
            "description": expense.description,
            "date": expense.date.strftime("%Y-%m-%d")
        }})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error updating expense: {str(e)}"})

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, email: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
        if not expense:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Expense not found"})

        db.delete(expense)
        db.commit()

        return JSONResponse(status_code=200, content={"status": "success", "message": "Expense deleted successfully"})
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Error deleting expense: {str(e)}"})

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Expense Tracker API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)