// Configuration
const API_URL = 'http://127.0.0.1:5000/api';  // Using 127.0.0.1 instead of localhost
const PRODUCT_ID = '722541043';

// Color mapping for the color picker
const colorMap = {
    'Red': '#dc2626',
    'White': '#ffffff',
    'Blue': '#2563eb',
    'Green': '#16a34a',
    'Black': '#1f2937'
    
};

// State
let state = {
    product: null,
    selectedColor: null,
    selectedSize: null,
    selectedVariant: null,
    quantity: 1
};

async function fetchProductData() {
    try {
        const apiUrl = `${API_URL}/products/${PRODUCT_ID}`;
        console.log('Fetching product data from:', apiUrl);

        const response = await fetch(apiUrl, { method: 'GET' });
        const json = await response.json();

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        // Normalize backend response into a consistent shape used by the UI
        // Backend returns lowercase keys (name, description, variants). We map to PascalCase fields
        const normalized = {
            Id: json.id || json.Id,
            Name: json.name || json.Name,
            Description: json.description || json.Description,
            ImageUrl: json.mainImage || (json.images && json.images[0]) || json.ImageUrl,
            attributes: json.attributes || json.Attributes || {},
            Variants: (json.variants || json.Variants || []).map(v => ({
                Id: v.id || v.Id,
                Name: v.name || v.Name,
                Number: v.number || v.Number,
                ImageUrl: v.imageUrl || v.ImageUrl,
                // Provide Attributes object so existing code can use Attributes.Color/Size
                Attributes: {
                    Color: v.color || (v.Attributes && v.Attributes.Color),
                    Size: v.size || (v.Attributes && v.Attributes.Size)
                }
            }))
        };

        // Keep raw JSON for any direct lookups
        state.raw = json;
        state.product = normalized;
        console.log('Normalized product data:', state.product);
        // Show diagnostic info
        const diag = document.getElementById('appDiagnostics');
        if (diag) {
            diag.style.display = 'block';
            diag.textContent = `Loaded product: ${state.product.Name} (id: ${state.product.Id})`;
        }
        return state.product;
    } catch (error) {
        console.error('Failed to fetch product:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="error">
                Error loading product: ${error.message}<br>
                Make sure the Flask backend is running on port 5000<br>
                <small>Details: ${error.toString()}</small>
            </div>
        `;
        throw error;
    }
}

async function render() {
    if (!state.product) return;

    const productsGrid = document.getElementById('productsGrid');
    let priceRange;
    
    // Handle both price range formats
    if (state.product.priceRange) {
        priceRange = `$${state.product.priceRange.lowest.Price.toFixed(2)} - $${state.product.priceRange.highest.Price.toFixed(2)}`;
    } else if (state.product.LowestPrice && state.product.HighestPrice) {
        priceRange = `$${state.product.LowestPrice.Price.toFixed(2)} - $${state.product.HighestPrice.Price.toFixed(2)}`;
    } else {
        priceRange = 'Price range not available';
    }
    
    // Get the first available variant's image as default
    const defaultImage = state.product.Variants && state.product.Variants.length > 0 
        ? state.product.Variants[0].ImageUrl 
        : (state.product.ImageUrl || '');
    
    productsGrid.innerHTML = `
        <div class="product-card">
            <img src="${defaultImage}" alt="${state.product.Name || state.product.name}" class="product-image">
            <div class="product-info">
                <h3>${state.product.Name || state.product.name}</h3>
                <p class="description">${state.product.Description || state.product.description}</p>
                <p class="price-range">Price Range: ${priceRange}</p>
                <button id="viewDetailsBtn" class="view-details">View Details</button>
            </div>
        </div>
    `;

    // Wire up the button click after inserting the HTML to avoid inline onclick scoping problems
    const btn = document.getElementById('viewDetailsBtn');
    if (btn) btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProductDialog(state.raw || state.product);
    });
}

function openProductDialog(product) {
    const dialog = document.getElementById('productDialog');
    
    // Accept either raw backend object or normalized product
    const prod = product || state.raw || state.product;

    // Get default variant image
    const defaultVariant = (prod.Variants && prod.Variants.length > 0) ? prod.Variants[0] : null;
    
    // Update dialog content
    document.getElementById('dialogImage').src = defaultVariant ? (defaultVariant.ImageUrl || defaultVariant.imageUrl) : (prod.ImageUrl || prod.ImageUrl);
    document.getElementById('dialogTitle').textContent = prod.Name || prod.name;
    document.getElementById('dialogDescription').textContent = prod.Description || prod.description;
    
    // Extract unique colors and sizes
    // Build colors/sizes from either server raw or normalized shapes
    const variants = prod.Variants || prod.variants || [];
    let colors = Array.from(new Set(variants.map(v => (v.Attributes && v.Attributes.Color) || v.color || v.imageColor || ''))).filter(Boolean);

    // Ensure 'White' is presented as the second radio button for UX preference
    const whiteIdx = colors.indexOf('White');
    if (whiteIdx !== -1) {
        colors.splice(whiteIdx, 1);
        const insertAt = Math.min(1, colors.length);
        colors.splice(insertAt, 0, 'White');
    }
    const sizes = Array.from(new Set(variants.map(v => (v.Attributes && v.Attributes.Size) || v.size || ''))).filter(Boolean);
    
    // Update color options
    const colorOptionsContainer = document.getElementById('colorOptions');
    colorOptionsContainer.innerHTML = colors.map(color => `
        <div class="color-option ${color === state.selectedColor ? 'selected' : ''}"
             style="background-color: ${colorMap[color] || '#ffffff'}"
             data-color="${color}"
             onclick="selectColor('${color}')"></div>
    `).join('');
    
    // Update size options
    const sizeOptionsContainer = document.getElementById('sizeOptions');
    sizeOptionsContainer.innerHTML = sizes.map(size => `
        <button class="size-option ${size === state.selectedSize ? 'selected' : ''}"
                onclick="selectSize('${size}')">${size}</button>
    `).join('');
    
    // Reset quantity to 1
    document.getElementById('quantityInput').value = '1';
    
    // Set initial selections if not already set
    if (!state.selectedColor && colors.length > 0) state.selectedColor = colors[0];
    if (!state.selectedSize && sizes.length > 0) state.selectedSize = sizes[0];
    
    updateDialogPricing();
    try {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.style.display = 'block';
    } catch (e) {
        console.warn('Dialog API not supported, falling back to visible block', e);
        dialog.style.display = 'block';
    }
}

function closeProductDialog() {
    const dialog = document.getElementById('productDialog');
    dialog.close();
    // No products grid to restore; keep dialog closed
}

function selectColor(color) {
    state.selectedColor = color;
    updateDialogColorSelection();
    
    // If the current size isn't available in this color, select the first available size
    const availableSizes = state.product.Variants
        .filter(v => v.Attributes.Color === color)
        .map(v => v.Attributes.Size);
    
    if (!availableSizes.includes(state.selectedSize)) {
        state.selectedSize = availableSizes[0];
        updateDialogSizeSelection();
    }
    
    updateDialogPricing();
}

function selectSize(size) {
    state.selectedSize = size;
    updateDialogSizeSelection();
    
    // If the current color isn't available in this size, select the first available color
    const availableColors = state.product.Variants
        .filter(v => v.Attributes.Size === size)
        .map(v => v.Attributes.Color);
    
    if (!availableColors.includes(state.selectedColor)) {
        state.selectedColor = availableColors[0];
        updateDialogColorSelection();
    }
    
    updateDialogPricing();
}

function updateDialogColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        const color = option.dataset.color;
        if (color === state.selectedColor) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

function updateDialogSizeSelection() {
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        if (option.textContent === state.selectedSize) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

function updateQuantity(delta) {
    const input = document.getElementById('quantityInput');
    const currentValue = parseInt(input.value) || 1;
    const newValue = currentValue + delta;
    
    if (newValue >= 1 && newValue <= 999) {
        input.value = newValue;
        updateDialogPricing();
    }
}

async function updateDialogPricing() {
    if (!state.selectedColor || !state.selectedSize) return;

    try {
        // Prefer server lookup for exact variant to ensure pricing/availability are authoritative
        const apiUrl = `${API_URL}/products/${PRODUCT_ID}/variant-by-attributes?color=${encodeURIComponent(state.selectedColor)}&size=${encodeURIComponent(state.selectedSize)}`;
        const resp = await fetch(apiUrl);
        if (!resp.ok) {
            // Fallback to local lookup if server fails
            console.warn('Variant lookup via API failed, falling back to local lookup');
            var variant = state.product.Variants.find(v => 
                v.Attributes.Color === state.selectedColor && v.Attributes.Size === state.selectedSize
            );
            if (!variant) return;
            state.selectedVariant = variant;
        } else {
            const variantJson = await resp.json();
            // Normalize server variant shape if needed
            const serverVariant = {
                Id: variantJson.id || variantJson.Id,
                Name: variantJson.name || variantJson.Name,
                ImageUrl: variantJson.imageUrl || variantJson.ImageUrl,
                Prices: variantJson.prices || variantJson.Prices || []
            };
            state.selectedVariant = serverVariant;
        }

        // Update the dialog image when color/size changes
        document.getElementById('dialogImage').src = state.selectedVariant.ImageUrl || state.product.ImageUrl;

        const quantity = parseInt(document.getElementById('quantityInput').value) || 1;

        // If server-side pricing endpoint exists, call it
        try {
            const pricingResp = await fetch(`${API_URL}/products/${PRODUCT_ID}/pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variant_id: state.selectedVariant.Id, quantity })
            });

            if (pricingResp.ok) {
                const pricing = await pricingResp.json();
                document.getElementById('unitPrice').textContent = `$${pricing.unit_price.toFixed(2)} per unit`;
                document.getElementById('totalPrice').textContent = `Total: $${pricing.total_price.toFixed(2)}`;
                return;
            }
        } catch (e) {
            console.warn('Server pricing request failed, falling back to local pricing');
        }

        // Local pricing fallback (use variant.Prices tiers if present)
        const localVariant = state.selectedVariant;
        if (localVariant && localVariant.Prices) {
            const applicable = localVariant.Prices.find(p => quantity >= p.Quantity.From && quantity <= p.Quantity.To) || localVariant.Prices[0];
            if (applicable) {
                const unit = applicable.Price || applicable.Price;
                document.getElementById('unitPrice').textContent = `$${unit.toFixed(2)} per unit`;
                document.getElementById('totalPrice').textContent = `Total: $${(unit * quantity).toFixed(2)}`;
            }
        }
    } catch (error) {
        console.error('Error updating pricing:', error);
    }
}

