document.addEventListener('DOMContentLoaded', () => {
    const settingsContainer = document.getElementById('settings-container');
    const backBtn = document.getElementById('back-btn');
    const viewTitle = document.getElementById('view-title');
    const enableAllBtn = document.getElementById('enable-all-btn');
    const disableAllBtn = document.getElementById('disable-all-btn');
    const bulkActionsContainer = document.querySelector('.bulk-actions-container');

    let allSettings = [];
    let currentView = 'categories'; // 'categories' or 'details'
    let currentCategory = '';

    // --- Main Render Function ---
    function render() {
        settingsContainer.innerHTML = '';
        if (currentView === 'categories') {
            renderCategoriesView();
        } else {
            renderDetailsView();
        }
    }

    // --- Render Categories View ---
    function renderCategoriesView() {
        viewTitle.textContent = 'Privacy Guard';
        backBtn.classList.add('hidden');
        bulkActionsContainer.style.display = 'flex';

        const orderedCategories = [];
        const categorySet = new Set();
        allSettings.forEach(setting => {
            if (!categorySet.has(setting.category)) {
                categorySet.add(setting.category);
                orderedCategories.push(setting.category);
            }
        });
        
        orderedCategories.forEach(category => {
            const item = document.createElement('div');
            item.classList.add('category-item');

            const nameDiv = document.createElement('div');
            nameDiv.classList.add('category-item-name');
            nameDiv.textContent = category;
            nameDiv.addEventListener('click', () => {
                currentView = 'details';
                currentCategory = category;
                render();
            });

            // --- Category Master Toggle Logic ---
            const settingsForCategory = allSettings.filter(s => s.category === category);
            const allEnabled = settingsForCategory.every(s => s.status === 'enabled');

            const switchLabel = document.createElement('label');
            switchLabel.classList.add('switch');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = allEnabled;
            checkbox.addEventListener('change', async (event) => {
                const enable = event.target.checked;
                try {
                    await window.electronAPI.setCategorySettings(category, enable);
                    // Update local state to reflect the change instantly
                    settingsForCategory.forEach(s => s.status = enable ? 'enabled' : 'disabled');
                } catch (error) {
                    console.error(`Failed to update category ${category}:`, error);
                    event.target.checked = !enable; // Revert on failure
                }
            });

            const sliderSpan = document.createElement('span');
            sliderSpan.classList.add('slider');
            switchLabel.appendChild(checkbox);
            switchLabel.appendChild(sliderSpan);
            // ---

            item.appendChild(nameDiv);
            item.appendChild(switchLabel);
            settingsContainer.appendChild(item);
        });
    }

    // --- Render Details View ---
    function renderDetailsView() {
        viewTitle.textContent = currentCategory;
        backBtn.classList.remove('hidden');
        bulkActionsContainer.style.display = 'none';

        const settingsForCategory = allSettings.filter(s => s.category === currentCategory);

        settingsForCategory.forEach(setting => {
            const item = document.createElement('div');
            item.classList.add('setting-item');

            const textDiv = document.createElement('div');
            textDiv.classList.add('setting-text');
            const nameDiv = document.createElement('div');
            nameDiv.classList.add('name');
            nameDiv.textContent = setting.name;
            const descDiv = document.createElement('div');
            descDiv.classList.add('description');
            descDiv.textContent = setting.description;
            textDiv.appendChild(nameDiv);
            textDiv.appendChild(descDiv);

            const switchLabel = document.createElement('label');
            switchLabel.classList.add('switch');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = setting.status === 'enabled';
            checkbox.addEventListener('change', async (event) => {
                try {
                    await window.electronAPI.setSetting(setting.id, event.target.checked);
                    // Update the setting in the local state as well
                    const settingInState = allSettings.find(s => s.id === setting.id);
                    if(settingInState) settingInState.status = event.target.checked ? 'enabled' : 'disabled';
                } catch (error) {
                    console.error(`Failed to update setting ${setting.id}:`, error);
                    event.target.checked = !event.target.checked; // Revert on failure
                }
            });
            const sliderSpan = document.createElement('span');
            sliderSpan.classList.add('slider');
            switchLabel.appendChild(checkbox);
            switchLabel.appendChild(sliderSpan);

            item.appendChild(textDiv);
            item.appendChild(switchLabel);

            settingsContainer.appendChild(item);
        });
    }

    // --- Event Listeners ---
    backBtn.addEventListener('click', () => {
        currentView = 'categories';
        currentCategory = '';
        render();
    });

    async function handleBulkUpdate(enable) {
        const btn = enable ? enableAllBtn : disableAllBtn;
        btn.disabled = true;
        btn.textContent = 'Обработка...';
        try {
            await window.electronAPI.setAllSettings(enable);
            // Refetch all settings to update state
            allSettings = await window.electronAPI.getSettings();
            render(); // Re-render the current view
        } catch (error) {
            console.error('Bulk update failed:', error);
            // Optionally show an error message to the user
        } finally {
            btn.disabled = false;
            btn.textContent = enable ? 'ВКЛЮЧИТЬ ВСЁ' : 'ОТКЛЮЧИТЬ ВСЁ';
        }
    }

    enableAllBtn.addEventListener('click', () => handleBulkUpdate(true));
    disableAllBtn.addEventListener('click', () => handleBulkUpdate(false));

    // --- Initial Load ---

    async function init() {
        try {
            settingsContainer.innerHTML = '<p>Загрузка настроек...</p>';
            allSettings = await window.electronAPI.getSettings();
            render();
        } catch (error) {
            settingsContainer.innerHTML = `<p style="color: #e74c3c;">Ошибка при загрузке настроек. Убедитесь, что приложение запущено от имени администратора.</p>`;
            console.error('Error fetching settings:', error);
        }
    }

    init();
});