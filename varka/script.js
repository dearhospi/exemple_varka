/* ==========================================================================
   VARKA — интерактив
   Мобильное меню, табы меню, появление секций, подсветка навигации,
   валидация формы бронирования.
   ========================================================================== */

(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------------ */
  /* 1. Шапка: тень при скролле                                          */
  /* ------------------------------------------------------------------ */
  const header = $(".site-header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* 2. Мобильное меню                                                   */
  /* ------------------------------------------------------------------ */
  const burger = $("#burger");
  const nav = $("#nav");

  const closeNav = () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
  };

  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("is-open", !open);
    burger.setAttribute("aria-expanded", String(!open));
    burger.setAttribute("aria-label", open ? "Открыть меню" : "Закрыть меню");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(e.target) || burger.contains(e.target)) return;
    closeNav();
  });

  /* ------------------------------------------------------------------ */
  /* 3. Табы меню                                                        */
  /* ------------------------------------------------------------------ */
  const tabs = $$(".tab");
  const panels = $$(".menu-panel");

  const activateTab = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });

    panels.forEach((p) => {
      const active = p.id === `panel-${tab.dataset.tab}`;
      p.classList.toggle("is-active", active);
      p.hidden = !active;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const i = tabs.indexOf(tab);
      const next = e.key === "ArrowRight"
        ? tabs[(i + 1) % tabs.length]
        : tabs[(i - 1 + tabs.length) % tabs.length];
      next.focus();
      activateTab(next);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 4. Появление элементов при скролле                                  */
  /* ------------------------------------------------------------------ */
  const reveals = $$(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* 5. Подсветка активного раздела в навигации                          */
  /* ------------------------------------------------------------------ */
  const navLinks = $$(".nav a");
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* ------------------------------------------------------------------ */
  /* 6. Форма бронирования                                               */
  /* ------------------------------------------------------------------ */
  const form = $("#bookingForm");
  const success = $("#bookingSuccess");
  const successText = $("#successText");
  const resetBtn = $("#resetBooking");
  const dateInput = $("#date");

  // дата — от сегодняшнего дня
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  dateInput.min = iso(today);

  const setError = (field, message) => {
    const wrapper = field.closest(".field");
    const box = wrapper.querySelector(`[data-error-for="${field.name}"]`);
    wrapper.classList.toggle("has-error", Boolean(message));
    if (box) box.textContent = message || "";
  };

  const validate = () => {
    let firstInvalid = null;

    const name = $("#name");
    if (name.value.trim().length < 2) {
      setError(name, "Напишите, как к вам обращаться");
      firstInvalid = firstInvalid || name;
    } else {
      setError(name, "");
    }

    const phone = $("#phone");
    const digits = phone.value.replace(/\D/g, "");
    if (digits.length < 9) {
      setError(phone, "Нужен номер телефона — не меньше 9 цифр");
      firstInvalid = firstInvalid || phone;
    } else {
      setError(phone, "");
    }

    if (!dateInput.value) {
      setError(dateInput, "Выберите дату");
      firstInvalid = firstInvalid || dateInput;
    } else if (dateInput.value < dateInput.min) {
      setError(dateInput, "Эта дата уже прошла");
      firstInvalid = firstInvalid || dateInput;
    } else {
      setError(dateInput, "");
    }

    const time = $("#time");
    if (!time.value) {
      setError(time, "Выберите время");
      firstInvalid = firstInvalid || time;
    } else {
      setError(time, "");
    }

    return firstInvalid;
  };

  // ошибка исчезает, как только поле исправлено
  $$("input, select", form).forEach((field) => {
    field.addEventListener("input", () => {
      if (field.closest(".field").classList.contains("has-error")) {
        setError(field, "");
      }
    });
    field.addEventListener("change", () => {
      if (field.closest(".field").classList.contains("has-error")) {
        setError(field, "");
      }
    });
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const invalid = validate();
      if (invalid) {
        invalid.focus({ preventScroll: false });
        return;
      }

      const name = $("#name").value.trim();
      const when = new Date(`${dateInput.value}T00:00:00`);
      const dateText = when.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      const timeText = $("#time").value;
      const guests = $("#guests").value;
      const phone = $("#phone").value.trim();

      successText.textContent =
        `${name}, стол на ${dateText} в ${timeText} ждёт вас. ` +
        `Гостей: ${guests}. Перезвоним на ${phone}, чтобы подтвердить.`;

      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });

      // прокрутка к подтверждению, если карточка выше экрана
      const rect = success.getBoundingClientRect();
      if (rect.top < 90 || rect.bottom > window.innerHeight) {
        success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      success.hidden = true;
      form.hidden = false;
      dateInput.min = iso(new Date());
      $("#name").focus();
    });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Год в подвале                                                    */
  /* ------------------------------------------------------------------ */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
