const listPokemons = document.querySelector("#list-pokemons");
const searchPokemon = document.querySelector("#search-pokemon");
const loadMore = document.querySelector("#load-more");
const categoryPokemon = document.querySelector("#category-pokemon");
const selectedTypesContainer = document.querySelector("#selected-types");
const btnAll = document.querySelector("#btn-all");
const modalOverlay = document.querySelector(".modal-overlay");
const modal = document.querySelector(".modal");
const modalContent = document.querySelector(".modal-content");
const closeBtn = document.querySelector(".close-btn");
const navToggle = document.querySelector("#nav-toggle");
const navMenu = document.querySelector("#nav-menu");

let pokemons = [];
let allPokemons = [];
let quantity = 20;
let selectedType = null;

// all button
btnAll.classList.add("active");
btnAll.onclick = () => resetFilters();

// fetch all pokemons
fetch("https://pokeapi.co/api/v2/pokemon?limit=2000")
    .then(res => res.json())
    .then(data => {
        allPokemons = data.results;
        pokemons = allPokemons;
        renderPokemons(pokemons.slice(0, quantity));
    });

// fetch types
fetch("https://pokeapi.co/api/v2/type")
    .then(res => res.json())
    .then(data => {
        data.results.slice(0, -2).forEach(type => {
            const btn = document.createElement("button");
            btn.textContent = type.name;
            btn.dataset.type = type.name;
            btn.onclick = () => setType(type.name);
            categoryPokemon.appendChild(btn);
        });
    });

// reset filters
function resetFilters() {
    selectedType = null;
    pokemons = allPokemons;
    quantity = 20;
    updateButtons();
    updateChip();
    renderPokemons(pokemons.slice(0, quantity));

    if (navMenu) navMenu.classList.remove("active");
}

// set type
async function setType(type) {

    // if you click the same type → remove filter
    if (selectedType === type) {
        selectedType = null;
        pokemons = allPokemons;
    } else {
        // if you click another type → change filter
        selectedType = type;
        const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const data = await res.json();
        pokemons = data.pokemon.map(item => item.pokemon);
    }

    quantity = 20;
    updateButtons();
    updateChip();
    renderPokemons(pokemons.slice(0, quantity));

    if (navMenu) navMenu.classList.remove("active");
}

// buttons ui
function updateButtons() {
    const buttons = categoryPokemon.querySelectorAll("button");

    buttons.forEach(btn => {
        btn.classList.remove("active");

        if (btn.dataset.type === selectedType) {
            btn.classList.add("active");
        }
    });

    btnAll.classList.toggle("active", !selectedType);
}

// chip ui
function updateChip() {
    selectedTypesContainer.innerHTML = "";

    if (!selectedType) return;

    const chip = document.createElement("div");
    chip.className = "type-chip";
    chip.textContent = selectedType;

    const removeBtn = document.createElement("span");
    removeBtn.innerHTML = " ×";
    removeBtn.onclick = () => setType(selectedType);

    chip.appendChild(removeBtn);
    selectedTypesContainer.appendChild(chip);
}

// render pokemons
function renderPokemons(list) {
    let html = "";

    list.forEach(pokemon => {
        const id = pokemon.url.split("/")[6];
        const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

        html += `
            <li class="pokemon-card" data-id="${id}">
                <img src="${img}">
                <p>#${id}</p>
                <h3>${pokemon.name}</h3>
            </li>
        `;
    });
    listPokemons.innerHTML = html;
    checkLoadMoreButton();
}

function checkLoadMoreButton() {
    if (quantity >= pokemons.length) {
        loadMore.disabled = true;
        loadMore.textContent = "No hay más Pokémon";
    } else {
        loadMore.disabled = false;
        loadMore.textContent = "Cargar más";
    }
}


// search
searchPokemon.addEventListener("input", () => {
    const text = searchPokemon.value.toLowerCase();

    if (text === "") {
        loadMore.style.display = "block";
        renderPokemons(pokemons.slice(0, quantity));
        return;
    }

    loadMore.style.display = "none";

    const filtered = pokemons.filter(p =>
        p.name.includes(text)
    );

    renderPokemons(filtered.slice(0, quantity));
});

// load more
loadMore.addEventListener("click", () => {
    quantity += 20;
    renderPokemons(pokemons.slice(0, quantity));
});



// abrir modal
listPokemons.addEventListener("click", function (e) {
    const card = e.target.closest(".pokemon-card");
    if (!card) return;

    const id = card.dataset.id;
    openModal(id);

    // 1️⃣ Datos del pokemon
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        .then(res => res.json())
        .then(pokemon => {

            // datos seguros
            const name = pokemon.name || "Información no encontrada";
            const image = pokemon.sprites.front_default || "";
            const weight = pokemon.weight ? pokemon.weight / 10 + " kg" : "Información no encontrada";
            const height = pokemon.height ? pokemon.height / 10 + " m" : "Información no encontrada";

            const types = pokemon.types?.map(t => t.type.name).join(", ") || "Información no encontrada";

            const stats = pokemon.stats?.map(stat => `
                <li>${stat.stat.name}: ${stat.base_stat}</li>
            `).join("") || "<li>Información no encontrada</li>";

            // 2️⃣ Datos de la especie (descripción)
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
                .then(res => res.json())
                .then(species => {

                    const description = species.flavor_text_entries
                        ?.find(entry => entry.language.name === "es")
                        ?.flavor_text.replace(/\f/g, " ")
                        || "Información no encontrada";

                    modalContent.innerHTML = `
                        <h2>${name}</h2>
                        ${image ? `<img src="${image}">` : ""}
                        
                        <p class="description">${description}</p>

                        <div class="pokemon-stats-container">
                            <div class="pokemon-info">
                                <p><strong>Altura:</strong> ${height}</p>
                                <p><strong>Peso:</strong> ${weight}</p>
                                <p><strong>Tipos:</strong> ${types}</p>
                            </div>

                            <div class="stats-list">
                                <h3>Stats</h3>
                                <ul>
                                    ${stats}
                                </ul>
                            </div>
                        </div>
                    `;
                })
                .catch(() => {
                    modalContent.innerHTML = `
                        <h2>${name}</h2>
                        <p>Información no encontrada</p>
                    `;
                });
        })
        .catch(() => {
            modalContent.innerHTML = `<p>Información no encontrada</p>`;
        });
});



modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// cerrar modal
closeBtn.addEventListener("click", closeModal);


function openModal(id) {
    modalOverlay.classList.remove("hidden");
}

function closeModal() {
    modalOverlay.classList.add("hidden");
}

// Navbar toggle
navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target) && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
    }
});
