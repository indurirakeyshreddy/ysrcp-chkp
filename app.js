const languageButton = document.querySelector(".language-toggle");
const languageLabel = document.querySelector(".language-label");
let revealObserver;

function setupScrollReveals() {
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.body.classList.add("reveal-enabled");
  document.querySelectorAll(".campaign-section, .gallery-heading, .about-mark, .about-copy, .candidate-card, .gallery-empty")
    .forEach((element) => {
      element.classList.add("reveal-item");
      revealObserver.observe(element);
    });
}

function setLanguage(language) {
  const isEnglish = language === "en";
  document.body.classList.toggle("telugu", !isEnglish);
  document.documentElement.lang = isEnglish ? "en" : "te";
  document.querySelectorAll("[data-en][data-te]").forEach((element) => {
    element.innerHTML = isEnglish ? element.dataset.en : element.dataset.te;
  });
  languageLabel.textContent = isEnglish ? "తెలుగు" : "English";
  languageButton.setAttribute("aria-pressed", String(isEnglish));
  renderGallery();
}

languageButton.addEventListener("click", () => {
  setLanguage(document.documentElement.lang === "te" ? "en" : "te");
});

function renderGallery() {
  const gallery = document.querySelector("#media-gallery");
  const emptyState = document.querySelector("#gallery-empty");
  const items = Array.isArray(window.campaignMedia) ? window.campaignMedia : [];
  gallery.replaceChildren();
  emptyState.hidden = items.length > 0;

  items.forEach((item) => {
    if (!["image", "video"].includes(item.type) || !item.src) {
      console.error("Skipping a gallery item with a missing or unsupported type/source.", item);
      return;
    }

    const card = document.createElement("article");
    card.className = "media-card";
    if (revealObserver) {
      card.classList.add("reveal-item");
      revealObserver.observe(card);
    }
    const media = document.createElement(item.type === "video" ? "video" : "img");
    media.className = "media-frame";
    media.src = item.src;
    if (item.type === "video") {
      media.controls = true;
      media.preload = "metadata";
    } else {
      media.alt = item.title || "YSRCP CHKP campaign";
      media.loading = "lazy";
    }
    media.addEventListener("error", () => {
      console.error(`Unable to load campaign media: ${item.src}`);
      media.setAttribute("aria-label", "Media could not be loaded");
    }, { once: true });

    const caption = document.createElement("div");
    caption.className = "media-caption";
    if (item.date) {
      const date = document.createElement("p");
      date.className = "media-date";
      date.textContent = item.date;
      caption.append(date);
    }
    const title = document.createElement("h3");
    title.textContent = document.documentElement.lang === "te"
      ? item.titleTe || item.title || ""
      : item.title || "";
    caption.append(title);
    if (item.description) {
      const description = document.createElement("p");
      description.textContent = document.documentElement.lang === "te"
        ? item.descriptionTe || item.description
        : item.description;
      caption.append(description);
    }
    card.append(media, caption);
    gallery.append(card);
  });
}

setupScrollReveals();
renderGallery();
