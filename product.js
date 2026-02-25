document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const loadingEl = document.getElementById('loading');
    const productContainer = document.getElementById('product-container');

    if (!productId) {
        showError("No se especificó un ID de producto.");
        return;
    }

    // Cargar directamente el producto (ya sabemos el naming convention gracias al ID, o bien buscándolo)
    // Asumiremos que el archivo se llama `${productId}.json` directamente,
    // o podemos cargar el index para validarlo primero.

    fetch('content/products/index.json')
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
            return response.json();
        })
        .then(indexData => {
            const fileName = indexData.products.find(f => f.includes(productId));
            if (!fileName) {
                throw new Error("Producto no encontrado en el índice.");
            }
            return fetch(`content/products/${fileName}`);
        })
        .then(res => {
            if (!res.ok) throw new Error("Producto no encontrado.");
            return res.json();
        })
        .then(product => {
            // Cambiamos el título de la pestaña para mejorar experiencia de usuario
            document.title = `${product.titulo} - Detalle`;
            renderProduct(product);
        })
        .catch(error => {
            console.error("Error loading product:", error);
            showError("Hubo un error al cargar el producto.");
        });

    function showError(message) {
        loadingEl.style.display = 'none';
        productContainer.style.display = 'block';
        productContainer.innerHTML = `<div class="error"><h3>Error</h3><p>${message}</p><a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Volver al catálogo</a></div>`;
    }

    function renderProduct(product) {
        loadingEl.style.display = 'none';
        productContainer.style.display = 'grid';

        const formattedPrice = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(product.precio);

        const statusMap = {
            "Por vender": "status-green",
            "Vendido": "status-red",
            "Separado": "status-orange",
            "Ya no se vende": "status-grey"
        };
        const statusClass = statusMap[product.estado] || "status-grey";

        let displayDescription = product.descripcionHtml || product.descripcion || "";
        if (!product.descripcionHtml && displayDescription) {
            displayDescription = displayDescription.replace(/\n/g, "<br>");
        }

        productContainer.innerHTML = `
            <div class="product-image-container fade-in">
                <img src="img/${product.codigoImagen}.jpg" alt="${product.titulo}"
                     onerror="this.src='https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=400&h=300&auto=format&fit=crop'; this.onerror=null;">
            </div>
            <div class="product-info-container fade-in" style="animation-delay: 0.1s">
                <span class="status-badge ${statusClass}">${product.estado}</span>
                <span class="category" style="margin-top: 0.75rem;">${product.categoria}</span>
                <h2 class="title" style="margin-top: 0.5rem; margin-bottom: 0.25rem;">${product.titulo}</h2>
                <div class="price" style="margin-bottom: 1.5rem;">${formattedPrice}</div>
                
                <div class="product-detail-description">
                    ${displayDescription}
                </div>

                <div class="copy-actions">
                    <label for="preview-text" style="font-size: 0.875rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Vista previa para Marketplace:</label>
                    <textarea id="preview-text" class="preview-box" readonly></textarea>
                    
                    <button id="btn-copy-marketplace" class="btn btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span>Copiar para Marketplace</span>
                    </button>
                    
                    <button id="btn-copy-desc" class="btn btn-secondary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="14" height="14" rx="2" ry="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>
                        <span>Copiar solo descripción</span>
                    </button>
                </div>
            </div>
        `;

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = displayDescription;
        const plainDesc = tempDiv.innerText || tempDiv.textContent;

        const marketplaceDesc = product.descripcionMarketplace || plainDesc;
        const simpleDesc = product.descripcionMarketplace || plainDesc;

        const marketplaceText = `🛒 ${product.titulo}\n\n` +
            `$ ${formattedPrice}\n\n` +
            `🏷️ Categoría: ${product.categoria}\n` +
            `📌 Estado: ${product.estado}\n` +
            `🆔 Código: ${product.codigoImagen}\n\n` +
            `📝 Descripción:\n${marketplaceDesc}\n`;

        const previewBox = document.getElementById("preview-text");
        previewBox.value = marketplaceText;

        document.getElementById('btn-copy-marketplace').addEventListener('click', () => {
            copyToClipboard(marketplaceText, 'btn-copy-marketplace', "¡Copiado para Marketplace! ✅");
        });
        document.getElementById('btn-copy-desc').addEventListener('click', () => {
            copyToClipboard(simpleDesc, 'btn-copy-desc', "¡Descripción copiada! ✅");
        });
    }

    function copyToClipboard(text, btnId, msg) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById(btnId);
            const span = btn.querySelector('span');
            const originalText = span.textContent;

            span.textContent = msg;
            btn.style.backgroundColor = 'var(--status-green)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--status-green)';

            setTimeout(() => {
                span.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }, 2500);
        }).catch(err => {
            console.error('Error al copiar: ', err);
            prompt("Tu navegador bloqueó el pegado automático. Copia el texto desde aquí:", text);
        });
    }
});
