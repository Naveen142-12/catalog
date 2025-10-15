
Product Catalog Application
A simple web application for displaying and managing a product catalog. The frontend is built with HTML, CSS, and vanilla JavaScript, and it fetches product data from a Python Flask backend. This setup is designed to be lightweight, easy to run, and demonstrates a clear separation of concerns between the client and server.

🚀 Features
Dynamic Data Fetching: Retrieves product and variant data from a RESTful API.

Variant Selection: Allows users to select product variants by color and size.

Real-time Pricing: Calculates total cost based on selected quantity and variant pricing tiers.

Live Server: The frontend runs with a live server for a smooth development experience.

🛠️ Technologies Used
Frontend:

HTML5

CSS3

JavaScript (ES6+)

Backend:

Python 3

Flask: A lightweight web framework.

Flask-CORS: Enables cross-origin requests from the frontend.

📦 Installation and Setup
Follow these steps to get the project running on your local machine.

1. Install Backend Dependencies
Navigate to the backend directory and install the required Python packages using pip.

Bash
cd backend
pip install Flask Flask-CORS

2. Run the Backend Server
Start the Flask application. It will run on http://127.0.0.1:5000 by default.

bash
python app.py
3. Run the Frontend
Open the index.html file in your browser. For the best experience, use a live server extension (like the one in VS Code) to get live reloading.

Using VS Code Live Server: Right-click on index.html and select "Open with Live Server".

🗺️ API Endpoints
The backend provides the following endpoints to the frontend.

GET /api/products/<product_id>: Fetches a single product's main details, including all its variants.

GET /api/products/<product_id>/variant-by-attributes: Finds a specific variant by its color and size.

Query Parameters: color=<value>, size=<value>

POST /api/products/<product_id>/pricing: Calculates the total price for a given variant and quantity.

Request Body: {"variant_id": "string", "quantity": "integer"}
