@echo off
set DATABASE_URL=mysql+pymysql://root:password%%4012345@localhost:3306/ecommerce_admin
echo DATABASE_URL set to: %DATABASE_URL%
echo Starting backend server...
python backend.py

