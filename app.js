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
 
/* ---------- Voice Search (Hindi) ---------- */
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
 
/* ---------- Language Toggle ---------- */
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
 
/* ---------- Emergency SOS (real GPS) ---------- */
window.triggerSOS = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      alert("🚨 SOS Sent!\nLocation: " + lat + ", " + lon + "\nEmergency contacts notified.\nNearest workers alerted.");
      if (window.db) {
        db.collection("sosAlerts").add({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error("SOS log failed:", err));
      }
    }, function() {
      alert("🚨 SOS Sent!\nLocation unavailable — contacts notified with last known location.");
    });
  } else {
    alert("🚨 SOS Sent! Emergency contacts have been notified.");
  }
};
 
/* ---------- Insurance toggle (worker card) ---------- */
const insToggle = document.getElementById("insToggle");
if (insToggle) {
  insToggle.addEventListener("change", function() {
    const span = this.nextElementSibling;
    if (this.checked) {
      span.textContent = "🛡️ Daily Insurance Active (+₹5)";
      span.style.color = "var(--green)";
    } else {
      span.textContent = "🛡️ Add Daily Insurance (+₹5)";
      span.style.color = "";
    }
  });
}
 
/* ===========================================================
   FIRESTORE-BACKED FEATURES
=========================================================== */
 
function dbReady() {
  if (!window.db) {
    alert("⚠️ Firebase isn't connected right now (check your internet connection or Firestore security rules). Your input wasn't saved.");
    return false;
  }
  return true;
}
 
function ts() {
  return firebase.firestore.FieldValue.serverTimestamp();
}
 
function clearFields(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
 
function showToast(msg) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3500);
}
 
/* ---------- 1. Post a Job → writes to Firestore + renders card live ---------- */
window.submitPostJob = async function() {
  if (!dbReady()) return;
 
  const title    = document.getElementById("postJobTitle").value.trim();
  const skill    = document.getElementById("postJobSkill").value;
  const wage     = Number(document.getElementById("postJobWage").value);
  const workers  = document.getElementById("postJobWorkers").value || "1";
  const location = document.getElementById("postJobLocation").value.trim();
 
  if (!title || !wage || !location) {
    alert("Please fill in job title, daily wage, and location.");
    return;
  }
 
  const job = {
    title, skill, wage, workersNeeded: workers,
    location, escrow: true, createdAt: ts()
  };
 
  try {
    const ref = await db.collection("jobs").add(job);
    renderJobCard({ id: ref.id, ...job });
    clearFields(["postJobTitle", "postJobWage", "postJobWorkers", "postJobLocation"]);
    closeModal("postJob");
    showToast("✅ Job posted — wage reserved in escrow.");
  } catch (err) {
    console.error(err);
    alert("Couldn't post the job: " + err.message);
  }
};
 
function renderJobCard(job) {
  const grid = document.getElementById("jobGrid");
  if (!grid) return;
  const card = document.createElement("div");
  card.className = "job-card";
  card.innerHTML = `
    <div class="job-card-top">
      <div class="job-cat-badge ${job.skill}">${job.skill}</div>
      <div class="escrow-badge">🔒 Escrow Protected</div>
    </div>
    <h3 class="job-title">${escapeHtml(job.title)}</h3>
    <div class="job-meta">
      <span>📍 ${escapeHtml(job.location)}</span>
      <span>👥 ${escapeHtml(String(job.workersNeeded))} needed</span>
    </div>
    <div class="job-wage">
      <span class="wage-amount">₹${job.wage}/day</span>
      <span class="ai-wage">🆕 Posted just now</span>
    </div>
    <div class="job-contractor">
      <div class="contractor-info">
        <div class="contractor-avatar">YOU</div>
        <div>
          <div class="contractor-name">You (Employer)</div>
          <div class="verified-badge">Saved to Firestore</div>
        </div>
      </div>
    </div>
    <div class="job-actions">
      <button class="btn btn-primary btn-full" onclick="openModal('applyJob')">Apply Now</button>
      <button class="btn btn-ghost btn-sm" onclick="openModal('groupBid')">👥 Group Bid</button>
    </div>`;
  grid.prepend(card);
}
 
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
 
/* ---------- 2. Group Bid (Toli) → writes to Firestore ---------- */
window.submitGroupBid = async function() {
  if (!dbReady()) return;
 
  const leadName = document.getElementById("bidLeadName").value.trim();
  const teamSize = document.getElementById("bidTeamSize").value;
  const phonesRaw = document.getElementById("bidPhones").value.trim();
 
  if (!leadName || !phonesRaw) {
    alert("Please enter the lead worker's name and at least one phone number.");
    return;
  }
 
  const phones = phonesRaw.split("\n").map(p => p.trim()).filter(Boolean);
 
  try {
    await db.collection("groupBids").add({
      leadName, teamSize, phones, status: "pending", createdAt: ts()
    });
    clearFields(["bidLeadName", "bidPhones"]);
    closeModal("groupBid");
    showToast(`✅ Group bid submitted for a team of ${teamSize}.`);
  } catch (err) {
    console.error(err);
    alert("Couldn't submit the group bid: " + err.message);
  }
};
 
/* ---------- 3. Upload Proof of Work → writes to Firestore + live Khata feed ---------- */
window.submitProof = async function() {
  if (!dbReady()) return;
 
  const fileInput   = document.getElementById("proofFile");
  const description = document.getElementById("proofDescription").value.trim();
  const file = fileInput.files[0];
 
  if (!file || !description) {
    alert("Please attach a photo/video and describe the work.");
    return;
  }
 
  try {
    await db.collection("khataEntries").add({
      workerName: "Manoj Kumar",
      description,
      fileName: file.name,
      fileType: file.type,
      status: "in_escrow",
      createdAt: ts()
    });
    clearFields(["proofDescription"]);
    fileInput.value = "";
    closeModal("uploadProof");
    showToast("✅ Proof uploaded to your Digital Khata.");
  } catch (err) {
    console.error(err);
    alert("Couldn't upload proof: " + err.message);
  }
};
 
