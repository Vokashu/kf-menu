// script.js — С ЭМОДЗИ И ВСЕМИ УЛУЧШЕНИЯМИ

// Экранирование HTML
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Безопасный ID для секций
function getSectionId(category) {
    return 'sec-' + category.toLowerCase().replace(/[^a-z0-9а-яё]/g, '');
}

// 🎨 ЭМОДЗИ ПО КАТЕГОРИЯМ
function getCategoryEmoji(category) {
    const cat = category.toLowerCase();
    if (cat.includes("пиво")) return "🍺";
    if (cat.includes("мясо") || cat.includes("колбасы") || cat.includes("рибай") || cat.includes("шашлык") || cat.includes("птица")) return "🥩";
    if (cat.includes("рыба") || cat.includes("креветк") || cat.includes("сёмга") || cat.includes("скумбрия")) return "🐟";
    if (cat.includes("салат") || cat.includes("разносол") || cat.includes("овощ") || cat.includes("зелень") || cat.includes("брынз")) return "🥗";
    if (cat.includes("хлеб") || cat.includes("брецель") || cat.includes("лаваш") || cat.includes("булочк")) return "🥖";
    if (cat.includes("десерт") || cat.includes("морожен") || cat.includes("штрудель") || cat.includes("торт") || cat.includes("фондан") || cat.includes("милк-шейк")) return "🍰";
    if (cat.includes("соусы")) return "🫙";
    if (cat.includes("суп") || cat.includes("бульон") || cat.includes("гуляш") || cat.includes("похлёб")) return "🍲";
    if (cat.includes("горячие закуски") || cat.includes("крылья") || cat.includes("картофель") || cat.includes("гренки") || cat.includes("наггетт")) return "🍗";
    if (cat.includes("холодные закуски") || cat.includes("сыр") || cat.includes("сельд") || cat.includes("сёмга") || cat.includes("тартар")) return "🧀";
    return "🍽️";
}

let userOrder = {}; 
let currentTotal = 0;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Telegram WebApp
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        document.body.style.backgroundColor = Telegram.WebApp.backgroundColor || '#f5f5f7';
        document.body.style.color = Telegram.WebApp.textColor || '#000';
        
        Telegram.WebApp.BackButton.onClick(() => {
            if (document.getElementById('cart-modal').style.display === 'flex') {
                closeCart();
            } else {
                Telegram.WebApp.close();
            }
        });
        Telegram.WebApp.BackButton.hide();
    }

    loadOrderFromStorage();
    renderCategoryNav();
    renderMenu();
});

// Навигация
function renderCategoryNav() {
    const navContainer = document.getElementById('nav-bar');
    const categories = [...new Set(MENU_DATA.map(item => item.category))];
    let navHtml = '';
    categories.forEach(cat => {
        const safeId = getSectionId(cat);
        navHtml += `<a href="#${safeId}" class="nav-item">${escapeHtml(cat)}</a>`;
    });
    navContainer.innerHTML = navHtml;
}

// Рендер меню с ЭМОДЗИ
function renderMenu() {
    const container = document.getElementById('menu-container');
    const categorizedMenu = MENU_DATA.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    let htmlContent = '';

    for (const category in categorizedMenu) {
        const safeId = getSectionId(category);
        htmlContent += `<div id="${safeId}" class="section-header">${escapeHtml(category)}</div>`;
        
        categorizedMenu[category].forEach(item => {
            htmlContent += `
<div class="menu-item" id="card-${item.id}" onclick="addItem(${item.id})">
    <div class="item-img">
        ${getCategoryEmoji(item.category)}
    </div>
    <div class="item-info">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-price">${item.price} ₽</div>
    </div>
    <div class="item-counter">
        <div class="minus-btn" onclick="event.stopPropagation(); removeItemCheck(${item.id})">−</div>
        <div class="qty-badge" id="qty-${item.id}">1</div>
    </div>
</div>`;
        });
    }
    container.innerHTML = htmlContent;
    
    // Обновляем визуал после рендера
    for (const id in userOrder) {
        updateCardVisuals(id);
    }
}

// Добавление товара
function addItem(id) {
    const item = MENU_DATA.find(i => i.id === id);
    if (!item) return;

    if (!userOrder[id]) {
        userOrder[id] = { name: item.name, price: item.price, history: [] };
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    userOrder[id].history.push(timeString);

    updateCardVisuals(id);
    updateCartSummary();
    saveOrderToStorage();
    
    // Вибрация (если поддерживается)
    if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
    }
}

