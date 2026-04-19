const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const COMPANY = {
  city: "Самара",
  owner: "Владлен",
  phoneE164: "+79171410636",
  phonePretty: "+7 (917) 141-06-36",
  whatsappDigits: "79171410636",
  telegramBotUrl: "https://t.me/SamaraWindowManagerbot",
};

const state = {
  modalOpen: false,
  lastFocus: null,
};

function formatRub(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function closeModal() {
  const modal = $("#modal");
  modal?.setAttribute("aria-hidden", "true");
  state.modalOpen = false;
  document.body.style.overflow = "";
  if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
}

function openModal(kind, payload = {}) {
  const modal = $("#modal");
  const content = $("#modalContent");
  if (!modal || !content) return;

  state.lastFocus = document.activeElement;

  const views = {
    lead: () => `
      <h3 class="modal__title" id="modalTitle">Заявка на замер / расчёт</h3>
      <p class="modal__text">Оставьте контакты — мы перезвоним и уточним детали. (Демо: без сервера)</p>

      <form class="form" id="modalLeadForm" style="margin-top:12px">
        <label class="field">
          <span>Имя</span>
          <input name="name" autocomplete="name" placeholder="Имя" required />
        </label>

        <label class="field">
          <span>Телефон</span>
          <input name="phone" autocomplete="tel" inputmode="tel" placeholder="${escapeHtml(COMPANY.phonePretty)}" required />
        </label>

        <label class="field">
          <span>Тема</span>
          <input name="subject" value="${escapeHtml(payload.subject || "Хочу расчёт")}" />
        </label>

        <label class="field">
          <span>Комментарий</span>
          <textarea name="msg" rows="3" placeholder="Например: 2 окна, 1400×1400, монтаж нужен"></textarea>
        </label>

        <button class="btn btn--primary btn--lg" type="submit">Отправить</button>
        <p class="small">Нажимая кнопку, вы соглашаетесь с обработкой данных.</p>
      </form>
    `,
    policy: () => `
      <h3 class="modal__title" id="modalTitle">Политика конфиденциальности</h3>
      <p class="modal__text">Это шаблон. Вставьте вашу реальную политику, реквизиты и цели обработки данных.</p>
      <div class="card" style="margin-top:12px">
        <p class="small" style="margin:0">
          Мы обрабатываем имя и телефон исключительно для связи по заявке.
          Данные не передаются третьим лицам, кроме случаев, предусмотренных законом.
        </p>
      </div>
      <div style="margin-top:12px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
        <button class="btn btn--primary" type="button" data-close-modal>Понятно</button>
      </div>
    `,
    details: () => {
      const d = payload.details || "windows";
      const map = {
        windows: {
          title: "Пластиковые окна",
          text: "Подберём профиль и стеклопакет: энергоэффективность, шумоизоляция, микропроветривание, защита от детей."
        },
        balcony: {
          title: "Остекление балконов",
          text: "Холодное или тёплое остекление, усиление, утепление, отделка, шкафы. Согласуем каждый этап."
        },
        doors: {
          title: "Двери и порталы",
          text: "Входные/межкомнатные/раздвижные системы. Надёжная фурнитура и корректная геометрия установки."
        },
      };
      const item = map[d] || map.windows;
      return `
        <h3 class="modal__title" id="modalTitle">${escapeHtml(item.title)}</h3>
        <p class="modal__text">${escapeHtml(item.text)}</p>

        <div class="ribbon" style="margin-top:12px">
          <div class="ribbon__left">
            <strong>Хотите точный расчёт?</strong>
            <span>${escapeHtml(COMPANY.city)} • оставьте заявку — и мы всё посчитаем по замеру.</span>
          </div>
          <div class="ribbon__right">
            <button class="btn btn--primary" data-open-modal="lead" data-subject="${escapeHtml(item.title)}: хочу расчёт">Оставить заявку</button>
            <button class="btn btn--ghost" data-close-modal>Закрыть</button>
          </div>
        </div>
      `;
    },
  };

  content.innerHTML = (views[kind] ? views[kind] : views.lead)();

  modal.setAttribute("aria-hidden", "false");
  state.modalOpen = true;
  document.body.style.overflow = "hidden";

  const firstInput = content.querySelector("input, select, textarea, button");
  if (firstInput) firstInput.focus();

  // modal internal actions
  $$("[data-close-modal]", modal).forEach((b) => b.addEventListener("click", closeModal));
  $$("[data-open-modal]", modal).forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.getAttribute("data-open-modal");
      const subject = b.getAttribute("data-subject") || "";
      const details = b.getAttribute("data-details") || "";
      openModal(k, { subject, details });
    })
  );

  const lead = $("#modalLeadForm");
  if (lead) {
    lead.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(lead);
      content.innerHTML = `
        <h3 class="modal__title" id="modalTitle">Заявка принята</h3>
        <p class="modal__text">Спасибо, ${escapeHtml(fd.get("name") || "")}! Мы свяжемся с вами в ближайшее время.</p>
        <div style="margin-top:12px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
          <a class="btn btn--ghost" href="tel:${escapeHtml(COMPANY.phoneE164)}">Позвонить</a>
          <button class="btn btn--primary" type="button" data-close-modal>Закрыть</button>
        </div>
      `;
      $$("[data-close-modal]", modal).forEach((b) => b.addEventListener("click", closeModal));
    });
  }
}

