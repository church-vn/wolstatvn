
// ========================
// ПЕРЕКЛЮЧЕНИЕ БЛОКОВ
// ========================
const eventSelect = document.getElementById("eventType");
const eventBlocks = document.querySelectorAll(".event-block");

function hideAllBlocks() {
    eventBlocks.forEach(block => {
        block.style.display = "none";
        block.querySelectorAll("input, textarea, select").forEach(el => {
            el.disabled = true;
            el.removeAttribute("required");
        });
    });
}

eventSelect.addEventListener("change", function() {
    hideAllBlocks();
    const selected = this.value;
    if (selected) {
        const block = document.getElementById("event-" + selected);
        if (block) {
            block.style.display = "block";
            block.querySelectorAll("input, textarea, select").forEach(el => {
                el.disabled = false;
                el.setAttribute("required", "true");
            });
        }
    }
});

hideAllBlocks();

// ========================
// АВТОКОМПЛИТ
// ========================
let members = [];
fetch("peoples.json")
    .then(response => response.json())
    .then(data => { members = data; })
    .catch(err => console.error("Ошибка загрузки peoples.json:", err));

function attachAutocomplete(input) {
    const suggestions = document.createElement("ul");
    suggestions.className = "suggestions";
    input.parentNode.style.position = "relative";
    input.parentNode.appendChild(suggestions);

    function renderList(filterValue) {
        if (!filterValue) {
            suggestions.innerHTML = "";
            return;
        }
        const filtered = members.filter(name =>
            name.toLowerCase().includes(filterValue)
        );
        suggestions.innerHTML = "";
        filtered.forEach(name => {
            const li = document.createElement("li");
            li.textContent = name;
            li.onclick = () => {
                const parts = input.value.split(",");
                parts[parts.length - 1] = " " + name;
                input.value = parts.join(",").trim() + ", ";
                suggestions.innerHTML = "";
                input.focus();
            };
            suggestions.appendChild(li);
        });
    }

    input.addEventListener("input", () => {
        const value = input.value.split(",").pop().trim().toLowerCase();
        renderList(value);
    });

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.innerHTML = "";
        }
    });
}

document.querySelectorAll(".name-input").forEach(input => attachAutocomplete(input));

