"""Test JWT token validity"""
import jwt
from auth import SECRET_KEY, ALGORITHM

# Paste token dari browser console (ganti dengan token Anda)
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImV4cCI6MTc3Njg2MTYwMH0.xyz123"

print("=== JWT Token Test ===")
print(f"SECRET_KEY loaded: {'YES' if SECRET_KEY else 'NO'}")
print(f"SECRET_KEY first 30 chars: {SECRET_KEY[:30]}...")
print(f"ALGORITHM: {ALGORITHM}")
print()

try:
    payload = jwt.decode(TOKEN, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"✅ Token VALID!")
    print(f"Payload: {payload}")
except jwt.ExpiredSignatureError:
    print("❌ Token EXPIRED")
except jwt.InvalidTokenError as e:
    print(f"❌ Token INVALID: {e}")
