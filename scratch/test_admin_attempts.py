import requests

session = requests.Session()

# Get login page to retrieve CSRF token
response = session.get('http://127.0.0.1:8000/admin/login/')
csrftoken = session.cookies.get('csrftoken')

print("CSRF token fetched:", csrftoken)

# Log in
login_data = {
    'username': 'admin@deba.in',
    'password': 'password123',
    'csrfmiddlewaretoken': csrftoken,
    'next': '/admin/'
}
response = session.post(
    'http://127.0.0.1:8000/admin/login/',
    data=login_data,
    headers={'Referer': 'http://127.0.0.1:8000/admin/login/'}
)

print("Login status:", response.status_code)
if response.status_code == 200 and 'Log in' in response.text:
    print("Login failed! Invalid credentials or error.")

# Fetch login attempts page
response = session.get('http://127.0.0.1:8000/admin/accounts/loginattempt/')
print("Login attempts status:", response.status_code)
if response.status_code == 500:
    print("Error 500 triggered! Response content:")
    print(response.text[:2000])
else:
    print("Success! Response size:", len(response.text))
