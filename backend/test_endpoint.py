import requests

# Register a completely new user
requests.post("http://127.0.0.1:8000/auth/register", json={"username": "testuser99", "email": "test99@test.com", "password": "password123"})
token_response = requests.post("http://127.0.0.1:8000/auth/token", data={"username": "testuser99", "password": "password123"})
token = token_response.json().get("access_token")
print("Token:", token)

if token:
    with open("test_img.jpg", "wb") as f:
        f.write(b"fake image data")

    with open("test_img.jpg", "rb") as f:
        files = {"file": ("test_img.jpg", f, "image/jpeg")}
        data = {"event_id": 1}
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post("http://127.0.0.1:8000/media/upload", files=files, data=data, headers=headers)
        print(f"Upload Response: {response.status_code} - {response.text}")
