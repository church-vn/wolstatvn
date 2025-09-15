
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
// TOAST-FEEDBACK
// ========================
function showToast(message, isError = false, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    if(isError) toast.classList.add('error');
    toast.innerHTML = message;
    document.body.appendChild(toast);

    const timer = setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    }, duration);

    toast.addEventListener('click', () => {
        clearTimeout(timer);
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    });
}

// ========================
// SEND FORM
// ========================
async function sendForm(form) {
    // Проверка обязательных полей
    let allFilled = true;
    form.querySelectorAll('[required]').forEach(input => {
        if(!input.value.trim()) allFilled = false;
    });

    if(!allFilled){
        showToast('❌ Пожалуйста, заполните все обязательные поля!', true, 3000);
        return;
    }

    const eventSelect = form.querySelector('#eventType');
    const selectedBlock = document.getElementById('event-' + eventSelect.value);
    if(!selectedBlock) return;

    const formData = {};
    selectedBlock.querySelectorAll('input, textarea, select').forEach(el => {
        if(!el.disabled) formData[el.name] = el.value.trim() || '—';
    });
    formData.eventType = eventSelect.value;
    formData.eventTypeText = eventSelect.options[eventSelect.selectedIndex].text;

    const scriptURL = 'https://script.google.com/macros/s/AKfycbw1URPRRL9aXgM8b2kcP6CvbosYNPqbvSoBl0Qus6fsXtPtiNgbeYa7ctGmuM0Ya60R/exec';

    showToast('⏳ Отправка данных...', false, 10000);

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        const data = await response.json();

        if(response.ok && data.result === 'success') {
            showToast('✅ Данные успешно отправлены!', false, 7000);
            form.reset();       // сбрасываем форму
            closePopup();       // закрываем попап
        } 
         else {
            throw new Error(data && data.message ? data.message : 'Ошибка сервера');
        }
    } catch(err) {
        console.error(err);
        showToast('Слабое интернет-соединение ⚠️📶. Пожалуйста, попробуйте позже ⏳🔄', true, 7000);
    }
}


// ========================
// CLOSE POPUP
// ========================
function closePopup() {
    const popupBg = document.querySelector('.popup__bg_wolstat');
    const popup = document.querySelector('.popup_wolstat');

    if (popupBg && popup) {
        popupBg.classList.remove('active');
        popup.classList.remove('active');
        unlockScroll(); // снимаем блокировку скролла
    }
}

// ========================
// ATTACH TO FORM
// ========================
if(contactForm) contactForm.addEventListener('submit', e => {
    e.preventDefault();
    closePopup();
    sendForm(contactForm);
});




// ========================
// ФИНАЛИЗАЦИЯ ОТПРАВКИ
// ========================
// function finalizeFormSubmit(success) {
//     if (success) {
//         showMainregPopup('mainregSuccessPopup');
//         document.getElementById('contactForm').reset();
//     } else {
//         showMainregPopup('mainregErrorPopup');
//     }
//     popupBg_wolstat.classList.remove('active');
//     popup_wolstat.classList.remove('active');
//     unlockScroll();
// }

// function showMainregPopup(popupId) {
//     const popup = document.getElementById(popupId);
//     popup.style.display = 'block';

//     const closeBtn = popup.querySelector('.mainreg-popup-close-btn');
//     if (closeBtn) closeBtn.addEventListener('click', () => popup.style.display = 'none');

//     setTimeout(() => popup.style.display = 'none', 15000);
// }

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



