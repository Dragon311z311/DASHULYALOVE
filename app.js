// ============================================================
// ВСЯ ЛОГИКА САЙТА. Этот файл менять не нужно —
// весь текст редактируется в content.js.
// ============================================================

function $(sel, root) {
  return (root || document).querySelector(sel);
}
function $all(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}
function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      /* noop */
    }
  }
}

// Плавное появление элементов со сдвигом — используется во всех разделах
function animateIn(elements, delays) {
  const list = elements.filter(Boolean);
  list.forEach((elm) => {
    elm.style.transition = "none";
    elm.style.opacity = "0";
    elm.style.transform = "translateY(12px)";
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      list.forEach((elm, i) => {
        const d = delays ? delays[i] || 0 : i * 150;
        elm.style.transition =
          "opacity 0.7s cubic-bezier(.22,1,.36,1) " +
          d +
          "ms, transform 0.7s cubic-bezier(.22,1,.36,1) " +
          d +
          "ms";
        elm.style.opacity = "1";
        elm.style.transform = "translateY(0)";
      });
    });
  });
}

const state = {
  unlocked: false,
  visited: new Set(),
  reasonIndex: 0,
  reasonFinished: false,
  reasonGalleryOpen: false,
  reasonGalleryBuilt: false,
  photoIndex: 0,
};

// ============================================================
// ФОНОВЫЕ ЧАСТИЦЫ И ЗВЁЗДЫ (чисто декоративное, один раз при загрузке)
// ============================================================
function buildAmbientParticles() {
  const wrap = $("#ambientParticles");
  for (let i = 0; i < 16; i++) {
    const s = el("span");
    s.style.setProperty("--x", (i * 61) % 100 + "%");
    s.style.setProperty("--delay", (i % 8) * 0.9 + "s");
    s.style.setProperty("--dur", 9 + (i % 6) * 1.6 + "s");
    s.style.setProperty("--size", 1.5 + (i % 3) + "px");
    wrap.appendChild(s);
  }
}
function buildStars(containerId, count) {
  const wrap = $(containerId);
  for (let i = 0; i < count; i++) {
    const s = el("span");
    s.style.setProperty("--x", (i * 37) % 100 + "%");
    s.style.setProperty("--y", (i * 53) % 100 + "%");
    s.style.setProperty("--d", 2 + (i % 5) + "s");
    s.style.setProperty("--dl", (i % 7) * 0.3 + "s");
    wrap.appendChild(s);
  }
}
function buildFinaleHearts() {
  const wrap = $("#finaleHearts");
  for (let i = 0; i < 14; i++) {
    const s = el("span", null, i % 2 === 0 ? "❤" : "✦");
    s.style.setProperty("--x", (i * 43) % 100 + "%");
    s.style.setProperty("--dur", 7 + (i % 5) * 1.4 + "s");
    s.style.setProperty("--delay", i * 0.6 + "s");
    s.style.setProperty("--size", 12 + (i % 3) * 6 + "px");
    wrap.appendChild(s);
  }
}

// ============================================================
// ЭКРАН-ВХОД (СЕРДЦЕ)
// ============================================================
const HOLD_MS = 1700;
const heartGate = {
  phase: "idle", // idle | holding | success | leaving
  rafId: null,
  startTs: 0,
};

function setHeartClip(progress) {
  const rect = $("#heartClipRect");
  const height = progress * 100;
  rect.setAttribute("y", 100 - height);
  rect.setAttribute("height", height);
}

function buildHeartParticles() {
  const wrap = $("#heartParticles");
  wrap.innerHTML = "";
  const count = 18;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 2 === 0 ? 0.15 : -0.15);
    const dist = 78 + ((i * 37) % 22);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const s = el("span", "heart-particle");
    s.style.setProperty("--dx", dx + "px");
    s.style.setProperty("--dy", dy + "px");
    s.style.setProperty("--delay", (i % 9) * 0.09 + "s");
    const size = 3 + (i % 3);
    s.style.width = size + "px";
    s.style.height = size + "px";
    wrap.appendChild(s);
  }
  wrap.classList.remove("hidden");
}

