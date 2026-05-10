const langSelect = document.getElementById('languageSwitcher');

const ELEVENLABS_API_KEY = "sk_4709a03d26437569ae97cd72db6cedad3599f26d7b738525";
const VOICE_ID = "hpp4J3VqNfWAUOO0d1Us";

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

let currentAudio = null;
let highlightInterval = null;
let words = [];
let originalText = '';
let currentRate = 1;
let voices = [];
let isPaused = false;

const scrollContainer = document.getElementById("scrollContainer");
const scrollText = document.getElementById("scrollText");
const rateSlider = document.getElementById("rateSlider");
const rateValue = document.getElementById("rateValue");

if (!('speechSynthesis' in window)) {
  alert("⚠️ Votre navigateur ne supporte pas la lecture vocale.\nEssayez avec Chrome, Brave ou Firefox.");
}

function togglePause() {
  const btn = document.getElementById('pauseBtn');
  const t = translations[langSelect.value];

  if (!currentAudio) return;

  if (isPaused) {
    currentAudio.play();
    isPaused = false;
    btn.innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
    setStatus(t.statusPlaying);
  } else {
    currentAudio.pause();
    isPaused = true;
    btn.innerHTML = `<i class="fa-solid fa-play"></i> ${t.resumeBtn}`;
    setStatus(t.statusPaused);
  }
}

function updateRate() {
  currentRate = parseFloat(rateSlider.value);
  rateValue.textContent = currentRate.toFixed(1);
  if (currentAudio) {
    currentAudio.playbackRate = currentRate;
  }
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

async function speak() {
  if (words.length === 0) {
    prepareText();
    if (words.length === 0) return;
  }

  stop();
  setStatus(translations[langSelect.value].statusLoading);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: originalText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(audioUrl);

    currentAudio.addEventListener('play', () => {
      startEstimatedHighlight(currentAudio.duration);
    });

    currentAudio.addEventListener('ended', () => {
      clearHighlight();
      clearInterval(highlightInterval);
      setStatus(translations[langSelect.value].statusFinished);
    });

    currentAudio.playbackRate = currentRate;
    currentAudio.play();
    setStatus(translations[langSelect.value].statusPlaying);

  } catch (err) {
    console.error(err);
    setStatus("❌ Erreur ElevenLabs");
  }
}

function startEstimatedHighlight(totalDuration) {
  clearHighlight();
  clearInterval(highlightInterval);

  let wordIndex = 0;
  const totalWords = words.length;
  const timePerWord = (totalDuration * 1000) / totalWords / currentRate;

  highlightInterval = setInterval(() => {
    if (wordIndex >= totalWords) {
      clearInterval(highlightInterval);
      return;
    }
    clearHighlight();
    const span = document.querySelector(`[data-index="${wordIndex}"]`);
    if (span) {
      span.classList.add("active");
      const containerWidth = scrollContainer.offsetWidth;
      const spanOffset = span.offsetLeft + span.offsetWidth / 2;
      scrollText.style.transform = `translateX(${-Math.max(0, spanOffset - containerWidth / 2)}px)`;
    }
    wordIndex++;
  }, timePerWord );
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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  clearInterval(highlightInterval);
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