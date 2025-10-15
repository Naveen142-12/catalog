import requests

def test_get_product():
    url = "http://localhost:5000/api/products/722541043"
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        print("Response Headers:", response.headers)
        print("\nResponse Data:", response.json())
    else:
        print("Error!")
        print("Response:", response.text)

if __name__ == "__main__":
    test_get_product()