function heartTick(ts) {
  if (!heartGate.startTs) heartGate.startTs = ts;
  const elapsed = ts - heartGate.startTs;
  const p = Math.min(1, elapsed / HOLD_MS);
  setHeartClip(p);
  if (p >= 1) {
    heartGate.phase = "success";
    $("#heartBtn").className = "heart-btn phase-success";
    $("#gateInstruction").textContent = CONTENT.gate.success;
    $("#gateSub").textContent = "";
    vibrate([12, 30, 18]);
    setTimeout(() => {
      heartGate.phase = "leaving";
      $("#gate").classList.add("leaving");
      setTimeout(unlockApp, 700);
    }, 550);
    return;
  }
  heartGate.rafId = requestAnimationFrame(heartTick);
}

function startHeartHold(e) {
  if (heartGate.phase === "success" || heartGate.phase === "leaving") return;
  e.preventDefault();
  try {
    e.target.setPointerCapture(e.pointerId);
  } catch (err) {
    /* noop */
  }
  heartGate.phase = "holding";
  $("#heartBtn").className = "heart-btn phase-holding";
  buildHeartParticles();
  vibrate(8);
  heartGate.startTs = 0;
  heartGate.rafId = requestAnimationFrame(heartTick);
}
function endHeartHold() {
  if (heartGate.phase !== "holding") return;
  cancelAnimationFrame(heartGate.rafId);
  heartGate.startTs = 0;
  heartGate.phase = "idle";
  $("#heartBtn").className = "heart-btn phase-idle";
  $("#heartParticles").classList.add("hidden");
  $("#heartParticles").innerHTML = "";
  setHeartClip(0);
}

function unlockApp() {
  state.unlocked = true;
  $("#gate").classList.add("hidden");
  $("#ambientParticles").classList.remove("hidden");
  $("#musicToggle").classList.remove("hidden");
  showScreen(null);
}

// ============================================================
// ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
// ============================================================
function showScreen(key) {
  $all(".scene").forEach((s) => s.classList.add("hidden"));
  const idSel = key === null ? "#screen-home" : "#screen-" + key;
  $(idSel).classList.remove("hidden");
  window.scrollTo(0, 0);
  if (key === null) renderHome();
}

$all("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(null));
});

// ============================================================
// ГЛАВНЫЙ ЭКРАН
// ============================================================
function isLocked(index) {
  return index > 0 && !state.visited.has(CONTENT.navItems[index - 1].key);
}

function renderHome() {
  $("#homeKicker").textContent = CONTENT.home.kicker;
  $("#homeTitle").textContent = CONTENT.home.title;
  $("#homeSubtitle").textContent = CONTENT.home.subtitle;

  const grid = $("#navGrid");
  grid.innerHTML = "";
  CONTENT.navItems.forEach((item, i) => {
    const locked = isLocked(i);
    const done = state.visited.has(item.key);
    const btn = el("button", "nav-card" + (locked ? " is-locked" : ""));
    if (locked) {
      const lock = el("span", "nav-lock", "🔒");
      btn.appendChild(lock);
    } else if (done) {
      const check = el("span", "nav-done", "✓");
      btn.appendChild(check);
    }
    btn.appendChild(el("span", "nav-emoji", item.emoji));
    btn.appendChild(el("span", "nav-label", item.label));
    btn.addEventListener("click", () => handleNavClick(item.key, locked, btn));
    grid.appendChild(btn);
  });

  const allVisited = CONTENT.navItems.every((n) => state.visited.has(n.key));
  const finaleCard = $("#finaleCard");
  finaleCard.className = "finale-card " + (allVisited ? "unlocked" : "locked");
  $("#finaleIcon").textContent = allVisited ? "✨" : "🔒";
  $("#finaleText").textContent = allVisited
    ? CONTENT.home.finaleLabel
    : CONTENT.home.finaleLockedHint;
}

function handleNavClick(key, locked, btnEl) {
  if (locked) {
    btnEl.classList.remove("is-shaking");
    void btnEl.offsetWidth;
    btnEl.classList.add("is-shaking");
    setTimeout(() => btnEl.classList.remove("is-shaking"), 420);
    return;
  }
  if (key === "wish") {
    openWishGate();
    return;
  }
  markVisitedAndOpen(key);
}

function markVisitedAndOpen(key) {
  state.visited.add(key);
  switch (key) {
    case "congratulation":
      resetCongratulation();
      break;
    case "reasons":
      resetReasons();
      break;
    case "album":
      break;
    case "letter":
      resetLetter();
      break;
  }
  showScreen(key);
}

