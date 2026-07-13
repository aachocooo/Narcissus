const CART_KEY = "narcissus-cart";
const ORDERS_KEY = "narcissus-orders";

function readCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    return cart.map((item) => ({ ...item, size: item.size || "M", lineId: item.lineId || `${item.id}-${item.size || "M"}` }));
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function readOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch { return []; }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function money(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
}

function updateCartCount() {
  const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((element) => { element.textContent = count; });
}

function showNotice(message) {
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.setAttribute("role", "status");
  notice.textContent = message;
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 2200);
}

function addToCart(product) {
  const cart = readCart();
  const lineId = `${product.id}-${product.size}`;
  const existing = cart.find((item) => item.lineId === lineId);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, lineId, quantity: 1 });
  saveCart(cart);
  showNotice(`${product.name} added to cart.`);
}

function renderCart() {
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;
  const cart = readCart();
  if (!cart.length) {
    container.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2><p>Add a product from any collection to see it here.</p><a class="button" href="products.html">Browse products</a></div>`;
  } else {
    container.innerHTML = cart.map((item) => `
      <article class="cart-item">
        <div><h2>${item.name}</h2><p>${item.category} &middot; Size ${item.size} &middot; ${money(item.price)} each</p></div>
        <div class="quantity-controls" aria-label="Quantity for ${item.name}">
          <button class="icon-button" type="button" data-cart-action="decrease" data-id="${item.lineId}" aria-label="Decrease quantity">&minus;</button>
          <strong>${item.quantity}</strong>
          <button class="icon-button" type="button" data-cart-action="increase" data-id="${item.lineId}" aria-label="Increase quantity">+</button>
        </div>
        <button class="remove-button" type="button" data-cart-action="remove" data-id="${item.lineId}">Remove</button>
      </article>`).join("");
  }
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 120 : 0;
  document.querySelector("[data-subtotal]").textContent = money(subtotal);
  document.querySelector("[data-shipping]").textContent = money(shipping);
  document.querySelector("[data-total]").textContent = money(subtotal + shipping);
  const checkoutButton = document.querySelector("[data-checkout]");
  if (checkoutButton) checkoutButton.disabled = cart.length === 0;
}

function renderOrders() {
  const container = document.querySelector("[data-order-history]");
  if (!container) return;
  const orders = readOrders();
  if (!orders.length) {
    container.innerHTML = `<div class="empty-state"><h2>No completed orders yet</h2><p>Your checkout confirmation will appear here.</p></div>`;
    return;
  }
  container.innerHTML = orders.map((order) => `
    <article class="order-receipt">
      <div class="order-receipt-header">
        <div><p class="eyebrow">Order ${order.id}</p><h2>Checked out successfully</h2><p>${new Date(order.checkedOutAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p></div>
        <span class="order-status">Checked out</span>
      </div>
      <ul class="order-lines">${order.items.map((item) => `<li><span>${item.name} - Size ${item.size} x ${item.quantity}</span><strong>${money(item.price * item.quantity)}</strong></li>`).join("")}</ul>
      <div class="order-total"><span>Order total</span><strong>${money(order.total)}</strong></div>
    </article>`).join("");
}

function checkout() {
  const cart = readCart();
  if (!cart.length) return;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: `NAR-${Date.now().toString().slice(-8)}`,
    checkedOutAt: new Date().toISOString(),
    items: cart,
    total: subtotal + 120
  };
  saveOrders([order, ...readOrders()]);
  saveCart([]);
  renderCart();
  renderOrders();
  document.querySelector("[data-order-history]").scrollIntoView({ behavior: "smooth", block: "start" });
  showNotice(`Order ${order.id} checked out successfully.`);
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const size = addButton.closest(".product-info").querySelector("[data-size-select]").value;
    addToCart({ id: addButton.dataset.id, name: addButton.dataset.name, category: addButton.dataset.category, price: Number(addButton.dataset.price), size });
    return;
  }
  if (event.target.closest("[data-checkout]")) {
    checkout();
    return;
  }
  const cartButton = event.target.closest("[data-cart-action]");
  if (!cartButton) return;
  const cart = readCart();
  const item = cart.find((entry) => entry.lineId === cartButton.dataset.id);
  if (!item) return;
  if (cartButton.dataset.cartAction === "increase") item.quantity += 1;
  if (cartButton.dataset.cartAction === "decrease") item.quantity -= 1;
  const nextCart = cartButton.dataset.cartAction === "remove" ? cart.filter((entry) => entry.lineId !== item.lineId) : cart.filter((entry) => entry.quantity > 0);
  saveCart(nextCart);
  renderCart();
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    const label = document.createElement("label");
    label.className = "size-picker";
    label.innerHTML = `Size<select data-size-select aria-label="Select size for ${button.dataset.name}"><option>XS</option><option>S</option><option selected>M</option><option>L</option><option>XL</option></select>`;
    button.before(label);
  });
  updateCartCount();
  renderCart();
  renderOrders();
});
