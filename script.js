document.addEventListener("DOMContentLoaded", () => {
    const productsContainer = document.getElementById("products-container");
    const countElement = document.getElementById("results-count");

    // Elementos de filtros y ordenamiento
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-select");
    const statusSelect = document.getElementById("status-select");
    const sortSelect = document.getElementById("sort-select");

    let products = [];

    // Cargar los datos desde los archivos JSON individuales
    fetch('content/products/index.json')
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el índice de productos");
            return response.json();
        })
        .then(indexData => {
            const fileNames = indexData.products || [];
            if (fileNames.length === 0) {
                showEmptyState("No hay artículos en el catálogo todavía.");
                return [];
            }

            // Crear promesas para cargar cada archivo JSON individual
            const fetchPromises = fileNames.map(fileName =>
                fetch(`content/products/${fileName}`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(e => {
                        console.error(`Error cargando ${fileName}:`, e);
                        return null;
                    })
            );

            return Promise.all(fetchPromises);
        })
        .then(loadedProducts => {
            if (!loadedProducts || loadedProducts.length === 0) return;

            // Filtrar nulos (archivos que fallaron al cargar)
            products = loadedProducts.filter(p => p !== null);

            if (products.length === 0) {
                showEmptyState("No se pudieron cargar los artículos del catálogo.");
                return;
            }

            populateCategories();
            renderProducts();
        })
        .catch(error => {
            console.error("Error loading products:", error);
            productsContainer.innerHTML = `
                <div class="error">
                    <h3>Error al cargar los artículos</h3>
                    <p>No se pudo establecer conexión con los datos. Por favor, verifica tu conexión.</p>
                </div>`;
            countElement.textContent = "Error";
        });

    // Llenar dinámicamente el selector de categorías
    function populateCategories() {
        const categories = [...new Set(products.map(p => p.categoria))].filter(Boolean);
        categories.sort().forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    // Lógica para mostrar mensajes en vacío
    function showEmptyState(message) {
        productsContainer.innerHTML = `<div class="no-results"><p>${message}</p></div>`;
        countElement.textContent = "0 artículos";
    }

    // Renderizar productos y aplicar filtros
    function renderProducts() {
        if (!products.length) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCategory = categorySelect.value;
        const selectedStatus = statusSelect.value;
        const sortBy = sortSelect.value;

        // Filtrado
        let filteredProducts = products.filter(product => {
            const matchesSearch = !searchTerm || product.titulo.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || product.categoria === selectedCategory;
            const matchesStatus = !selectedStatus || product.estado === selectedStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Ordenamiento por precio
        if (sortBy !== "default") {
            filteredProducts.sort((a, b) => {
                const priceA = Number(a.precio) || 0;
                const priceB = Number(b.precio) || 0;
                return sortBy === "price-asc" ? priceA - priceB : priceB - priceA;
            });
        }

        // Actualizar contador
        countElement.textContent = `Mostrando ${filteredProducts.length} artículo(s)`;

        // Renderizado
        productsContainer.innerHTML = "";

        if (filteredProducts.length === 0) {
            showEmptyState("No se encontraron artículos que coincidan con los filtros actuales.");
            return;
        }

        filteredProducts.forEach((product, index) => {
            const card = document.createElement("div");
            // Delay animado escalonado para un efecto fluido visualmente
            card.className = "product-card fade-in";
            card.style.animationDelay = `${index * 0.05}s`;

            // Formatear precio
            const formattedPrice = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
            }).format(product.precio);

            // Mapeo de colores según estado
            const statusMap = {
                "Por vender": "status-green",
                "Vendido": "status-red",
                "Separado": "status-orange",
                "Ya no se vende": "status-grey"
            };
            const statusClass = statusMap[product.estado] || "status-grey";

            card.innerHTML = `
                <a href="product.html?id=${product.id}" class="card-image-wrapper" style="display: block;">
                    <!-- Si la imagen falla, muestra un placeholder -->
                    <img src="img/${product.codigoImagen}.jpg" alt="${product.titulo}" 
                         loading="lazy" 
                         onerror="this.src='https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=400&h=300&auto=format&fit=crop'; this.onerror=null;">
                    <span class="status-badge ${statusClass}">${product.estado}</span>
                </a>
                <div class="card-content">
                    <span class="category">${product.categoria}</span>
                    <h3 class="title"><a href="product.html?id=${product.id}" class="product-link">${product.titulo}</a></h3>
                    <p class="description">${product.descripcion}</p>
                    <div class="price">${formattedPrice}</div>
                </div>
            `;
            productsContainer.appendChild(card);
        });
    }

    // Escuchar eventos de entrada y cambio para hacer reactivos los filtros
    searchInput.addEventListener("input", renderProducts);
    categorySelect.addEventListener("change", renderProducts);
    statusSelect.addEventListener("change", renderProducts);
    sortSelect.addEventListener("change", renderProducts);
});