$("#secretHeart").addEventListener("pointerdown", startSecretHold);
$("#secretHeart").addEventListener("pointerup", cancelSecretHold);
$("#secretHeart").addEventListener("pointerleave", cancelSecretHold);
let secretTimer = null;
function startSecretHold() {
  $("#secretHeart").classList.add("arming");
  secretTimer = setTimeout(() => {
    $("#secretHeart").classList.remove("arming");
    openSecretModal();
  }, 1400);
}
function cancelSecretHold() {
  $("#secretHeart").classList.remove("arming");
  clearTimeout(secretTimer);
}

$("#finaleCard").addEventListener("click", () => {
  const allVisited = CONTENT.navItems.every((n) => state.visited.has(n.key));
  if (!allVisited) return;
  showScreen("finale");
  animateIn(
    [$("#finaleLine1"), $("#finaleLine2"), $("#finaleLine3"), $("#finaleFooter")],
    [300, 1000, 1700, 2600]
  );
});

// ============================================================
// ПОЗДРАВЛЕНИЕ
// ============================================================
let congratParagraphEls = [];
function buildCongratulation() {
  $("#congratTitle").textContent = CONTENT.congratulation.title;
  const wrap = $("#congratParagraphs");
  wrap.innerHTML = "";
  congratParagraphEls = CONTENT.congratulation.paragraphs.map((text) => {
    const p = el("p", "body-text congrat-p", text);
    wrap.appendChild(p);
    return p;
  });
}
function resetCongratulation() {
  const delays = [0].concat(congratParagraphEls.map((_, i) => 300 + i * 180));
  animateIn([$("#congratTitle")].concat(congratParagraphEls), delays);
}

// ============================================================
// МОИ ПРИЧИНЫ
// ============================================================
function resetReasons() {
  state.reasonIndex = 0;
  state.reasonFinished = false;
  state.reasonGalleryOpen = false;
  renderReasons();
}
function renderReasons() {
  const items = CONTENT.reasons.items;
  $("#reasonsHeaderTitle").textContent = state.reasonGalleryOpen
    ? CONTENT.reasons.galleryTitle
    : CONTENT.reasons.title;

  if (state.reasonGalleryOpen) {
    $("#reasonsDeckWrap").classList.add("hidden");
    $("#reasonsGallery").classList.remove("hidden");
    $("#reasonsSubtitle").classList.add("hidden");
    buildReasonsGalleryIfNeeded();
    return;
  }
  $("#reasonsDeckWrap").classList.remove("hidden");
  $("#reasonsGallery").classList.add("hidden");
  $("#reasonsSubtitle").classList.remove("hidden");
  $("#reasonsSubtitle").textContent = CONTENT.reasons.subtitle;

  if (state.reasonFinished) {
    $("#reasonCard").classList.add("hidden");
    $("#reasonDoneCard").classList.remove("hidden");
    $("#reasonFooterText").textContent = CONTENT.reasons.footer;
    $("#reasonGalleryBtn").textContent = CONTENT.reasons.galleryLabel;
    $("#reasonRestartBtn").textContent = CONTENT.reasons.restartLabel;
    $("#reasonsDots").innerHTML = "";
    return;
  }
  $("#reasonCard").classList.remove("hidden");
  $("#reasonDoneCard").classList.add("hidden");
  $("#reasonText").textContent = items[state.reasonIndex];

  const dotsWrap = $("#reasonsDots");
  dotsWrap.innerHTML = "";
  items.forEach((_, i) => {
    const cls =
      "reasons-dot" +
      (i === state.reasonIndex ? " active" : "") +
      (i < state.reasonIndex ? " done" : "");
    dotsWrap.appendChild(el("span", cls));
  });
}
$("#reasonCard").addEventListener("click", () => {
  const total = CONTENT.reasons.items.length;
  if (state.reasonIndex >= total - 1) {
    state.reasonFinished = true;
    renderReasons();
    return;
  }
  const card = $("#reasonCard");
  card.classList.add("fade-out");
  setTimeout(() => {
    state.reasonIndex++;
    renderReasons();
    card.classList.remove("fade-out");
  }, 220);
});
$("#reasonGalleryBtn").addEventListener("click", () => {
  state.reasonGalleryOpen = true;
  renderReasons();
});
$("#reasonRestartBtn").addEventListener("click", () => {
  resetReasons();
});
function buildReasonsGalleryIfNeeded() {
  if (state.reasonGalleryBuilt) return;
  const wrap = $("#reasonsGallery");
  CONTENT.reasons.items.forEach((text, i) => {
    const card = el("div", "gallery-card");
    card.appendChild(el("span", "gallery-index", String(i + 1)));
    card.appendChild(el("p", "gallery-text", text));
    wrap.appendChild(card);
  });
  const backBtn = el("button", "gallery-back primary-btn", CONTENT.reasons.backLabel);
  backBtn.addEventListener("click", () => {
    state.reasonGalleryOpen = false;
    renderReasons();
  });
  wrap.appendChild(backBtn);
  state.reasonGalleryBuilt = true;
}

