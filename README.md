# Candidate Project: Product Catalog Viewer

## Overview

This project evaluates your ability to:

- Integrate with a mock API
- Parse and use structured JSON product data
- Build a responsive, user-friendly product viewer
- Implement dynamic variant and pricing logic

---

## Setup Instructions

### Backend (Flask)

You must use the provided Flask backend.

```powershell
cd backend
# (optional) activate your virtualenv
# .\venv\Scripts\Activate
python app.py
```

The product API will be available at:
http://127.0.0.1:5000/api/products/722541043

---

### Frontend (Use any framework of your choice)

You may use React, Vue, Svelte, Vanilla JS, etc.  
(React + Vite + Tailwind is recommended, but not required.)

If using Node-based tooling:

```bash
cd frontend
npm install
npm run dev
```

Make sure the frontend can fetch data from the backend on `localhost:5000`.

---

Quick diagnostics
-----------------

1. Start the backend (PowerShell):

```powershell
cd E:\Catalog\product-catalog\backend
python app.py
```

2. Start the frontend in a separate PowerShell window:

```powershell
cd E:\Catalog\product-catalog\frontend
python -m http.server 5500
```

3. Open http://127.0.0.1:5500 and click the "Run diagnostics" button at the top of the page to test product/variant/pricing endpoints. The diagnostics panel will display statuses and sample results.

---

## UI Requirements

Your product viewer must be structured as follows:

### Product Image Gallery

- On the left, display the main product image.
- Below it, show smaller thumbnails of other variant images.
- Clicking a thumbnail should update the main image.

### Product Details Panel

On the right side, display:

- Product Name
- Product Description
- Selectable Attributes:
  - Color (dropdown or buttons)
  - Size (dropdown or buttons)

### Pricing Table (Auto-updated)

- When a variant (Color + Size) is selected:
  - Display a table of pricing tiers for that variant.
    - Columns: Quantity Range, Unit Price, Cost
- Below the table:
  - Allow users to enter a desired quantity
  - Display the calculated price based on quantity and applicable pricing tier

### Shipping Information

- Display variant-specific shipping data such as:
  - Weight per package
  - Items per package
  - Package dimensions

---

## Features to Implement

- [ ] Fetch product data from the backend API
- [ ] Display product name and image gallery
- [ ] Allow color and size selection
- [ ] Update image and pricing info based on selected variant
- [ ] Show pricing tiers for the selected variant
- [ ] Accept quantity input and calculate final pricing
- [ ] Display variant-specific shipping details

---

## Bonus Points

- Use TailwindCSS for styling
- Ensure layout is responsive
- Split your frontend into reusable components
- Add basic error handling (e.g. fallback if variant not found)

---

## Submission Guidelines

Please follow these steps to submit your completed project.

### Deadline

Submit your solution within 48 hours of receiving the assignment.

### How to Submit (Choose one):

- Option A: Create a public GitHub repository and share the link
- Option B: Zip the entire project folder and email it to: Nikhil@y-not.com

### What to Include

- Full working code (backend and frontend)
- `README.md` with any notes or assumptions
- Ensure `npm install` and `npm run dev` work without issues
- Clean, modular, and well-commented code

---

Note: Submissions received after the 48-hour window may not be considered unless an extension was requested in advance.
