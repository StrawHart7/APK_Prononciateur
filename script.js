const langSelect = document.getElementById('languageSwitcher');

function setLanguage(lang) {
  const t = translations[lang];

  const textarea = document.getElementById('textInput');
  const defaultTexts = [translations['en'].textarea, translations['fr'].textarea];
  if (defaultTexts.includes(textarea.value.trim())) {
    textarea.value = t.textarea;
  }

  document.querySelector('.buttons button:nth-child(1)').textContent = t.loadBtn;
  document.querySelector('.buttons button:nth-child(2)').innerHTML = `<i class="fa-solid fa-play"></i> ${t.playBtn}`;
  document.querySelector('.buttons button:nth-child(3)').innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
  document.querySelector('.buttons button:nth-child(4)').innerHTML = `<i class="fa-solid fa-stop"></i> ${t.stopBtn}`;
  document.querySelector('.buttons button:nth-child(5)').innerHTML = `<i class="fa-solid fa-broom"></i> ${t.clearBtn}`;
  setStatus(t.statusReady);
}

langSelect.addEventListener('change', (e) => {
  setLanguage(e.target.value);
});

setLanguage('en');

const synth = window.speechSynthesis;
let utterance;
let words = [];
let originalText = '';
let currentRate = 1;
let voices = [];
let isPaused = false;
let currentCharIndex = 0;

const scrollContainer = document.getElementById("scrollContainer");
const scrollText = document.getElementById("scrollText");
const rateSlider = document.getElementById("rateSlider");
const rateValue = document.getElementById("rateValue");

window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
  const el = document.getElementById('voiceStatus');
  if (voices.length > 0) {
    el.textContent = `✅ ${voices.length} voix disponibles`;
    setTimeout(() => el.textContent = '', 3000);
  }
};

if (!('speechSynthesis' in window)) {
  alert("⚠️ Votre navigateur ne supporte pas la lecture vocale.\nEssayez avec Chrome, Brave ou Firefox.");
}

function togglePause() {
  const btn = document.getElementById('pauseBtn');
  const t = translations[langSelect.value];

  if (isPaused) {
    synth.resume();
    isPaused = false;
    btn.innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
    setStatus(t.statusPlaying);
  } else {
    synth.pause();
    isPaused = true;
    btn.innerHTML = `<i class="fa-solid fa-play"></i> ${t.resumeBtn}`;
    setStatus(t.statusPaused);
  }
}

function updateRate() {
  currentRate = parseFloat(rateSlider.value);
  rateValue.textContent = currentRate.toFixed(1);

  if (synth.speaking && !isPaused) {
    const charIndex = currentCharIndex;
    synth.cancel();
    restartFrom(charIndex);
  }
}

function restartFrom(charIndex) {
  const remainingText = originalText.slice(charIndex);
  utterance = new SpeechSynthesisUtterance(remainingText);
  utterance.lang = langSelect.value === 'fr' ? 'fr-FR' : 'en-US';
  utterance.rate = currentRate;

  const googleVoice = voices.find(v => v.name.includes('Google'));
  if (googleVoice) utterance.voice = googleVoice;

  utterance.onboundary = function(event) {
    if (event.name === 'word') {
      currentCharIndex = charIndex + event.charIndex;
      highlightWord(currentCharIndex);
    }
  };

  utterance.onend = () => setStatus(translations[langSelect.value].statusFinished);
  synth.speak(utterance);
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

  setStatus(translations[langSelect.value].statusReady);
}

function speak() {
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
  utterance.lang = langSelect.value === "fr" ? "fr-FR" : "en-US";
  utterance.rate = currentRate;

  const googleVoice = voices.find(v => v.name.includes("Google"));
  if (googleVoice) utterance.voice = googleVoice;

  utterance.onboundary = function(event) {
    if (event.name === 'word') {
      currentCharIndex = event.charIndex;
      highlightWord(event.charIndex);
    }
  };

  utterance.onstart = () => setStatus(translations[langSelect.value].statusPlaying);
  utterance.onend = () => setStatus(translations[langSelect.value].statusFinished);

  synth.speak(utterance);
}

function highlightWord(charIndex) {
  clearHighlight();
  if (!originalText) return;

  let total = 0;
  let wordIndex = 0;

  for (let i = 0; i < words.length; i++) {
    total += words[i].length + 1;
    if (charIndex < total) {
      wordIndex = i;
      break;
    }
  }

  const span = document.querySelector(`[data-index="${wordIndex}"]`);
  if (!span) return;

  span.classList.add("active");

  const containerWidth = scrollContainer.offsetWidth;
  const spanOffset = span.offsetLeft + span.offsetWidth / 2;
  const scrollPos = spanOffset - containerWidth / 2;
  scrollText.style.transform = `translateX(${-Math.max(0, scrollPos)}px)`;
}

function clearHighlight() {
  document.querySelectorAll(".word").forEach(span => span.classList.remove("active"));
}

function stop() {
  synth.cancel();
  isPaused = false;
  const btn = document.getElementById('pauseBtn');
  const t = translations[langSelect.value];
  btn.innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
  clearHighlight();
  setStatus(t.statusStopped);
}

function clearText() {
  stop();
  document.getElementById("textInput").value = "";
  scrollText.innerHTML = "";
  words = [];
  setStatus(translations[langSelect.value].statusCleared);
}

function setStatus(text) {
  document.getElementById("status").innerHTML = text + ' <i class="fa-solid fa-headphones"></i>';
}

updateRate();