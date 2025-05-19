function invertColor(hex) {
    if (hex.indexOf('#') === 0) hex = hex.slice(1);
    if (hex.length === 3) {
        hex = hex.split('').map(x => x + x).join('');
    }
    const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16).padStart(2, '0');
    const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16).padStart(2, '0');
    const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

let traversalHistory = '';
let stepCount = 0;
const modes = ['morse', 'english', 'german', 'french', 'spanish'];
let modeIndex = 0;

const container = document.getElementById('zoom-container');
const popup = document.getElementById('help-popup-shared');
const warpDisplay = document.getElementById('warp-tracker');
const objectDisplay = document.getElementById('current-object-display');
const traversalDisplay = document.getElementById('traversal-history-display');
traversalDisplay.style.display = 'none';

const objectTranslations = {
    english: ["Quark", "Electron", "Proton", "Neutron", "Atom", "Molecule", "Macromolecule", "Organelle", "Cell", "Tissue", "Organ", "Organ System", "Human", "Group", "Dwelling", "Neighborhood", "City", "Region", "Nation State", "Continent", "Planet", "Moon", "Solar System", "Star Cluster", "Galaxy", "Galactic Cluster", "Supercluster", "Cosmic Web", "Observable Universe", "Entire Universe", "Adjacent Universe", "Mathematical Substrate"],
    german: ["Quark", "Elektron", "Proton", "Neutron", "Atom", "Molekül", "Makromolekül", "Organell", "Zelle", "Gewebe", "Organ", "Organsystem", "Mensch", "Gruppe", "Behausung", "Nachbarschaft", "Stadt", "Region", "Nationalstaat", "Kontinent", "Planet", "Mond", "Sonnensystem", "Sternhaufen", "Galaxie", "Galaxienhaufen", "Superhaufen", "Kosmisches Netz", "Beobachtbares Universum", "Gesamtes Universum", "Angrenzendes Universum", "Mathematisches Substrat"],
    french: ["Quark", "Électron", "Proton", "Neutron", "Atome", "Molécule", "Macromolécule", "Organite", "Cellule", "Tissu", "Organe", "Système d'organes", "Humain", "Groupe", "Habitation", "Quartier", "Ville", "Région", "État-nation", "Continent", "Planète", "Lune", "Système solaire", "Amas d'étoiles", "Galaxie", "Amas galactique", "Superamas", "Toile cosmique", "Univers observable", "Univers entier", "Univers adjacent", "Substrat mathématique"],
    spanish: ["Quark", "Electrón", "Protón", "Neutrón", "Átomo", "Molécula", "Macromolécula", "Orgánulo", "Célula", "Tejido", "Órgano", "Sistema de órganos", "Humano", "Grupo", "Vivienda", "Vecindario", "Ciudad", "Región", "Estado nación", "Continente", "Planeta", "Luna", "Sistema solar", "Cúmulo estelar", "Galaxia", "Cúmulo galáctico", "Supercúmulo", "Red cósmica", "Universo observable", "Universo completo", "Universo adyacente", "Sustrato matemático"]
};

const labelTranslations = {
    english: { about: "About", navigate: "Navigate" },
    german: { about: "Über", navigate: "Navigieren" },
    french: { about: "À propos", navigate: "Naviguer" },
    spanish: { about: "Acerca de", navigate: "Navegar" }
};

const morseMap = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
    G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
    M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
    S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
    ' ': ' / '
};

const colorThemes = [
    { background: "#daffaa", text: "#ee3636" },
    { background: "#fff3b0", text: "#9a17a9" },
    { background: "#ffdede", text: "#0ad15c" },
    { background: "#ccfbff", text: "#ff6e16" },
    { background: "#e9f5db", text: "#f1458b" }
];

let currentTheme = colorThemes[0];
let themeCycleCount = 0;
let layersVisitedSinceLastCycle = new Set();
let layerIndex = objectTranslations.english.indexOf("Human");
const totalLayers = objectTranslations.english.length;
let currentLayer = null;

function toMorse(text) {
    return text.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
}

function getTranslatedObject(index) {
    const mode = modes[modeIndex];
    const text = objectTranslations['english'][index];
    if (mode === 'morse') return toMorse(text);
    return objectTranslations[mode][index];
}

function updateCurrentObjectDisplay() {
    const modeDisplayNames = {
        morse: 'Morse Code',
        english: 'English',
        german: 'Deutsch',
        french: 'Français',
        spanish: 'Español'
    };
    const languageLabel = modeDisplayNames[modes[modeIndex]] || modes[modeIndex];
    objectDisplay.textContent = `[${languageLabel}] ${getTranslatedObject(layerIndex)}`;
}

