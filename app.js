const languageButton = document.querySelector(".language-toggle");
const languageLabel = document.querySelector(".language-label");
let revealObserver;
const electionOptions = {
  mptc: { href: "mptc/index.html" },
  zptc: { href: "zptc/index.html" },
  panchayat: { href: "panchayat/index.html" },
  mla: { href: "mla/index.html" },
  mp: { href: "mp/index.html" },
};

function parseCampaignMenuConfig(yaml) {
  const lines = yaml.split(/\r?\n/);
  const config = { electionOrder: [], elections: {} };
  let section = "";
  let electionKey = "";
  let inLabel = false;

  lines.forEach((line) => {
    if (/^electionOrder:\s*(?:#.*)?$/.test(line)) {
      section = "order";
      electionKey = "";
      return;
    }
    if (/^elections:\s*(?:#.*)?$/.test(line)) {
      section = "elections";
      electionKey = "";
      return;
    }
    if (/^\S/.test(line)) {
      section = "";
      electionKey = "";
      return;
    }

    if (section === "order") {
      const orderItem = line.match(/^\s{2}-\s*([a-z]+)\s*(?:#.*)?$/);
      if (orderItem) {
        config.electionOrder.push(orderItem[1]);
      }
      return;
    }

    if (section !== "elections") {
      return;
    }

    const election = line.match(/^\s{2}([a-z]+):\s*(?:#.*)?$/);
    if (election) {
      electionKey = election[1];
      inLabel = false;
      config.elections[electionKey] = {};
      return;
    }
    if (!electionKey) {
      return;
    }

    if (/^\s{4}label:\s*(?:#.*)?$/.test(line)) {
      config.elections[electionKey].label = {};
      inLabel = true;
      return;
    }
    const enabled = line.match(/^\s{4}enabled:\s*([01])\s*(?:#.*)?$/);
    if (enabled) {
      config.elections[electionKey].enabled = enabled[1] === "1";
      inLabel = false;
      return;
    }
    if (inLabel) {
      const label = line.match(/^\s{6}(en|te):\s*(?:"([^"]*)"|'([^']*)')\s*(?:#.*)?$/);
      if (label) {
        config.elections[electionKey].label[label[1]] = label[2] ?? label[3];
      } else if (!/^\s{6}/.test(line)) {
        inLabel = false;
      }
    }
  });

  const keys = Object.keys(electionOptions);
  if (config.electionOrder.length !== keys.length
    || new Set(config.electionOrder).size !== keys.length
    || keys.some((key) => !config.electionOrder.includes(key))) {
    throw new Error("campaign-config.yaml must list each election exactly once in electionOrder.");
  }
  keys.forEach((key) => {
    const election = config.elections[key];
    if (typeof election?.enabled !== "boolean"
      || typeof election.label?.en !== "string"
      || typeof election.label?.te !== "string") {
      throw new Error(`Check elections.${key}.enabled and its English and Telugu labels in campaign-config.yaml.`);
    }
  });
  return config;
}

function renderElectionMenu(config) {
  const menu = document.querySelector("#election-menu");
  if (!menu) {
    return;
  }
  menu.replaceChildren();
  const enabledElections = config.electionOrder.filter((key) => config.elections[key].enabled);
  enabledElections.forEach((key) => {
    const link = document.createElement("a");
    link.href = `../${electionOptions[key].href}`;
    link.dataset.en = config.elections[key].label.en;
    link.dataset.te = config.elections[key].label.te;
    link.textContent = document.documentElement.lang === "te" ? link.dataset.te : link.dataset.en;
    menu.append(link);
  });
  menu.hidden = enabledElections.length === 0;
}

async function loadElectionMenu() {
  const menu = document.querySelector("#election-menu");
  if (!menu) {
    return;
  }
  try {
    const response = await fetch("../campaign-config.yaml", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`campaign-config.yaml returned HTTP ${response.status}.`);
    }
    const config = parseCampaignMenuConfig(await response.text());
    renderElectionMenu(config);
  } catch (error) {
    console.error("Unable to load election menu settings.", error);
    menu.replaceChildren();
    menu.hidden = true;
  }
}

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
  document.querySelectorAll(".campaign-section, .gallery-heading, .about-mark, .about-copy, .candidate-card, .gallery-empty, .election-card")
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

if (languageButton) {
  languageButton.addEventListener("click", () => {
    setLanguage(document.documentElement.lang === "te" ? "en" : "te");
  });
}

function renderGallery() {
  const gallery = document.querySelector("#media-gallery");
  const emptyState = document.querySelector("#gallery-empty");
  if (!gallery || !emptyState) {
    return;
  }
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
    media.src = document.body.dataset.election ? `../${item.src}` : item.src;
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
loadElectionMenu();
