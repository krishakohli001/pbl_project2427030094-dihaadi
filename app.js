window.openModal = function(id) {
  const el = document.getElementById("modal-" + id);
  if (el) { el.classList.add("open"); document.body.style.overflow = "hidden"; }
};
window.closeModal = function(id) {
  const el = document.getElementById("modal-" + id);
  if (el) { el.classList.remove("open"); document.body.style.overflow = ""; }
};

document.addEventListener("click", function(e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
    document.body.style.overflow = "";
  }
});

window.startVoice = function() {
  const btn   = document.getElementById("voiceBtn");
  const input = document.getElementById("searchInput");

  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Voice search is not supported in this browser. Try Chrome.");
    return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  btn.classList.add("listening");
  btn.textContent = "🔴";

  recognition.onresult = function(e) {
    input.value = e.results[0][0].transcript;
    btn.classList.remove("listening");
    btn.textContent = "🎤";
    doSearch();
  };

  recognition.onerror = function() {
    btn.classList.remove("listening");
    btn.textContent = "🎤";
  };

  recognition.onend = function() {
    btn.classList.remove("listening");
    btn.textContent = "🎤";
  };

  recognition.start();
};

window.doSearch = function() {
  const val = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".job-card");
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!val || text.includes(val)) ? "block" : "none";
  });
};

document.querySelectorAll(".cat-chip").forEach(chip => {
  chip.addEventListener("click", function() {
    document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
    this.classList.add("active");
    const cat = this.dataset.cat;
    const cards = document.querySelectorAll(".job-card");
    cards.forEach(card => {
      if (cat === "all") { card.style.display = "block"; return; }
      const badge = card.querySelector(".job-cat-badge");
      card.style.display = (badge && badge.classList.contains(cat)) ? "block" : "none";
    });
  });
});

let isHindi = false;
const translations = {
  ".hero-title": { hi: "काम मिलेगा।<br/><em>रोजगार पक्का।</em>", en: "Kaam Milega.<br/><em>Rozgaar Pakka.</em>" },
  ".hero-sub":   { hi: "दैनिक काम खोजें, समय पर भुगतान पाएं, अपनी प्रतिष्ठा बनाएं।", en: "Find daily work, get paid on time, build your reputation — all in one app." }
};
window.toggleLang = function() {
  isHindi = !isHindi;
  const lang = isHindi ? "hi" : "en";
  Object.entries(translations).forEach(([sel, vals]) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = vals[lang];
  });
  document.querySelector(".lang-btn").textContent = isHindi ? "🌐 EN / HI" : "🌐 HI / EN";
};

window.triggerSOS = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      alert("🚨 SOS Sent!\nLocation: " + lat + ", " + lon + "\nEmergency contacts notified.\nNearest workers alerted.");
    }, function() {
      alert("🚨 SOS Sent!\nLocation unavailable — contacts notified with last known location.");
    });
  } else {
    alert("🚨 SOS Sent! Emergency contacts have been notified.");
  }
};

const insToggle = document.getElementById("insToggle");
if (insToggle) {
  insToggle.addEventListener("change", function() {
    const label = this.parentElement;
    if (this.checked) {
      label.innerHTML = '<input type="checkbox" checked id="insToggle"/> <span style="color:var(--green)">🛡️ Daily Insurance Active (+₹5)</span>';
      document.getElementById("insToggle").addEventListener("change", arguments.callee);
    }
  });
}

console.log("⚒️ Dihaadi loaded — Daily Work, Dignified.");
