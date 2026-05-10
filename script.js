const langSelect = document.getElementById('languageSwitcher');

const ELEVENLABS_API_KEY = "sk_4709a03d26437569ae97cd72db6cedad3599f26d7b738525";
const VOICE_ID = "hpp4J3VqNfWAUOO0d1Us";

const state = {
  currentAudio: null,
  highlightInterval: null,
  words: [],
  originalText: '',
  currentRate: 1,
  isPaused: false
};

const scrollContainer = document.getElementById("scrollContainer");
const scrollText = document.getElementById("scrollText");
const rateSlider = document.getElementById("rateSlider");
const rateValue = document.getElementById("rateValue");

function setLanguage(lang) {
  const t = translations[lang];

  const textarea = document.getElementById('textInput');
  const defaultTexts = [translations['en'].textarea, translations['fr'].textarea];
  if (defaultTexts.includes(textarea.value.trim())) {
    textarea.value = t.textarea;
  }

  document.getElementById('loadBtn').textContent = t.loadBtn;
  document.getElementById('playBtn').innerHTML = `<i class="fa-solid fa-play"></i> ${t.playBtn}`;
  document.getElementById('pauseBtn').innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
  document.getElementById('stopBtn').innerHTML = `<i class="fa-solid fa-stop"></i> ${t.stopBtn}`;
  document.getElementById('clearBtn').innerHTML = `<i class="fa-solid fa-broom"></i> ${t.clearBtn}`;
  setStatus(t.statusReady);
}

langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
setLanguage('en');

function togglePause() {
  const btn = document.getElementById('pauseBtn');
  const t = translations[langSelect.value];
  if (!state.currentAudio) return;

  if (state.isPaused) {
    state.currentAudio.play();
    state.isPaused = false;
    btn.innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
    setStatus(t.statusPlaying);
  } else {
    state.currentAudio.pause();
    state.isPaused = true;
    btn.innerHTML = `<i class="fa-solid fa-play"></i> ${t.resumeBtn}`;
    setStatus(t.statusPaused);
  }
}

function updateRate() {
  state.currentRate = parseFloat(rateSlider.value);
  rateValue.textContent = state.currentRate.toFixed(1);
  if (state.currentAudio) {
    state.currentAudio.playbackRate = state.currentRate;
  }
}

function prepareText() {
  stop();
  const input = document.getElementById("textInput").value.trim();
  if (!input) return;

  state.originalText = input;
  state.words = input.split(/\s+/);

  scrollText.innerHTML = "";
  state.words.forEach((word, index) => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.classList.add("word");
    span.setAttribute("data-index", index);
    scrollText.appendChild(span);
  });

  setStatus(translations[langSelect.value].statusReady);
}

async function speak() {
  if (state.words.length === 0) {
    prepareText();
    if (state.words.length === 0) return;
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
          text: state.originalText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);

    const audioBlob = await response.blob();
    state.currentAudio = new Audio(URL.createObjectURL(audioBlob));

    state.currentAudio.addEventListener('play', () => {
      startEstimatedHighlight(state.currentAudio.duration);
    });

    state.currentAudio.addEventListener('ended', () => {
      clearHighlight();
      clearInterval(state.highlightInterval);
      setStatus(translations[langSelect.value].statusFinished);
    });

    state.currentAudio.playbackRate = state.currentRate;
    state.currentAudio.play();
    setStatus(translations[langSelect.value].statusPlaying);

  } catch (err) {
    console.error(err);
    setStatus("❌ Erreur ElevenLabs");
  }
}

function startEstimatedHighlight(totalDuration) {
  clearHighlight();
  clearInterval(state.highlightInterval);

  let wordIndex = 0;
  const totalWords = state.words.length;
  const timePerWord = (totalDuration * 1000) / totalWords / state.currentRate;

  state.highlightInterval = setInterval(() => {
    if (wordIndex >= totalWords) {
      clearInterval(state.highlightInterval);
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
  }, timePerWord);
}

function clearHighlight() {
  document.querySelectorAll(".word").forEach(span => span.classList.remove("active"));
}

function stop() {
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.src = "";
    state.currentAudio = null;
  }
  clearInterval(state.highlightInterval);
  state.isPaused = false;
  const t = translations[langSelect.value];
  document.getElementById('pauseBtn').innerHTML = `<i class="fa-solid fa-pause"></i> ${t.pauseBtn}`;
  clearHighlight();
  setStatus(t.statusStopped);
}

function clearText() {
  stop();
  document.getElementById("textInput").value = "";
  scrollText.innerHTML = "";
  state.words = [];
  setStatus(translations[langSelect.value].statusCleared);
}

function setStatus(text) {
  document.getElementById("status").innerHTML = text + ' <i class="fa-solid fa-headphones"></i>';
}

updateRate();