// header mobile menu
(function initMobileMenu() {
  const burger = $(".burger");
  const mobile = $("#mobileMenu");
  if (!burger || !mobile) return;

  function setOpen(open) {
    burger.setAttribute("aria-expanded", String(open));
    mobile.hidden = !open;
  }

  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();

// modal triggers
(function initModals() {
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open-modal]");
    if (!t) return;

    const kind = t.getAttribute("data-open-modal");
    const subject = t.getAttribute("data-subject") || "";
    const details = t.getAttribute("data-details") || "";
    openModal(kind, { subject, details });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.modalOpen) closeModal();
  });
})();

// calc
(function initCalc() {
  const form = $("#calcForm");
  if (!form) return;

  const out = $("#calcPrice");
  const note = $("#calcNote");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const construction = String(fd.get("construction") || "single");
    const w = clamp(Number(fd.get("w") || 0), 500, 4000);
    const h = clamp(Number(fd.get("h") || 0), 500, 3500);
    const profile = String(fd.get("profile") || "58");
    const glasspack = String(fd.get("glasspack") || "oneChamber");
    const install = fd.get("install") === "on";

    const area = (w / 1000) * (h / 1000);

    const baseByConstruction = {
      single: 16500,
      double: 17500,
      triple: 18500,
      balconyBlock: 20500,
      loggia: 21500,
      other: 18000,
    };
    const base = baseByConstruction[construction] ?? baseByConstruction.single;

    const profileCoef = profile === "70" ? 1.12 : profile === "58" ? 1.0 : 1.06;
    const glassCoef =
      glasspack === "single" ? 0.88 :
      glasspack === "oneChamber" ? 1.0 :
      glasspack === "twoChamber" ? 1.14 :
      1.0;
    const installCoef = install ? 1.22 : 1.0;

    let price = base * area * profileCoef * glassCoef * installCoef;
    const minByConstruction = { single: 14500, double: 16500, triple: 18500, balconyBlock: 32000, loggia: 36000, other: 17000 };
    price = Math.max(price, minByConstruction[construction] || 15000);

    if (out) out.textContent = formatRub(price);

    if (note) {
      const cLabel =
        construction === "single" ? "одностворчатого окна" :
        construction === "double" ? "двустворчатого окна" :
        construction === "triple" ? "трёхстворчатого окна" :
        construction === "balconyBlock" ? "балконного блока" :
        construction === "loggia" ? "лоджии/балкона" :
        "конструкции";
      const pLabel = profile === "70" ? "70 мм" : profile === "58" ? "58 мм" : "другое";
      const gLabel =
        glasspack === "single" ? "одинарный" :
        glasspack === "oneChamber" ? "однокамерный" :
        glasspack === "twoChamber" ? "двукамерный" :
        "уточнить";
      note.textContent = `Оценка для ${cLabel} ${w}×${h} мм, профиль: ${pLabel}, стеклопакет: ${gLabel}${install ? ", с монтажом" : ""}.`;
    }
  });
})();