function addToCart() {
    const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
    const variant = state.selectedVariant || {};
    const pricing = variant.Prices && variant.Prices[0];
    const price = pricing ? (pricing.Price * quantity).toFixed(2) : '0.00';

    alert(
        `Added to cart!\n\n` +
        `Product: ${state.product.Name}\n` +
        `Color: ${state.selectedColor}\n` +
        `Size: ${state.selectedSize}\n` +
        `Quantity: ${quantity}\n` +
        `Total Price: $${price}\n` +
        `Variant: ${variant.Name || 'Unknown'}`
    );
    closeProductDialog();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const product = await fetchProductData();
        if (product) {
            // Set initial selections based on either Attributes or attributes property
            const attributes = product.Attributes || product.attributes;
            if (attributes) {
                const colors = attributes.Colors || attributes.colors;
                const sizes = attributes.Sizes || attributes.sizes;
                
                state.selectedColor = colors && colors.length > 0 ? 
                    (colors[0].Name || colors[0]) : null;
                state.selectedSize = sizes && sizes.length > 0 ? 
                    (sizes[0].Name || sizes[0]) : null;
            }
            // Render the product card
            render();
                // Open the dialog as the main view
            // open the dialog using the raw server object (so variant endpoints work)
            openProductDialog(state.raw || state.product);
        }
    } catch (error) {
        console.error('Error initializing:', error);
        const diag = document.getElementById('appDiagnostics');
        const out = document.getElementById('diagOutput');
        if (diag) { diag.style.display = 'block'; }
        if (out) {
            out.textContent = `Error loading product: ${error.message}\nCheck backend or see console for details`;
        }
    }
});

