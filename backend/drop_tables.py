import sys
sys.path.append('.')
from models import Base
from database import engine

# Drop all tables
Base.metadata.drop_all(bind=engine)
print("Tables dropped successfully.")

# Recreate all tables
Base.metadata.create_all(bind=engine)
print("Tables recreated successfully.")
