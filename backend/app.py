from flask import Flask, jsonify, request
import json

app = Flask(__name__)

# --------------------------
# Helper: Load product data
# --------------------------
def load_product_data():
    with open("data/product_sample.json") as f:
        return json.load(f)

# ------------------------------
# Endpoint 1: Basic Product Data
# ------------------------------
@app.route("/api/products/<product_id>", methods=["GET"])
def get_product_basic(product_id):
    data = load_product_data()
    # TODO: Return product name, description, attributes, general pricing, images, supplier
    return jsonify({"message": "Basic product data placeholder"})

# ----------------------------------------
# Endpoint 2: Specific Variant Information
# ----------------------------------------
@app.route("/api/products/<product_id>/variants/<variant_id>", methods=["GET"])
def get_variant_details(product_id, variant_id):
    data = load_product_data()
    # TODO: Return variant name, description, image, attributes, pricing, price includes
    return jsonify({"message": "Variant details placeholder"})

# -------------------------------
# Endpoint 3: Pricing Calculation
# -------------------------------
@app.route("/api/products/<product_id>/pricing", methods=["POST"])
def calculate_pricing(product_id):
    data = load_product_data()
    req = request.get_json()
    variant_id = req.get("variant_id")
    quantity = req.get("quantity")
    # TODO: Calculate pricing based on variant & quantity
    return jsonify({"message": "Calculated pricing placeholder"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)