// reviews slider
(function initSlider() {
  const slider = $("[data-slider]");
  if (!slider) return;

  const track = slider.querySelector("[data-track]");
  const prev = slider.querySelector("[data-prev]");
  const next = slider.querySelector("[data-next]");
  if (!track || !prev || !next) return;

  function scrollByPage(dir) {
    const w = track.getBoundingClientRect().width;
    track.scrollBy({ left: dir * w, behavior: "smooth" });
  }

  prev.addEventListener("click", () => scrollByPage(-1));
  next.addEventListener("click", () => scrollByPage(1));
})();

// portfolio lightbox (simple)
(function initLightbox() {
  const items = $$("[data-lightbox]");
  if (!items.length) return;

  items.forEach((b) => {
    b.addEventListener("click", () => {
      const n = b.getAttribute("data-lightbox") || "";
      openModal("details", { details: "windows", subject: `Портфолио: хочу похожее (${n})` });

      const content = $("#modalContent");
      if (!content) return;

      content.innerHTML = `
        <h3 class="modal__title" id="modalTitle">Работа №${escapeHtml(n)}</h3>
        <p class="modal__text">Здесь вставьте реальное фото (вместо заглушки). Сейчас — стильный плейсхолдер.</p>
        <div class="card" style="padding:0; overflow:hidden; margin-top:12px">
          <div style="height:320px; background: linear-gradient(135deg, rgba(11,95,255,.30), rgba(45,212,191,.14)), radial-gradient(900px 300px at 60% 40%, rgba(255,255,255,.10), transparent 60%);"></div>
        </div>
        <div style="margin-top:12px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
          <button class="btn btn--primary" data-open-modal="lead" data-subject="Хочу расчёт по проекту №${escapeHtml(n)}">Хочу так же</button>
          <button class="btn btn--ghost" data-close-modal>Закрыть</button>
        </div>
      `;

      $$("#modal [data-close-modal]").forEach((x) => x.addEventListener("click", closeModal));
      $$("#modal [data-open-modal]").forEach((x) =>
        x.addEventListener("click", () => openModal("lead", { subject: x.getAttribute("data-subject") || "" }))
      );
    });
  });
})();

// misc
const year = $("#year");
if (year) year.textContent = String(new Date().getFullYear());

// WhatsApp link
(function initWhatsApp() {
  const wa = $("#waLink");
  if (!wa) return;
  const text = encodeURIComponent(`Здравствуйте! Хочу рассчитать стоимость (Окнись, ${COMPANY.city}).`);
  wa.setAttribute("href", `https://wa.me/${COMPANY.whatsappDigits}?text=${text}`);
  wa.setAttribute("target", "_blank");
  wa.setAttribute("rel", "noopener noreferrer");
})();

// Telegram bot link (optional)
(function initTelegramBot() {
  const tg = $("#tgBotLink");
  if (!tg) return;
  if (COMPANY.telegramBotUrl) {
    tg.setAttribute("href", COMPANY.telegramBotUrl);
    tg.setAttribute("target", "_blank");
    tg.setAttribute("rel", "noopener noreferrer");
  } else {
    tg.setAttribute("href", `https://t.me/share/url?url=&text=${encodeURIComponent("Окнись: напишите нам в Telegram")}`);
    tg.setAttribute("target", "_blank");
    tg.setAttribute("rel", "noopener noreferrer");
  }
})();

// lead form (demo)
(function initLeadForm() {
  const form = $("#leadForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Отправляем…";

    setTimeout(() => {
      btn.textContent = "Готово!";
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = old;
        form.reset();
        openModal("policy");
      }, 700);
    }, 650);
  });
})();