// Удаление через карточку
function removeItemCheck(id) {
    if (!userOrder[id] || userOrder[id].history.length === 0) return;
    
    if (confirm(`Убрать одну порцию «${escapeHtml(userOrder[id].name)}»?`)) {
        userOrder[id].history.pop();
        updateCardVisuals(id);
        updateCartSummary();
        saveOrderToStorage();
    }
}

// Удаление конкретной записи из чека
function removeSpecificHistoryItem(id, index) {
    if (!userOrder[id] || !userOrder[id].history[index]) return;
    
    userOrder[id].history.splice(index, 1);
    updateCardVisuals(id);
    updateCartSummary();
    saveOrderToStorage();
    openCart();
}

// Обновление визуала карточки
function updateCardVisuals(id) {
    const card = document.getElementById('card-' + id);
    const qtyBadge = document.getElementById('qty-' + id);
    
    if (!userOrder[id] || userOrder[id].history.length === 0) {
        if (card) card.classList.remove('selected');
        if (qtyBadge) qtyBadge.textContent = '1';
    } else {
        if (card) card.classList.add('selected');
        if (qtyBadge) qtyBadge.textContent = userOrder[id].history.length;
    }
}

// Обновление корзины
function updateCartSummary() {
    currentTotal = 0;
    let totalItems = 0;
    for (const id in userOrder) {
        const item = userOrder[id];
        if (item?.history) {
            currentTotal += item.history.length * item.price;
            totalItems += item.history.length;
        }
    }
    
    const cartBar = document.getElementById('cart-bar');
    if (totalItems > 0) {
        document.getElementById('cart-total').textContent = currentTotal.toLocaleString('ru-RU') + ' ₽';
        cartBar.style.display = 'flex';
    } else {
        cartBar.style.display = 'none';
        closeCart();
    }
}

// Открытие чека
function openCart() {
    if (window.Telegram?.WebApp) Telegram.WebApp.BackButton.show();
    
    const listContainer = document.getElementById('order-details-list');
    listContainer.innerHTML = '';
    let hasItems = false;
    
    for (const id in userOrder) {
        const item = userOrder[id];
        const qty = item?.history?.length || 0;

        if (qty > 0) {
            hasItems = true;
            let historyHtml = '';
            item.history.forEach((time, index) => {
                historyHtml += `
<div class="history-item">
    <span>Заказ в ${escapeHtml(time)}</span>
    <button class="delete-single-btn" onclick="removeSpecificHistoryItem(${id}, ${index})">Удалить ✕</button>
</div>`;
            });

            listContainer.innerHTML += `
<div class="order-card">
    <div class="order-header-row">
        <span class="order-name">${escapeHtml(item.name)}</span>
        <span class="order-total-price">${(item.price * qty).toLocaleString('ru-RU')} ₽</span>
    </div>
    <div>${historyHtml}</div>
</div>`;
        }
    }

    if (hasItems) {
        document.getElementById('cart-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие чека
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
    document.body.style.overflow = '';
    if (window.Telegram?.WebApp) Telegram.WebApp.BackButton.hide();
}

// === localStorage ===
function saveOrderToStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('kf_order_v2', JSON.stringify(userOrder));
        }
    } catch (e) {
        console.warn('Не удалось сохранить заказ', e);
    }
}

function loadOrderFromStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('kf_order_v2');
            if (saved) {
                userOrder = JSON.parse(saved);
                // Валидация: удаляем несуществующие позиции
                for (const id in userOrder) {
                    if (!MENU_DATA.some(item => item.id == id)) {
                        delete userOrder[id];
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Ошибка загрузки заказа', e);
        userOrder = {};
    }
}

// Отправка заказа в Telegram
function sendOrderToBot() {
    if (window.Telegram?.WebApp) {
        const dataToSend = { order: userOrder, total: currentTotal };
        window.Telegram.WebApp.sendData(JSON.stringify(dataToSend));
        
        if (confirm("✅ Заказ отправлен!\nОчистить корзину?")) {
            userOrder = {};
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('kf_order_v2');
            }
            updateCartSummary();
            closeCart();
        }
    } else {
        alert('Заказ на сумму ' + currentTotal + ' ₽ сформирован!');
        closeCart();
    }
}