// ============================================================
// ЗАГАДАЙ ЖЕЛАНИЕ (свеча) + ВОПРОС ПРО ДЕНЬ РОЖДЕНИЯ
// ============================================================
function openWishGate() {
  $("#wgQuestion").textContent = CONTENT.wishGate.question;
  $("#wgSub").textContent = CONTENT.wishGate.sub;
  $("#wgYesBtn").textContent = CONTENT.wishGate.yes;
  $("#wgNoBtn").textContent = CONTENT.wishGate.no;
  $("#wgDeclineText").textContent = CONTENT.wishGate.declineMessage;
  $("#wgOkBtn").textContent = CONTENT.wishGate.okLabel;
  $("#wgAsk").classList.remove("hidden");
  $("#wgDecline").classList.add("hidden");
  $("#wishConfirmModal").classList.remove("closed");
}
function closeWishGate() {
  $("#wishConfirmModal").classList.add("closed");
}
$("#wgYesBtn").addEventListener("click", () => {
  closeWishGate();
  state.visited.add("wish");
  resetWish();
  showScreen("wish");
});
$("#wgNoBtn").addEventListener("click", () => {
  $("#wgAsk").classList.add("hidden");
  $("#wgDecline").classList.remove("hidden");
});
$("#wgOkBtn").addEventListener("click", () => {
  closeWishGate();
});
$("#wishConfirmModal").addEventListener("click", (e) => {
  if (e.target.id === "wishConfirmModal") closeWishGate();
});

const wish = {
  strength: 0,
  extinguished: false,
  holding: false,
  rafId: null,
  relaxRafId: null,
  startTs: 0,
};

function resetWish() {
  cancelAnimationFrame(wish.rafId);
  cancelAnimationFrame(wish.relaxRafId);
  wish.strength = 0;
  wish.extinguished = false;
  wish.holding = false;
  wish.startTs = 0;
  $("#wishPrompt").textContent = CONTENT.wish.prompt;
  $("#wishHint").textContent = CONTENT.wish.instruction;
  $("#wishSubhint").textContent = CONTENT.wish.hint;
  $("#wishStage").classList.remove("hidden");
  $("#wishAfter").classList.add("hidden");
  const flame = $("#flame");
  flame.className = "flame flame-idle";
  flame.style.transform = "";
  flame.style.opacity = "";
}

function wishTick(ts) {
  if (!wish.startTs) wish.startTs = ts;
  const elapsed = ts - wish.startTs;
  const s = Math.min(1, elapsed / 1600);
  wish.strength = s;

  const angle = Math.sin(elapsed * 0.028) * s * 11 + Math.sin(elapsed * 0.071) * s * 6;
  const x = Math.sin(elapsed * 0.045) * s * 5;
  const scale = 1 - s * 0.5 + Math.sin(elapsed * 0.09) * s * 0.05;
  const flame = $("#flame");
  flame.style.transform = "translateX(" + x + "px) rotate(" + angle + "deg) scaleY(" + scale + ")";
  flame.style.opacity = String(1 - s * 0.25);

  if (s >= 1) {
    wish.extinguished = true;
    wish.holding = false;
    vibrate([10, 40, 10]);
    showWishAfter();
    return;
  }
  if (wish.holding) wish.rafId = requestAnimationFrame(wishTick);
}

