(function () {
    'use strict';

    const input = document.getElementById('itemInput');
    const addBtn = document.getElementById('addBtn');
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const totalCount = document.getElementById('totalCount');
    const boughtCount = document.getElementById('boughtCount');
    const leftCount = document.getElementById('leftCount');
    const totalPrice = document.getElementById('totalPrice');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const toast = document.getElementById('toast');
    const currencyBtn = document.getElementById('currencyBtn');
    const currencyModal = document.getElementById('currencyModal');
    const modalClose = document.getElementById('modalClose');
    const currencyList = document.getElementById('currencyList');
    const currencySearch = document.getElementById('currencySearch');
    const storeModal = document.getElementById('storeModal');
    const storeModalClose = document.getElementById('storeModalClose');
    const storeList = document.getElementById('storeList');
    const storeSearch = document.getElementById('storeSearch');

    let items = [];
    let nextId = 1;
    let toastTimeout = null;
    let selectedCurrency = { code: 'USD', symbol: '$', name: 'US Dollar' };
    let selectedItemId = null;

    function showToast(msg, type = 'info') {
        if (toastTimeout) clearTimeout(toastTimeout);
        toast.textContent = msg;
        toast.className = 'toast ' + type;
        void toast.offsetWidth;
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    function updateStats() {
        const total = items.length;
        const bought = items.filter(it => it.bought).length;
        const left = items.filter(it => it.left).length;
        const price = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
        totalCount.textContent = total;
        boughtCount.textContent = bought;
        leftCount.textContent = left;
        totalPrice.textContent = selectedCurrency.symbol + price.toFixed(2);
    }

    function saveState() {
        try {
            localStorage.setItem('comparisonTracker', JSON.stringify(items));
            localStorage.setItem('comparisonTracker_nextId', String(nextId));
            localStorage.setItem('comparisonTracker_currency', JSON.stringify(selectedCurrency));
        } catch (e) {}
    }

    function loadState() {
        try {
            const stored = localStorage.getItem('comparisonTracker');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length) {
                    items = parsed
                        .map(it => ({
                            id: it.id || 0,
                            name: (it.name || '').trim(),
                            bought: !!it.bought,
                            left: !!it.left,
                            price: parseFloat(it.price) || 0,
                        }))
                        .filter(it => it.name);
                    let maxId = 0;
                    items.forEach(it => { if (it.id > maxId) maxId = it.id; });
                    nextId = maxId + 1;
                    const storedNext = localStorage.getItem('comparisonTracker_nextId');
                    if (storedNext) {
                        const parsedNext = parseInt(storedNext, 10);
                        if (!isNaN(parsedNext) && parsedNext > nextId) nextId = parsedNext;
                    }
                    const storedCurrency = localStorage.getItem('comparisonTracker_currency');
                    if (storedCurrency) {
                        try {
                            const parsedCurrency = JSON.parse(storedCurrency);
                            if (parsedCurrency && parsedCurrency.code) {
                                selectedCurrency = parsedCurrency;
                            }
                        } catch (e) {}
                    }
                    return true;
                }
            }
        } catch (e) {}
        return false;
    }

    function render(animateNew = false) {
        const existingIds = new Set();
        document.querySelectorAll('#tableBody tr').forEach(row => {
            const id = parseInt(row.dataset.id, 10);
            if (!isNaN(id)) existingIds.add(id);
        });

        tbody.innerHTML = '';

        if (items.length === 0) {
            emptyState.style.display = 'block';
            updateStats();
            saveState();
            return;
        }
        emptyState.style.display = 'none';

        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;

            if (!animateNew || existingIds.has(item.id)) {
                tr.classList.add('existing');
            }

            const tdName = document.createElement('td');
            const nameDiv = document.createElement('div');
            nameDiv.className = 'item-name';

            const idxSpan = document.createElement('span');
            idxSpan.className = 'item-index';
            idxSpan.textContent = `#${index + 1}`;

            const dot = document.createElement('span');
            dot.className = 'status-dot';
            if (item.bought && item.left) dot.classList.add('both');
            else if (item.bought) dot.classList.add('bought-only');
            else if (item.left) dot.classList.add('left-only');
            else dot.classList.add('none');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name-text';
            nameSpan.textContent = item.name;

            nameDiv.appendChild(idxSpan);
            nameDiv.appendChild(dot);
            nameDiv.appendChild(nameSpan);
            tdName.appendChild(nameDiv);

            const tdBought = document.createElement('td');
            const boughtBtn = document.createElement('button');
            boughtBtn.className = 'btn-toggle bought';
            if (item.bought) boughtBtn.classList.add('active');
            boughtBtn.dataset.id = item.id;
            boughtBtn.dataset.field = 'bought';
            boughtBtn.innerHTML = '<span class="btn-icon">✓</span> Bought';
            tdBought.appendChild(boughtBtn);

            const tdLeft = document.createElement('td');
            const leftBtn = document.createElement('button');
            leftBtn.className = 'btn-toggle left';
            if (item.left) leftBtn.classList.add('active');
            leftBtn.dataset.id = item.id;
            leftBtn.dataset.field = 'left';
            leftBtn.innerHTML = '<span class="btn-icon">✗</span> Left';
            tdLeft.appendChild(leftBtn);

            const tdPrice = document.createElement('td');
            const priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.className = 'price-input';
            priceInput.dataset.id = item.id;
            priceInput.value = item.price || 0;
            priceInput.min = 0;
            priceInput.step = 0.01;
            priceInput.placeholder = selectedCurrency.symbol + '0';
            tdPrice.appendChild(priceInput);

            const tdStore = document.createElement('td');
            const storeBtn = document.createElement('button');
            storeBtn.className = 'btn-store';
            storeBtn.dataset.id = item.id;
            storeBtn.textContent = '🔗 Get Price';
            tdStore.appendChild(storeBtn);

            const tdDel = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-del';
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.dataset.id = item.id;
            tdDel.appendChild(delBtn);

            tr.appendChild(tdName);
            tr.appendChild(tdBought);
            tr.appendChild(tdLeft);
            tr.appendChild(tdPrice);
            tr.appendChild(tdStore);
            tr.appendChild(tdDel);
            tbody.appendChild(tr);
        });

        updateStats();
        saveState();
    }

    function addItem(name) {
        const trimmed = name.trim();
        if (!trimmed) {
            showToast('Please enter a name', 'error');
            return false;
        }

        if (items.some(it => it.name.toLowerCase() === trimmed.toLowerCase())) {
            showToast(`"${trimmed}" already exists`, 'error');
            input.value = '';
            input.focus();
            return false;
        }

        items.push({
            id: nextId++,
            name: trimmed,
            bought: false,
            left: false,
            price: 0,
        });

        input.value = '';
        input.focus();
        render(true);
        showToast(`Added "${trimmed}"`, 'success');
        return true;
    }

    function deleteItem(id) {
        const index = items.findIndex(it => it.id === id);
        if (index === -1) return;

        const itemName = items[index].name;
        const row = tbody.querySelector(`tr[data-id="${id}"]`);

        if (row) {
            row.classList.add('removing');
            setTimeout(() => {
                items.splice(index, 1);
                render(false);
                showToast(`Deleted "${itemName}"`, 'info');
                input.focus();
            }, 200);
        } else {
            items.splice(index, 1);
            render(false);
            showToast(`Deleted "${itemName}"`, 'info');
            input.focus();
        }
    }

    function toggleField(id, field) {
        const item = items.find(it => it.id === id);
        if (!item) return;

        if (field === 'bought') {
            item.bought = !item.bought;
            if (item.bought) item.left = false;
        } else if (field === 'left') {
            item.left = !item.left;
            if (item.left) item.bought = false;
        }

        const row = tbody.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            const dot = row.querySelector('.status-dot');
            if (dot) {
                dot.className = 'status-dot';
                if (item.bought && item.left) dot.classList.add('both');
                else if (item.bought) dot.classList.add('bought-only');
                else if (item.left) dot.classList.add('left-only');
                else dot.classList.add('none');
            }

            const boughtBtn = row.querySelector('.btn-toggle.bought');
            if (boughtBtn) {
                if (item.bought) boughtBtn.classList.add('active');
                else boughtBtn.classList.remove('active');
            }

            const leftBtn = row.querySelector('.btn-toggle.left');
            if (leftBtn) {
                if (item.left) leftBtn.classList.add('active');
                else leftBtn.classList.remove('active');
            }
        }

        updateStats();
        saveState();
    }

    function updatePrice(id, value) {
        const item = items.find(it => it.id === id);
        if (!item) return;
        item.price = parseFloat(value) || 0;
        updateStats();
        saveState();
    }

    function renderCurrencies(filter = '') {
        currencyList.innerHTML = '';
        const search = filter.toLowerCase().trim();
        let filtered = currencies;
        if (search) {
            filtered = currencies.filter(c => 
                c.name.toLowerCase().includes(search) ||
                c.code.toLowerCase().includes(search) ||
                c.symbol.includes(search)
            );
        }
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'currency-no-results';
            noResults.textContent = 'No currencies found';
            currencyList.appendChild(noResults);
            return;
        }
        filtered.forEach(currency => {
            const div = document.createElement('div');
            div.className = 'currency-item';
            if (selectedCurrency.code === currency.code) {
                div.classList.add('active');
            }
            div.innerHTML = `
                <span class="currency-symbol">${currency.symbol}</span>
                <span class="currency-name">${currency.name}</span>
                <span class="currency-code">${currency.code}</span>
            `;
            div.addEventListener('click', function() {
                selectCurrency(currency);
            });
            currencyList.appendChild(div);
        });
    }

    function selectCurrency(currency) {
        selectedCurrency = currency;
        currencyBtn.textContent = currency.symbol;
        renderCurrencies(currencySearch.value);
        updateStats();
        saveState();
        showToast(`Currency changed to ${currency.name} (${currency.symbol})`, 'success');
        currencyModal.classList.remove('show');
        document.querySelectorAll('.price-input').forEach(input => {
            const id = parseInt(input.dataset.id, 10);
            const item = items.find(it => it.id === id);
            if (item) {
                input.placeholder = selectedCurrency.symbol + '0';
            }
        });
        currencySearch.value = '';
    }

    function openCurrencyModal() {
        currencySearch.value = '';
        renderCurrencies('');
        currencyModal.classList.add('show');
        setTimeout(() => currencySearch.focus(), 100);
    }

    function closeCurrencyModal() {
        currencyModal.classList.remove('show');
        currencySearch.value = '';
    }

    function renderStores(filter = '') {
        storeList.innerHTML = '';
        const search = filter.toLowerCase().trim();
        let filtered = stores;
        if (search) {
            filtered = stores.filter(s => 
                s.name.toLowerCase().includes(search) ||
                s.url.toLowerCase().includes(search)
            );
        }
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'store-no-results';
            noResults.textContent = 'No stores found';
            storeList.appendChild(noResults);
            return;
        }
        filtered.forEach(store => {
            const div = document.createElement('div');
            div.className = 'store-item';
            div.innerHTML = `
                <span class="store-name">${store.name}</span>
                <span class="store-url">${store.url.replace('https://', '').replace('/search?q=', '').replace('/s?k=', '').replace('/p/pl?d=', '').split('/')[0]}</span>
            `;
            div.addEventListener('click', function() {
                openStore(store);
            });
            storeList.appendChild(div);
        });
    }

    function openStore(store) {
        const item = items.find(it => it.id === selectedItemId);
        if (!item) {
            showToast('Item not found', 'error');
            return;
        }
        const searchQuery = encodeURIComponent(item.name);
        const url = store.url + searchQuery;
        window.open(url, '_blank');
        storeModal.classList.remove('show');
        storeSearch.value = '';
        showToast(`Searching ${store.name} for "${item.name}"`, 'info');
    }

    function openStoreModal(id) {
        selectedItemId = id;
        storeSearch.value = '';
        renderStores('');
        storeModal.classList.add('show');
        setTimeout(() => storeSearch.focus(), 100);
    }

    function closeStoreModal() {
        storeModal.classList.remove('show');
        storeSearch.value = '';
        selectedItemId = null;
    }

    currencyBtn.addEventListener('click', openCurrencyModal);
    modalClose.addEventListener('click', closeCurrencyModal);
    currencyModal.addEventListener('click', function(e) {
        if (e.target === currencyModal) {
            closeCurrencyModal();
        }
    });
    currencySearch.addEventListener('input', function() {
        renderCurrencies(this.value);
    });
    currencySearch.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCurrencyModal();
        }
    });

    storeModalClose.addEventListener('click', closeStoreModal);
    storeModal.addEventListener('click', function(e) {
        if (e.target === storeModal) {
            closeStoreModal();
        }
    });
    storeSearch.addEventListener('input', function() {
        renderStores(this.value);
    });
    storeSearch.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeStoreModal();
        }
    });

    function clearAll() {
        if (items.length === 0) {
            showToast('No items to clear', 'info');
            return;
        }
        if (!confirm('Remove all items?')) return;
        items = [];
        render(false);
        input.focus();
        showToast('All cleared', 'info');
    }

    addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        addItem(input.value);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem(input.value);
        }
        if (e.key === 'Escape') {
            input.value = '';
            input.blur();
        }
    });

    tbody.addEventListener('click', function (e) {
        const delBtn = e.target.closest('.btn-del');
        if (delBtn) {
            const id = parseInt(delBtn.dataset.id, 10);
            if (id) deleteItem(id);
            return;
        }

        const storeBtn = e.target.closest('.btn-store');
        if (storeBtn) {
            const id = parseInt(storeBtn.dataset.id, 10);
            if (id) {
                openStoreModal(id);
            }
            return;
        }

        const toggleBtn = e.target.closest('.btn-toggle');
        if (toggleBtn) {
            const id = parseInt(toggleBtn.dataset.id, 10);
            const field = toggleBtn.dataset.field;
            if (id && field) {
                toggleField(id, field);
            }
            return;
        }
    });

    tbody.addEventListener('input', function (e) {
        const priceInput = e.target.closest('.price-input');
        if (priceInput) {
            const id = parseInt(priceInput.dataset.id, 10);
            if (id) {
                updatePrice(id, priceInput.value);
            }
        }
    });

    clearAllBtn.addEventListener('click', clearAll);

    const loaded = loadState();
    if (!loaded || items.length === 0) {
        items = [
            { id: nextId++, name: 'CPU', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'GPU', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'Motherboard', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'RAM', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'Storage', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'PSU', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'Case', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'Keyboard', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'Mouse', bought: false, left: false, price: 0 },
            { id: nextId++, name: 'Monitor', bought: false, left: false, price: 0 },
        ];
        showToast('Loaded items', 'info');
    }

    currencyBtn.textContent = selectedCurrency.symbol;
    render(false);

    if (items.length === 0) setTimeout(() => input.focus(), 100);
})();