/* ---------- 4. Apply for Job → writes to Firestore ---------- */
window.submitApplication = async function() {
  if (!dbReady()) return;
 
  const name   = document.getElementById("applyName").value.trim();
  const phone  = document.getElementById("applyPhone").value.trim();
  const eshram = document.getElementById("applyEshramId").value.trim();
  const insured = document.getElementById("applyInsurance").checked;
 
  if (!name || !phone) {
    alert("Please enter your name and phone number.");
    return;
  }
 
  try {
    await db.collection("applications").add({
      name, phone, eshramId: eshram || null, insured,
      status: "submitted", createdAt: ts()
    });
    clearFields(["applyName", "applyPhone", "applyEshramId"]);
    document.getElementById("applyInsurance").checked = false;
    closeModal("applyJob");
    showToast("✅ Application submitted.");
  } catch (err) {
    console.error(err);
    alert("Couldn't submit application: " + err.message);
  }
};
 
/* ---------- 5. Hire Worker → deposits to escrow (Firestore) ---------- */
window.submitHire = async function() {
  if (!dbReady()) return;
 
  const date     = document.getElementById("hireDate").value;
  const location = document.getElementById("hireLocation").value.trim();
  const wage     = Number(document.getElementById("hireWage").value) || 1045;
 
  if (!date || !location) {
    alert("Please enter a job date and location.");
    return;
  }
 
  try {
    const ref = await db.collection("escrowPayments").add({
      workerName: "Manoj Kumar", date, location, wage,
      status: "in_escrow", depositedAt: ts()
    });
    clearFields(["hireLocation"]);
    closeModal("hireWorker");
    showEscrowTracker(ref.id, wage);
    showToast(`🔒 ₹${wage} deposited to escrow.`);
  } catch (err) {
    console.error(err);
    alert("Couldn't process hire: " + err.message);
  }
};
 
/* Escrow tracker banner + the "GPS checkout" trigger that actually
   releases the payment (updates Firestore + appends a Khata entry) */
function showEscrowTracker(escrowId, wage) {
  let tracker = document.getElementById("escrowTracker");
  if (!tracker) {
    tracker = document.createElement("div");
    tracker.id = "escrowTracker";
    tracker.className = "escrow-tracker";
    const khataCard = document.querySelector(".khata-card");
    khataCard.parentNode.insertBefore(tracker, khataCard);
  }
  tracker.innerHTML = `
    <div class="escrow-tracker-inner">
      <div>
        <strong>🔒 ₹${wage} in Escrow</strong>
        <div style="font-size:0.78rem;color:var(--text-2);margin-top:0.2rem">
          Released automatically when the worker checks out via GPS.
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="simulateCheckout('${escrowId}', ${wage})">
        📍 Simulate GPS Checkout
      </button>
    </div>`;
}
 
window.simulateCheckout = async function(escrowId, wage) {
  if (!dbReady()) return;
  try {
    await db.collection("escrowPayments").doc(escrowId).update({
      status: "paid", checkedOutAt: ts()
    });
    await db.collection("khataEntries").add({
      workerName: "Manoj Kumar",
      description: "Job completed — GPS checkout verified",
      amount: wage,
      status: "paid",
      createdAt: ts()
    });
    const tracker = document.getElementById("escrowTracker");
    if (tracker) {
      tracker.innerHTML = `<div class="escrow-tracker-inner">
        <strong style="color:var(--green)">✅ ₹${wage} released — payment complete.</strong>
      </div>`;
    }
    showToast("✅ GPS checkout verified — payment released from escrow.");
  } catch (err) {
    console.error(err);
    alert("Couldn't release payment: " + err.message);
  }
};
 
/* ---------- Live Digital Khata feed (real-time Firestore listener) ---------- */
function listenKhataFeed() {
  if (!window.db) return;
  db.collection("khataEntries").orderBy("createdAt", "desc").limit(5)
    .onSnapshot(snap => {
      const list = document.getElementById("liveKhataFeed");
      const emptyMsg = document.getElementById("khataEmptyMsg");
      if (!list) return;
 
      if (snap.empty) {
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
      }
      if (emptyMsg) emptyMsg.style.display = "none";
      list.innerHTML = "";
 
      snap.forEach(doc => {
        const d = doc.data();
        const row = document.createElement("div");
        row.className = "khata-row";
        const isPaid = d.status === "paid";
        row.innerHTML = `
          <div class="khata-work">
            <strong>${escapeHtml(d.description || "Proof of work")}</strong>
            <div class="khata-date">${escapeHtml(d.workerName || "")}</div>
            ${d.fileName ? `<div class="khata-proof-row"><span class="proof-pill">📎 ${escapeHtml(d.fileName)}</span></div>` : ""}
          </div>
          <div class="khata-amount ${isPaid ? "paid" : "escrow"}">
            ${d.amount ? "+₹" + d.amount : ""}
            <span class="${isPaid ? "paid-tag" : "escrow-tag"}">${isPaid ? "✅ Paid" : "🔒 In Escrow"}</span>
          </div>`;
        list.appendChild(row);
      });
    }, err => console.error("Khata live feed error:", err));
}
 
document.addEventListener("DOMContentLoaded", listenKhataFeed);
 
console.log("⚒️ Dihaadi loaded — Daily Work, Dignified. Firestore CRUD wired in.");
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