function startBlow(e) {
  if (wish.extinguished) return;
  e.preventDefault();
  try {
    e.target.setPointerCapture(e.pointerId);
  } catch (err) {
    /* noop */
  }
  cancelAnimationFrame(wish.relaxRafId);
  const flame = $("#flame");
  flame.classList.remove("flame-idle");
  flame.classList.add("flame-active");
  wish.holding = true;
  wish.startTs = 0;
  wish.rafId = requestAnimationFrame(wishTick);
}
function endBlow() {
  if (!wish.holding) return;
  wish.holding = false;
  cancelAnimationFrame(wish.rafId);
  if (wish.extinguished) return;
  const relax = () => {
    wish.strength = Math.max(0, wish.strength - 0.045);
    const flame = $("#flame");
    if (wish.strength <= 0) {
      flame.className = "flame flame-idle";
      flame.style.transform = "";
      flame.style.opacity = "";
      return;
    }
    flame.style.opacity = String(1 - wish.strength * 0.25);
    wish.relaxRafId = requestAnimationFrame(relax);
  };
  wish.relaxRafId = requestAnimationFrame(relax);
}
$("#blowZone").addEventListener("pointerdown", startBlow);
$("#blowZone").addEventListener("pointerup", endBlow);
$("#blowZone").addEventListener("pointercancel", endBlow);

function showWishAfter() {
  $("#wishStage").classList.add("hidden");
  $("#wishAfter").classList.remove("hidden");
  $("#wishAfterMessage").textContent = CONTENT.wish.afterMessage;
  $("#wishContinueBtn").textContent = CONTENT.wish.continueLabel;
  animateIn([$("#wishAfterMessage"), $("#wishContinueBtn")], [600, 1100]);
}
$("#wishContinueBtn").addEventListener("click", () => showScreen(null));

// ============================================================
// НАШИ МОМЕНТЫ (фотоальбом)
// ============================================================
const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #3a2456, #1c1130)",
  "linear-gradient(135deg, #4a2f4f, #241839)",
  "linear-gradient(135deg, #563a4a, #2a1a30)",
  "linear-gradient(135deg, #3d2a52, #191026)",
  "linear-gradient(135deg, #472a4a, #211530)",
];
const ROTATIONS = [-4, 3, -2, 4, -3];

function buildAlbum() {
  $("#albumTitle").textContent = CONTENT.album.title;
  $("#albumSubtitle").textContent = CONTENT.album.subtitle;
  const grid = $("#photoGrid");
  grid.innerHTML = "";
  MEMORIES.forEach((memory, i) => {
    const card = el("button", "photo-card");
    card.style.setProperty("--rot", ROTATIONS[i % 5] + "deg");
    const frame = el("div", "photo-frame");
    const img = new Image();
    img.loading = "lazy";
    img.alt = memory.title;
    img.src = memory.image;
    img.addEventListener("error", () => {
      frame.innerHTML = "";
      const ph = el("div", "photo-placeholder", "📷");
      ph.style.background = PLACEHOLDER_GRADIENTS[i % 5];
      frame.appendChild(ph);
    });
    frame.appendChild(img);
    card.appendChild(frame);
    const meta = el("div", "photo-meta");
    meta.appendChild(el("span", "photo-title", memory.title));
    card.appendChild(meta);
    card.addEventListener("click", () => openPhotoViewer(i));
    grid.appendChild(card);
  });
}

function openPhotoViewer(i) {
  state.photoIndex = i;
  renderPhotoViewer();
  $("#photoViewer").classList.remove("closed");
}
function renderPhotoViewer() {
  const memory = MEMORIES[state.photoIndex];
  const frame = $("#photoFullFrame");
  frame.innerHTML = "";
  const img = new Image();
  img.alt = memory.title;
  img.src = memory.image;
  img.addEventListener("error", () => {
    frame.innerHTML = "";
    const ph = el("div", "photo-placeholder large", "📷");
    frame.appendChild(ph);
  });
  frame.appendChild(img);
  $("#photoFullTitle").textContent = memory.title;
  $("#photoFullCaption").textContent = memory.caption;
  $("#photoFullDate").textContent = memory.date || "";
  $("#photoFullDate").classList.toggle("hidden", !memory.date);
}
$("#photoPrev").addEventListener("click", () => {
  state.photoIndex = (state.photoIndex - 1 + MEMORIES.length) % MEMORIES.length;
  renderPhotoViewer();
});
$("#photoNext").addEventListener("click", () => {
  state.photoIndex = (state.photoIndex + 1) % MEMORIES.length;
  renderPhotoViewer();
});
$("#photoClose").addEventListener("click", () => $("#photoViewer").classList.add("closed"));
$("#photoViewer").addEventListener("click", (e) => {
  if (e.target.id === "photoViewer") $("#photoViewer").classList.add("closed");
});

