const synth = window.speechSynthesis;
let utterance;
let words = [];
let originalText = '';
let currentRate = 1;
let voices = [];

const scrollContainer = document.getElementById("scrollContainer");
const scrollText = document.getElementById("scrollText");
const rateSlider = document.getElementById("rateSlider");
const rateValue = document.getElementById("rateValue");

// Chargement des voix
window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
};

// Si la synthèse vocale n’est pas disponible
if (!('speechSynthesis' in window)) {
  alert("⚠️ Votre navigateur ne supporte pas la lecture vocale.\nEssayez avec Chrome, Brave ou Firefox.");
}

function updateRate() {
  currentRate = parseFloat(rateSlider.value);
  rateValue.textContent = currentRate.toFixed(1);
}

function prepareText() {
  stop();
  const input = document.getElementById("textInput").value.trim();
  if (!input) return;

  originalText = input;
  const wordArray = input.split(/\s+/);
  words = wordArray;

  scrollText.innerHTML = "";
  wordArray.forEach((word, index) => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.classList.add("word");
    span.setAttribute("data-index", index);
    scrollText.appendChild(span);
  });

  setStatus("Texte chargé.");
}

function speak() {
  if (!navigator.onLine) {
    alert("📡 La lecture vocale nécessite une connexion pour charger les voix. Connecte-toi à Internet.");
    return;
  }

  if (voices.length === 0) {
    alert("🔊 Les voix ne sont pas encore disponibles. Patiente quelques secondes ou recharge la page.");
    return;
  }

  if (!synth || !('SpeechSynthesisUtterance' in window)) {
    alert("Ce navigateur ne supporte pas la lecture vocale.");
    return;
  }

  if (words.length === 0) {
    prepareText();
    if (words.length === 0) return;
  }

  stop();

  utterance = new SpeechSynthesisUtterance(originalText);
  utterance.lang = "en-US";
  utterance.rate = currentRate;

  // Forcer une voix Google (si dispo)
  const googleVoice = voices.find(v => v.name.includes("Google"));
  if (googleVoice) {
    utterance.voice = googleVoice;
  }

  // Suivi du mot
  utterance.onboundary = function (event) {
    if (event.name === "word") {
      highlightWord(event.charIndex);
    }
  };

  utterance.onstart = () => {
    setStatus("Lecture en cours...");
  };

  utterance.onend = () => {
    setStatus("Lecture terminée.");
    clearHighlight();
  };

  synth.speak(utterance);
}

function highlightWord(charIndex) {
  clearHighlight();
  let currentText = originalText.slice(0, charIndex);
  let wordIndex = currentText.trim().split(/\s+/).length - 1;

  const span = document.querySelector(`[data-index="${wordIndex}"]`);
  if (span) {
    span.classList.add("active");

    // Scroll auto pour que le mot soit visible
    const offset = span.offsetLeft - scrollContainer.offsetLeft;
    scrollText.style.transform = `translateX(-${offset}px)`;
  }
}

function clearHighlight() {
  document.querySelectorAll(".word").forEach(span => {
    span.classList.remove("active");
  });
}

function stop() {
  synth.cancel();
  clearHighlight();
  setStatus("Lecture stoppée.");
}

function clearText() {
  stop();
  document.getElementById("textInput").value = "";
  scrollText.innerHTML = "";
  words = [];
  setStatus("Texte effacé.");
}

function setStatus(text) {
  document.getElementById("status").innerHTML = text + ' <i class="fa-solid fa-headphones"></i>';
}

updateRate();
