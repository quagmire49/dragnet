import sqlite3
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/user/{username}")
def get_user_profile(username: str):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # SECURITY HIGH: Raw string interpolation enables SQL Injection (' OR '1'='1)
    query = f"SELECT id, role, password_hash FROM users WHERE username = '{username}'"
    cursor.execute(query)

    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {"id": row[0], "role": row[1]}