// ============================================================
// ПИСЬМО
// ============================================================
function resetLetter() {
  $("#envelopeLabel").textContent = CONTENT.letter.envelopeLabel;
  $("#envelopeHint").textContent = CONTENT.letter.openHint;
  $("#envelopeStage").classList.remove("hidden");
  $("#paperStage").classList.add("hidden");
}
$("#envelopeBtn").addEventListener("click", () => {
  $("#paperDate").textContent = CONTENT.letter.date;
  const textWrap = $("#paperText");
  textWrap.innerHTML = "";
  const ps = CONTENT.letter.paragraphs.map((text) => {
    const p = el("p", null, text);
    textWrap.appendChild(p);
    return p;
  });
  $("#paperSign").textContent = CONTENT.letter.signature;

  $("#envelopeStage").classList.add("hidden");
  $("#paperStage").classList.remove("hidden");
  const delays = ps.map((_, i) => 300 + i * 180);
  animateIn(ps, delays);
  animateIn([$("#paperSign")], [300 + ps.length * 180 + 200]);
});

// ============================================================
// ФИНАЛ (текст один раз, анимация — при каждом открытии, см. выше)
// ============================================================
function buildFinale() {
  $("#finaleLine1").textContent = CONTENT.finale.line1;
  $("#finaleLine2").textContent = CONTENT.finale.line2;
  $("#finaleLine3").textContent = CONTENT.finale.line3;
  $("#finaleFooter").textContent = CONTENT.finale.footer;
}

// ============================================================
// СЕКРЕТ
// ============================================================
function buildSecretSparkles() {
  const wrap = $("#secretSparkles");
  for (let i = 0; i < 10; i++) {
    const s = el("span");
    s.style.setProperty("--i", i);
    wrap.appendChild(s);
  }
}
function openSecretModal() {
  $("#secretTitle").textContent = CONTENT.secret.unlockTitle;
  $("#secretMessage").textContent = CONTENT.secret.unlockMessage;
  $("#secretCloseBtn").textContent = CONTENT.secret.thanksLabel;
  $("#secretModal").classList.remove("closed");
}
$("#secretCloseBtn").addEventListener("click", () => $("#secretModal").classList.add("closed"));
$("#secretModal").addEventListener("click", (e) => {
  if (e.target.id === "secretModal") $("#secretModal").classList.add("closed");
});

// ============================================================
// МУЗЫКА
// ============================================================
function setupMusic() {
  const btn = $("#musicToggle");
  let audio = null;
  let playing = false;
  let available = true;
  audio = new Audio(MUSIC_SRC);
  audio.loop = true;
  audio.volume = 0.35;
  audio.addEventListener("error", () => {
    available = false;
    btn.classList.add("hidden");
  });
  btn.addEventListener("click", () => {
    if (!available) return;
    if (playing) {
      audio.pause();
      playing = false;
      btn.classList.remove("on");
      btn.classList.add("off");
      btn.textContent = "⏸";
    } else {
      audio
        .play()
        .then(() => {
          playing = true;
          btn.classList.remove("off");
          btn.classList.add("on");
          btn.textContent = "♪";
        })
        .catch(() => {
          available = false;
          btn.classList.add("hidden");
        });
    }
  });
}

// ============================================================
// СТАРТ
// ============================================================
let __inited = false;
function init() {
  if (__inited) return;
  __inited = true;
  $("#gateInstruction").textContent = CONTENT.gate.instruction;
  $("#gateSub").textContent = CONTENT.gate.subInstruction;
  $("#gate").dataset.successText = CONTENT.gate.success;

  buildStars("#gateStars", 22);
  buildAmbientParticles();
  buildFinaleHearts();
  buildStars("#finaleStars", 60);
  buildSecretSparkles();
  buildCongratulation();
  buildAlbum();
  buildFinale();
  setupMusic();

  $("#heartBtn").addEventListener("pointerdown", startHeartHold);
  $("#heartBtn").addEventListener("pointerup", endHeartHold);
  $("#heartBtn").addEventListener("pointercancel", endHeartHold);
}

document.addEventListener("DOMContentLoaded", init);