// Diagnostics helper callable from the UI
async function runDiagnostics() {
    const out = document.getElementById('diagOutput');
    const title = document.getElementById('diagTitle');
    const diag = document.getElementById('appDiagnostics');
    if (diag) diag.style.display = 'block';
    if (title) title.textContent = 'Running diagnostics...';
    if (out) out.textContent = '';

    try {
        out.textContent += `GET product...\n`;
        const p = await fetch(`${API_URL}/products/${PRODUCT_ID}`);
        out.textContent += `Status: ${p.status}\n`;
        const pj = await p.json();
        out.textContent += `Product name: ${pj.name || pj.Name}\n\n`;

        out.textContent += `GET variant-by-attributes (Red,S)...\n`;
        const v = await fetch(`${API_URL}/products/${PRODUCT_ID}/variant-by-attributes?color=Red&size=S`);
        out.textContent += `Status: ${v.status}\n`;
        const vj = await v.json();
        out.textContent += `Variant id: ${vj.id || vj.Id}\n\n`;

        out.textContent += `POST pricing (variant, qty=20)...\n`;
        const pr = await fetch(`${API_URL}/products/${PRODUCT_ID}/pricing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variant_id: vj.id || vj.Id, quantity: 20 })
        });
        out.textContent += `Status: ${pr.status}\n`;
        const prj = await pr.json();
        out.textContent += `Total price: ${prj.total_price || prj.totalPrice || prj.totalPrice}\n`;

        title.textContent = 'Diagnostics: OK';
    } catch (e) {
        out.textContent += `Error: ${e.toString()}\n`;
        title.textContent = 'Diagnostics: FAILED';
    }
}