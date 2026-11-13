
// ==========================================
// 1. ELEMENTOS DEL DOM
// ==========================================

const form = document.getElementById("registration-form");
const registrationsList = document.getElementById("registrations-list");
const registrationCount = document.getElementById("registration-count");

const quotesContainer = document.getElementById("quotes-container");
const apiLoading = document.getElementById("api-loading");
const reloadQuotesButton = document.getElementById("reload-quotes");

const STORAGE_KEY = "fitcenter_inscripciones";

// ==========================================
// 2. RECUPERAR DATOS DE LOCALSTORAGE
// ==========================================

let registrations = [];

try {
    registrations = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (!Array.isArray(registrations)) {
        registrations = [];
    }
} catch (error) {
    console.error("Error al recuperar los datos:", error);
    registrations = [];
}

// ==========================================
// 3. GUARDAR INFORMACIÓN
// ==========================================

function saveRegistrations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
}

// ==========================================
// 4. VALIDACIONES DINÁMICAS
// ==========================================

const inputs = form.querySelectorAll("input:not([type='checkbox']), select, textarea");

function validateField(field) {
    const valid = field.checkValidity();

    field.classList.toggle("invalid", !valid);
    field.classList.toggle("valid", valid);

    let errorMessage = field.parentElement.querySelector(".error-message");

    if (!valid) {
        if (!errorMessage) {
            errorMessage = document.createElement("small");
            errorMessage.className = "error-message";
            field.parentElement.appendChild(errorMessage);
        }

        errorMessage.textContent = field.validationMessage;
    } else if (errorMessage) {
        errorMessage.remove();
    }

    return valid;
}

// Evento input: valida mientras se escribe.
inputs.forEach(field => {
    field.addEventListener("input", () => {
        validateField(field);
    });

    // Evento change: valida cuando cambia el valor.
    field.addEventListener("change", () => {
        validateField(field);
    });
});

// ==========================================
// 5. MOSTRAR INSCRIPCIONES EN EL DOM
// ==========================================

function renderRegistrations() {
    registrationsList.replaceChildren();

    registrationCount.textContent =
        `Inscritos: ${registrations.length}`;

    if (registrations.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Todavía no hay inscripciones registradas.";
        message.className = "empty-message";

        registrationsList.appendChild(message);
        return;
    }

    registrations.forEach(registration => {
        const card = document.createElement("article");
        card.className = "registration-card";

        const name = document.createElement("h4");
        name.textContent = registration.nombre;

        const email = document.createElement("p");
        email.textContent = `Correo: ${registration.correo}`;

        const phone = document.createElement("p");
        phone.textContent = `Teléfono: ${registration.telefono}`;

        const plan = document.createElement("p");
        plan.textContent = `Plan: ${registration.plan}`;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Editar";
        editButton.className = "action-button edit-button";

        editButton.addEventListener("click", () => {
            editRegistration(registration.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Eliminar";
        deleteButton.className = "action-button delete-button";

        deleteButton.addEventListener("click", () => {
            deleteRegistration(registration.id);
        });

        const actions = document.createElement("div");
        actions.className = "registration-actions";

        actions.append(editButton, deleteButton);

        card.append(name, email, phone, plan, actions);

        registrationsList.appendChild(card);
    });
}

// ==========================================
// 6. REGISTRAR CLIENTES
// ==========================================

form.addEventListener("submit", function(event) {
    event.preventDefault();

    let formIsValid = true;

    inputs.forEach(field => {
        if (!validateField(field)) {
            formIsValid = false;
        }
    });

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!formIsValid) return;

    const newRegistration = {
        id: crypto.randomUUID(),
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        plan: document.getElementById("plan").selectedOptions[0].textContent,
        mensaje: document.getElementById("mensaje").value.trim(),
        fecha: new Date().toLocaleDateString()
    };

    registrations.push(newRegistration);

    saveRegistrations();
    renderRegistrations();

    form.reset();

    inputs.forEach(field => {
        field.classList.remove("valid", "invalid");

        const error = field.parentElement.querySelector(".error-message");

        if (error) error.remove();
    });

    alert("¡Inscripción registrada correctamente!");
});

// ==========================================
// 7. EDITAR INSCRIPCIONES
// ==========================================

function editRegistration(id) {
    const registration = registrations.find(item => item.id === id);

    if (!registration) return;

    const newName = prompt("Nuevo nombre:", registration.nombre);

    if (newName === null) return;

    if (newName.trim().length < 3) {
        alert("El nombre debe tener al menos 3 caracteres.");
        return;
    }

    registration.nombre = newName.trim();

    saveRegistrations();
    renderRegistrations();

    alert("Inscripción actualizada correctamente.");
}

// ==========================================
// 8. ELIMINAR INSCRIPCIONES
// ==========================================

function deleteRegistration(id) {
    const confirmDelete = confirm(
        "¿Estás seguro de eliminar esta inscripción?"
    );

    if (!confirmDelete) return;

    registrations = registrations.filter(item => item.id !== id);

    saveRegistrations();
    renderRegistrations();
}

// ==========================================
// 9. CONSUMO DE API CON FETCH
// ==========================================

async function loadQuotes() {
    apiLoading.textContent = "Cargando frases motivacionales...";
    quotesContainer.replaceChildren();

    reloadQuotesButton.disabled = true;

    try {
        const response = await fetch(
            "https://dummyjson.com/quotes?limit=4"
        );

        // Comprobación de respuesta HTTP.
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.quotes || data.quotes.length === 0) {
            throw new Error("La API no devolvió frases.");
        }

        data.quotes.forEach(item => {
            const card = document.createElement("article");
            card.className = "quote-card";

            const quote = document.createElement("p");
            quote.textContent = `"${item.quote}"`;

            const author = document.createElement("h4");
            author.textContent = `— ${item.author}`;

            card.append(quote, author);
            quotesContainer.appendChild(card);
        });

        apiLoading.textContent = "Frases cargadas correctamente.";

    } catch (error) {
        console.error("Error al consultar la API:", error);

        apiLoading.textContent =
            "No fue posible cargar las frases. Verifica tu conexión e intenta nuevamente.";

    } finally {
        reloadQuotesButton.disabled = false;
    }
}

// ==========================================
// 10. EVENTO CLICK PARA RECARGAR LA API
// ==========================================

reloadQuotesButton.addEventListener("click", loadQuotes);

// ==========================================
// 11. INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================

renderRegistrations();
loadQuotes();
