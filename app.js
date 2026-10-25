const languageButton = document.querySelector(".language-toggle");
const languageLabel = document.querySelector(".language-label");
let revealObserver;
let videoObserver;
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

function setupElectionMenuHover() {
  const menu = document.querySelector(".election-menu");
  if (!menu || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  menu.addEventListener("pointerenter", () => {
    menu.open = true;
  });
  menu.addEventListener("pointerleave", () => {
    if (!menu.contains(document.activeElement)) {
      menu.open = false;
    }
  });
  menu.addEventListener("focusout", (event) => {
    if (!menu.contains(event.relatedTarget) && !menu.matches(":hover")) {
      menu.open = false;
    }
  });
}

function setupPresenterIntro() {
  if (!document.querySelector(".footer-credit")) {
    return;
  }

  const intro = document.createElement("div");
  intro.className = "presenter-intro";
  intro.setAttribute("role", "status");
  intro.setAttribute("aria-live", "polite");
  intro.innerHTML = `
    <div class="presenter-intro-card">
      <span class="presenter-intro-rule" aria-hidden="true"></span>
      <span class="presenter-intro-label" data-en="PRESENTED BY" data-te="సమర్పణ">సమర్పణ</span>
      <strong data-en="Merugu Venkata Reddy" data-te="మెరుగు వెంకట రెడ్డి">మెరుగు వెంకట రెడ్డి</strong>
      <span class="presenter-intro-rule" aria-hidden="true"></span>
    </div>
  `;
  document.body.append(intro);

  const removeIntro = (event) => {
    if (event && event.target !== intro) {
      return;
    }
    intro.remove();
  };
  intro.addEventListener("animationend", removeIntro);
  window.setTimeout(() => removeIntro(), 2800);
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
  const supportedItems = items.filter((item) => {
    if (["image", "video"].includes(item.type) && item.src) {
      return true;
    }
    console.error("Skipping a gallery item with a missing or unsupported type/source.", item);
    return false;
  });
  const orderedItems = [
    ...supportedItems.filter((item) => item.type === "image"),
    ...supportedItems.filter((item) => item.type === "video"),
  ];
  videoObserver?.disconnect();
  videoObserver = null;
  gallery.querySelectorAll("video.media-frame").forEach((video) => video.pause());
  gallery.replaceChildren();
  emptyState.hidden = orderedItems.length > 0;

  let currentGroup = "";
  orderedItems.forEach((item, index) => {
    if (item.type !== currentGroup) {
      currentGroup = item.type;
      const heading = document.createElement("h3");
      heading.className = "media-group-heading";
      heading.dataset.en = currentGroup === "image" ? "Photos" : "Videos";
      heading.dataset.te = currentGroup === "image" ? "ఫోటోలు" : "వీడియోలు";
      heading.textContent = document.documentElement.lang === "te" ? heading.dataset.te : heading.dataset.en;
      gallery.append(heading);
    }

    const card = document.createElement("article");
    card.className = "media-card";
    card.style.setProperty("--reveal-order", String(index % 6));
    if (revealObserver) {
      card.classList.add("reveal-item");
      revealObserver.observe(card);
    }
    const media = document.createElement(item.type === "video" ? "video" : "img");
    media.className = "media-frame";
    media.src = document.body.dataset.election ? `../${item.src}` : item.src;
    let mediaDisplay = media;
    if (item.type === "video") {
      media.muted = true;
      media.playsInline = true;
      media.preload = "none";
      media.setAttribute("aria-label", "Campaign video");
      let lastVideoTap = 0;
      const toggleVideoSound = () => {
        media.muted = !media.muted;
        updateSoundButton();
      };
      const playVideo = () => {
        if (!media.paused) {
          return;
        }
        media.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.warn(`Unable to play campaign video: ${media.currentSrc}`, error);
          }
        });
      };
      const videoShell = document.createElement("div");
      videoShell.className = "media-visual video-shell";
      const controls = document.createElement("div");
      controls.className = "video-controls";
      const playButton = document.createElement("button");
      playButton.className = "video-control-button";
      playButton.type = "button";
      playButton.setAttribute("aria-label", document.documentElement.lang === "te" ? "వీడియోను ప్లే చేయండి" : "Play video");
      playButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="play-icon" d="m9 6 10 6-10 6z"/><path class="pause-icon" d="M8 6h3v12H8zm5 0h3v12h-3z"/></svg>';
      const soundButton = document.createElement("button");
      soundButton.className = "video-control-button";
      soundButton.type = "button";
      soundButton.setAttribute("aria-label", document.documentElement.lang === "te" ? "శబ్దాన్ని ఆన్ చేయండి" : "Unmute video");
      soundButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="volume-shape" d="M4 10v4h4l5 4V6l-5 4z"/><path class="volume-wave" d="M16 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12"/><path class="mute-mark" d="m16 9 5 6m0-6-5 6"/></svg>';

      const updateSoundButton = () => {
        soundButton.classList.toggle("is-muted", media.muted);
        soundButton.setAttribute("aria-label", media.muted
          ? (document.documentElement.lang === "te" ? "శబ్దాన్ని ఆన్ చేయండి" : "Unmute video")
          : (document.documentElement.lang === "te" ? "శబ్దాన్ని మ్యూట్ చేయండి" : "Mute video"));
      };
      const updatePlayButton = () => {
        playButton.classList.toggle("is-playing", !media.paused);
        playButton.setAttribute("aria-label", media.paused
          ? (document.documentElement.lang === "te" ? "వీడియోను ప్లే చేయండి" : "Play video")
          : (document.documentElement.lang === "te" ? "వీడియోను పాజ్ చేయండి" : "Pause video"));
      };

      playButton.addEventListener("click", () => {
        if (media.paused) {
          playVideo();
        } else {
          media.pause();
        }
      });
      soundButton.addEventListener("click", () => {
        media.muted = !media.muted;
        updateSoundButton();
      });
      media.addEventListener("play", updatePlayButton);
      media.addEventListener("pause", updatePlayButton);
      media.addEventListener("volumechange", updateSoundButton);
      media.addEventListener("mouseenter", playVideo);
      media.addEventListener("touchstart", () => videoShell.classList.add("is-active"), { passive: true });
      videoShell.addEventListener("pointerleave", (event) => {
        if (event.pointerType !== "touch") {
          videoShell.classList.remove("is-active");
        }
      });
      videoShell.addEventListener("focusout", (event) => {
        if (!videoShell.contains(event.relatedTarget)) {
          videoShell.classList.remove("is-active");
        }
      });
      media.addEventListener("dblclick", () => {
        if (Date.now() - lastVideoTap > 500) {
          toggleVideoSound();
        }
      });
      media.addEventListener("touchend", (event) => {
        const now = Date.now();
        if (now - lastVideoTap < 350) {
          event.preventDefault();
          toggleVideoSound();
          lastVideoTap = now;
          return;
        }
        lastVideoTap = now;
      });
      updatePlayButton();
      updateSoundButton();
      controls.append(playButton, soundButton);
      videoShell.append(media, controls);
      mediaDisplay = videoShell;
    } else {
      media.alt = item.title || "YSRCP CHKP campaign";
      media.loading = "lazy";
      media.decoding = "async";
      const imageShell = document.createElement("div");
      imageShell.className = "media-visual";
      imageShell.append(media);
      mediaDisplay = imageShell;
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
    if (item.type === "video") {
      const hint = document.createElement("p");
      hint.className = "media-hint";
      hint.dataset.en = "Double-click the video to toggle sound.";
      hint.dataset.te = "శబ్దాన్ని మార్చడానికి వీడియోపై రెండుసార్లు క్లిక్ చేయండి.";
      hint.textContent = document.documentElement.lang === "te" ? hint.dataset.te : hint.dataset.en;
      caption.append(hint);
    }
    if (item.description) {
      const description = document.createElement("p");
      description.textContent = document.documentElement.lang === "te"
        ? item.descriptionTe || item.description
        : item.description;
      caption.append(description);
    }
    card.append(mediaDisplay, caption);
    gallery.append(card);
  });

  if ("IntersectionObserver" in window) {
    const visibleRatios = new Map();
    videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibleRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
      const visibleVideos = [...visibleRatios.entries()]
        .filter(([, ratio]) => ratio > 0)
        .sort((a, b) => b[1] - a[1]);
      const activeVideo = visibleVideos[0]?.[0];
      gallery.querySelectorAll("video.media-frame").forEach((video) => {
        if (video !== activeVideo) {
          video.pause();
        }
      });
      if (activeVideo && activeVideo.paused) {
        activeVideo.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.warn(`Unable to autoplay campaign video: ${activeVideo.currentSrc}`, error);
          }
        });
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    gallery.querySelectorAll("video.media-frame").forEach((video) => videoObserver.observe(video));
  } else {
    gallery.querySelectorAll("video.media-frame").forEach((video) => {
      video.autoplay = true;
      video.play().catch((error) => {
        if (error.name !== "AbortError") {
          console.warn(`Unable to autoplay campaign video: ${video.currentSrc}`, error);
        }
      });
    });
  }
}

setupScrollReveals();
setupElectionMenuHover();
setupPresenterIntro();
renderGallery();
loadElectionMenu();