function updateHelpButtons() {
    const aboutBtn = document.querySelector('.help-button:nth-child(1)');
    const navigateBtn = document.querySelector('.help-button:nth-child(2)');
    const mode = modes[modeIndex];
    if (mode === 'morse') {
        aboutBtn.innerHTML = toMorse(labelTranslations.english.about);
        navigateBtn.innerHTML = toMorse(labelTranslations.english.navigate);
    } else {
        const labels = labelTranslations[mode] || labelTranslations.english;
        aboutBtn.innerHTML = labels.about;
        navigateBtn.innerHTML = labels.navigate;
    }
}

function showPopup(html) {
    popup.dataset.originalText = html;
    popup.innerHTML = html;
    popup.className = 'help-popup-base';
    popup.style.display = 'block';
}

function hidePopup() {
    popup.style.display = 'none';
    popup.dataset.originalText = '';
}

function createLayer(index) {
    const div = document.createElement('div');
    div.className = 'layer';
    div.textContent = getTranslatedObject(index);
    div.style.color = currentTheme.text;
    return div;
}

function updateWarpCount(delta) {
    stepCount++;
    traversalHistory += delta > 0 ? '@~' : '_-';
    warpDisplay.textContent = `Traverses: ${stepCount}`;
    traversalDisplay.textContent = traversalHistory;
    traversalDisplay.scrollTop = traversalDisplay.scrollHeight;
}

function applyTheme(index) {
    currentTheme = colorThemes[index % colorThemes.length];
    document.body.style.backgroundColor = currentTheme.background;

    container.querySelectorAll('.layer').forEach(el => {
        el.style.color = currentTheme.text;
    });

    objectDisplay.style.color = currentTheme.text;
    warpDisplay.style.color = currentTheme.text;

    traversalDisplay.style.color = invertColor(currentTheme.text);

    document.querySelectorAll('.help-button').forEach(btn => {
        btn.style.backgroundColor = currentTheme.text;
        btn.style.color = currentTheme.background;
        btn.style.borderColor = 'transparent';

        // Remove old listeners to avoid stacking
        btn.removeEventListener('mouseover', btn._hoverIn);
        btn.removeEventListener('mouseout', btn._hoverOut);

        // Create new hover handlers
        btn._hoverIn = () => {
        btn.style.backgroundColor = invertColor(currentTheme.text);
        };
        btn._hoverOut = () => {
        btn.style.backgroundColor = currentTheme.text;
        };

        btn.addEventListener('mouseover', btn._hoverIn);
        btn.addEventListener('mouseout', btn._hoverOut);
    });

    popup.style.backgroundColor = currentTheme.text;
    popup.style.color = currentTheme.background;
}

function updateLayer(delta) {
    updateWarpCount(delta);
    layerIndex = (layerIndex + delta + totalLayers) % totalLayers;
    const scale = Math.pow(0.8, Math.floor(totalLayers / 2) - layerIndex);
    container.style.transform = `scale(${scale})`;
    const newLayer = createLayer(layerIndex);
    container.appendChild(newLayer);
    requestAnimationFrame(() => newLayer.classList.add('visible'));
    if (currentLayer) currentLayer.classList.remove('visible');
    setTimeout(() => {
        container.querySelectorAll('.layer').forEach(el => {
        if (!el.classList.contains('visible')) el.remove();
        });
    }, 400);
    currentLayer = newLayer;

    layersVisitedSinceLastCycle.add(layerIndex);
    if (layersVisitedSinceLastCycle.size === totalLayers) {
        themeCycleCount++;
        applyTheme(themeCycleCount);
        layersVisitedSinceLastCycle.clear();
    }

    updateCurrentObjectDisplay();
}

// Initial setup
currentLayer = createLayer(layerIndex);
container.appendChild(currentLayer);
requestAnimationFrame(() => currentLayer.classList.add('visible'));
updateCurrentObjectDisplay();
updateHelpButtons();
applyTheme(0); // apply first theme on load

document.querySelector('.help-button:nth-child(1)').innerHTML = labelTranslations.english.about;
document.querySelector('.help-button:nth-child(2)').innerHTML = labelTranslations.english.navigate;

window.addEventListener('click', e => {
    if (e.button !== 0) return;
    traversalHistory += '&.&';
    traversalDisplay.textContent = traversalHistory;
    traversalDisplay.scrollTop = traversalDisplay.scrollHeight;
    modeIndex = (modeIndex + 1) % modes.length;
    updateCurrentObjectDisplay();
    if (currentLayer) currentLayer.textContent = getTranslatedObject(layerIndex);
    updateHelpButtons();
    if (popup.dataset.originalText && popup.style.display === 'block') {
        showPopup(popup.dataset.originalText);
    }
});

window.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    updateLayer(delta);
    }, { passive: false });

    window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') updateLayer(1);
    if (e.key === 'ArrowDown') updateLayer(-1);
    if (e.code === 'Space') {
        e.preventDefault();
        traversalDisplay.style.display = traversalDisplay.style.display === 'none' ? 'block' : 'none';
    }
});