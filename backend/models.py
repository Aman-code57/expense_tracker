# models.py
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    gender = Column(String(20), nullable=False)
    mobilenumber = Column(String(15), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    reset_token = Column(String(200), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    expenses = relationship("Expense", back_populates="user")
    incomes = relationship("Income", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, fullname={self.fullname})>"

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="expenses")

    def __repr__(self):
        return f"<Expense(id={self.id}, amount={self.amount}, category={self.category})>"

class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text)
    income_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="incomes")

    def __repr__(self):
        return f"<Income(id={self.id}, source={self.source}, amount={self.amount})>"

