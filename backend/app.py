from flask import Flask, jsonify, request, current_app
from flask_cors import CORS
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.debug = True

# Enable CORS for all origins in development
CORS(app, resources={r"/*": {"origins": "*"}})

# Log all requests
@app.before_request
def log_request_info():
    logger.debug('Headers: %s', request.headers)
    logger.debug('Body: %s', request.get_data())

# --------------------------
# Helper: Load product data
# --------------------------
def load_product_data():
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data", "product_sample.json")
    logger.debug(f"Looking for product data at: {data_path}")
    
    if not os.path.exists(data_path):
        logger.error(f"Product data file not found at {data_path}")
        logger.debug(f"Current directory contents: {os.listdir(current_dir)}")
        if os.path.exists(os.path.join(current_dir, "data")):
            logger.debug(f"Data directory contents: {os.listdir(os.path.join(current_dir, 'data'))}")
        raise FileNotFoundError(f"Product data file not found at {data_path}")
    
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            logger.debug(f"Successfully loaded product data: {json.dumps(data)[:200]}...")
            return data
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in product data file: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error loading product data: {e}")
        raise

# ------------------------------
# Endpoint 1: Basic Product Data
# ------------------------------
@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        data = load_product_data()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@app.route("/api/products/<product_id>", methods=["GET"])
def get_product_basic(product_id):
    logger.debug(f"Received request for product ID: {product_id}")
    try:
        data = load_product_data()
        logger.debug(f"Product data loaded. Product ID in data: {data['Id']}")
        
        # Verify product ID matches
        if str(data["Id"]) != str(product_id):
            logger.warning(f"Product ID mismatch. Requested: {product_id}, Found: {data['Id']}")
            return jsonify({"error": "Product not found"}), 404
        
        # Extract unique colors and sizes from variants
        colors = list(set([v["Attributes"]["Color"] for v in data["Variants"]]))
        sizes = list(set([v["Attributes"]["Size"] for v in data["Variants"]]))
        
        # Build response
        response = {
            "id": data["Id"],
            "name": data["Name"],
            "number": data["Number"],
            "description": data["Description"],
            "isNew": data["IsNew"],
            "images": data["Images"],
            "mainImage": data["ImageUrl"],
            "origin": data["Origin"],
            "themes": data["Themes"],
            "attributes": {
                "colors": colors,
                "sizes": sizes
            },
            "priceRange": {
                "lowest": data["LowestPrice"],
                "highest": data["HighestPrice"]
            },
            "supplier": data["Supplier"],
            "shipping": data["Shipping"],
            "variants": [
                {
                    "id": v["Id"],
                    "name": v["Name"],
                    "number": v["Number"],
                    "color": v["Attributes"]["Color"],
                    "size": v["Attributes"]["Size"],
                    "imageUrl": v["ImageUrl"]
                }
                for v in data["Variants"]
            ]
        }
        
        return jsonify(response), 200
        
    except FileNotFoundError:
        return jsonify({"error": "Product data file not found"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------------------
# Endpoint 2: Specific Variant Information
# ----------------------------------------
@app.route("/api/products/<product_id>/variants/<variant_id>", methods=["GET"])
def get_variant_details(product_id, variant_id):
    try:
        data = load_product_data()
        
        # Verify product ID
        if str(data["Id"]) != str(product_id):
            return jsonify({"error": "Product not found"}), 404
        
        # Find the specific variant
        variant = None
        for v in data["Variants"]:
            if str(v["Id"]) == str(variant_id):
                variant = v
                break
        
        if not variant:
            return jsonify({"error": "Variant not found"}), 404
        
        # Build variant response
        response = {
            "id": variant["Id"],
            "name": variant["Name"],
            "number": variant["Number"],
            "description": variant["Description"],
            "imageUrl": variant["ImageUrl"],
            "attributes": variant["Attributes"],
            "prices": variant["Prices"],
            "priceIncludes": variant["PriceIncludes"],
            "shipping": variant["Shipping"]
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Endpoint 3: Pricing Calculation
# -------------------------------
@app.route("/api/products/<product_id>/pricing", methods=["POST"])
def calculate_pricing(product_id):
    try:
        data = load_product_data()
        # Be tolerant: try to parse JSON even if Content-Type header is missing
        req = request.get_json(silent=True)
        if req is None:
            try:
                raw = request.get_data() or b'{}'
                req = json.loads(raw)
            except Exception:
                logger.debug('Failed to parse body as JSON, raw body: %s', request.get_data())
                req = {}
        
        # Verify product ID
        if str(data["Id"]) != str(product_id):
            return jsonify({"error": "Product not found"}), 404
        
        variant_id = req.get("variant_id")
        quantity = req.get("quantity")

        logger.debug('calculate_pricing called with variant_id=%s quantity=%s', variant_id, quantity)

        # Validate input strictly (allow 0 if that were meaningful)
        if variant_id is None or quantity is None:
            return jsonify({"error": "variant_id and quantity are required"}), 400
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return jsonify({"error": "Quantity must be positive"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid quantity"}), 400
        
        # Find the variant
        variant = None
        for v in data["Variants"]:
            if str(v["Id"]) == str(variant_id):
                variant = v
                break
        
        if not variant:
            return jsonify({"error": "Variant not found"}), 404
        
        # Find applicable pricing tier
        applicable_price = None
        for price_tier in variant["Prices"]:
            if price_tier["Quantity"]["From"] <= quantity <= price_tier["Quantity"]["To"]:
                applicable_price = price_tier
                break
        
        # If quantity exceeds all tiers, use the last tier
        if not applicable_price and variant["Prices"]:
            last_tier = max(variant["Prices"], key=lambda x: x["Quantity"]["To"])
            if quantity >= last_tier["Quantity"]["From"]:
                applicable_price = last_tier

        # If quantity is below the minimum tier, fall back to the first tier (allow small orders)
        if not applicable_price and variant["Prices"]:
            first_tier = min(variant["Prices"], key=lambda x: x["Quantity"]["From"]) 
            if quantity < first_tier["Quantity"]["From"]:
                logger.debug('Quantity %s below first tier From=%s, falling back to first tier', quantity, first_tier["Quantity"]["From"]) 
                applicable_price = first_tier
        
        if not applicable_price:
            return jsonify({"error": "No pricing available for this quantity"}), 400
        
        # Calculate totals
        unit_price = applicable_price["Price"]
        unit_cost = applicable_price["Cost"]
        total_price = round(unit_price * quantity, 2)
        total_cost = round(unit_cost * quantity, 2)
        
        response = {
            "variant_id": variant["Id"],
            "variant_name": variant["Name"],
            "quantity": quantity,
            "pricing_tier": {
                "range": f"{applicable_price['Quantity']['From']}-{applicable_price['Quantity']['To']}",
                "from": applicable_price["Quantity"]["From"],
                "to": applicable_price["Quantity"]["To"]
            },
            "unit_price": unit_price,
            "unit_cost": unit_cost,
            "total_price": total_price,
            "total_cost": total_cost,
            "currency": applicable_price["CurrencyCode"],
            "price_includes": variant["PriceIncludes"]
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------
# Endpoint 4: Get Variant by Color/Size
# --------------------------------
@app.route("/api/products/<product_id>/variant-by-attributes", methods=["GET"])
def get_variant_by_attributes(product_id):
    try:
        data = load_product_data()
        
        # Verify product ID
        if str(data["Id"]) != str(product_id):
            return jsonify({"error": "Product not found"}), 404
        
        color = request.args.get("color")
        size = request.args.get("size")
        
        if not color or not size:
            return jsonify({"error": "Both color and size parameters are required"}), 400
        
        # Find variant by color and size
        variant = None
        for v in data["Variants"]:
            if (v["Attributes"]["Color"].lower() == color.lower() and 
                v["Attributes"]["Size"].lower() == size.lower()):
                variant = v
                break
        
        if not variant:
            return jsonify({"error": f"No variant found for {color} - {size}"}), 404
        
        # Build response
        response = {
            "id": variant["Id"],
            "name": variant["Name"],
            "number": variant["Number"],
            "description": variant["Description"],
            "imageUrl": variant["ImageUrl"],
            "attributes": variant["Attributes"],
            "prices": variant["Prices"],
            "priceIncludes": variant["PriceIncludes"],
            "shipping": variant["Shipping"]
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)