// ========================
// ФОРМАТИРОВАНИЕ ТЕКСТА
// ========================
function capitalizeEachWord(str) {
    return str.split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function capitalizeFirstWord(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const nameFields = [
    "leader",
    "assistant",
    "preacher",
    "names",
    "newNames",
    "repentanceNames",
    "participants"
];

document.querySelectorAll("input[type=text], textarea").forEach(input => {
    input.addEventListener("blur", () => {
        let value = input.value.trim();
        if (!value) return;

        if (nameFields.includes(input.name)) {
            value = value.split(",").map(name => capitalizeEachWord(name.trim())).join(", ");
        } else {
            value = capitalizeFirstWord(value);
        }
        input.value = value;
    });
});

// ========================
// ПОДАЧА ФОРМЫ
// ========================
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const selectedBlock = document.getElementById("event-" + eventSelect.value);
    if (!selectedBlock) return;

    const formData = {};
    selectedBlock.querySelectorAll("input, textarea, select").forEach(el => {
        if (!el.disabled) formData[el.name] = el.value.trim() || '—';
    });

     // Добавляем тип события
    



    // --- ОТПРАВКА В TELEGRAM ---
    const telegramBotToken = '8450334689:AAEzBpiOP0fdGo7-yygz83M0tTcsUhXs0z0';
    const telegramChatIds = ['-1002763552668'];

    const fieldNames = {
        leader: "Лидер",
        assistant: "Помощник",
        preacher: "Проповедующий",
        topic: "Тема",
        mainThought: "Основная мысль",
        totalPeople: "Общее количество людей",
        names: "Имена людей",
        newPeople: "Количество новых людей",
        newNames: "Имена новых людей",
        repentanceNames: "Имена тех, кто принял Христа",
        repentances: "Приняли Христа",
        rareVisitors: "Нецерковные люди",
        returningVisitors: "Интересующиеся (возвратники)",
        projectName: "Название проекта",
        heardGospel: "Услышали Евангелие",
        biblesGiven: "Сколько людей взяли Библии",
        contactsTotal: "Всего контактов",
        contactsShared: "Подписались на канал",
        eventName: "Название мероприятия",
        participants: "Участники",
        which_homegroup: "Какая домашняя группа",
        date: "Дата"
    };

    let message = `<b>📥 Новое событие: ${eventSelect.options[eventSelect.selectedIndex].text}</b>%0A`;

    for (const key in formData) {
        let value = formData[key];

        // Если поле с именами, выводим в столбик
        if (["names","newNames","repentanceNames","participants"].includes(key)) {
            const namesList = value.split(",").map(n => n.trim()).filter(Boolean).join("%0A");
            message += `<b>${fieldNames[key] || key}:</b>%0A${namesList}%0A`;
        } else {
            message += `<b>${fieldNames[key] || key}:</b> ${value}%0A`;
        }
    }

    let sendCount = 0, errorCount = 0;
    telegramChatIds.forEach(chatId => {
        fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${chatId}&parse_mode=html&text=${message}`)
            .then(response => {
                if (!response.ok) errorCount++; else sendCount++;
                if (sendCount + errorCount === telegramChatIds.length) finalizeFormSubmit(errorCount === 0);
            })
            .catch(() => {
                errorCount++;
                if (sendCount + errorCount === telegramChatIds.length) finalizeFormSubmit(false);
            });
    });

       // ======================== GOOGLE SHEETS ========================
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzm8zONYAwJWO54mbZq_ldLfdoSVFSoezJNDe7eJMtSF_HC5b3ber0AMHrBdzfW-vue/exec';
    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(formData)  // теперь с eventType
    }).catch(err => console.warn("Ошибка отправки в Google Sheets", err));


});



// ========================
// ФИНАЛИЗАЦИЯ ОТПРАВКИ
// ========================
function finalizeFormSubmit(success) {
    if (success) {
        showMainregPopup('mainregSuccessPopup');
        document.getElementById('contactForm').reset();
    } else {
        showMainregPopup('mainregErrorPopup');
    }
    popupBg_wolstat.classList.remove('active');
    popup_wolstat.classList.remove('active');
    unlockScroll();
}

function showMainregPopup(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = 'block';

    const closeBtn = popup.querySelector('.mainreg-popup-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => popup.style.display = 'none');

    setTimeout(() => popup.style.display = 'none', 15000);
}

// ========================
// POPUP И СКРОЛЛ
// ========================
let popupBg_wolstat = document.querySelector('.popup__bg_wolstat');
let popup_wolstat = document.querySelector('.popup_wolstat');
let openPopupButtons_wolstat = document.querySelectorAll('.open-popup_wolstat');
let closePopupButton_wolstat = document.querySelector('.close-popup_wolstat');

let scrollPosition = 0;
function lockScroll() {
    scrollPosition = window.scrollY;
    document.documentElement.classList.add('lock-scroll');
    document.body.classList.add('lock-scroll');
    document.body.style.top = `-${scrollPosition}px`;
}

function unlockScroll() {
    document.documentElement.classList.remove('lock-scroll');
    document.body.classList.remove('lock-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
}

openPopupButtons_wolstat.forEach(button => button.addEventListener('click', e => {
    e.preventDefault();
    popupBg_wolstat.classList.add('active');
    popup_wolstat.classList.add('active');
    lockScroll();
}));

if (closePopupButton_wolstat) closePopupButton_wolstat.addEventListener('click', () => {
    popupBg_wolstat.classList.remove('active');
    popup_wolstat.classList.remove('active');
    unlockScroll();
});
document.addEventListener('click', e => {
    if (e.target === popupBg_wolstat) {
        popupBg_wolstat.classList.remove('active');
        popup_wolstat.classList.remove('active');
        unlockScroll();
    }
});




// ========================
// AOS ANIMATION
// ========================
AOS.init({ duration: 1000, easing: 'ease-in-out', once: true });



