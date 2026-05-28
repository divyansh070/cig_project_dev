import requests
import os

token_response = requests.post(
    "http://127.0.0.1:8000/auth/token",
    data={"username": "testuser", "password": "password123"}
)
if token_response.status_code == 200:
    token = token_response.json()["access_token"]
else:
    # Need to create a user first maybe? Let's just create one.
    requests.post("http://127.0.0.1:8000/auth/register", json={"username": "testuser", "email": "test@test.com", "password": "password123"})
    token_response = requests.post("http://127.0.0.1:8000/auth/token", data={"username": "testuser", "password": "password123"})
    token = token_response.json()["access_token"]

# Now test upload
with open("test_img.jpg", "wb") as f:
    f.write(b"fake image data")

with open("test_img.jpg", "rb") as f:
    files = {"file": ("test_img.jpg", f, "image/jpeg")}
    data = {"event_id": 1}
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post("http://127.0.0.1:8000/media/upload", files=files, data=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
