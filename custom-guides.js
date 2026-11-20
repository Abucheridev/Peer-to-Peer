(function () {
  "use strict";

  var CUSTOM_GUIDES_KEY = "peer_to_peer_custom_guides_v1";
  var STORAGE_KEY = "peer_to_peer_app_state_v1";
  var USD_TO_KES = 129;

  var ALLOWED_TOPICS = [
    "Porn & Compulsive Habits",
    "Masturbation Restraint",
    "Drug & Substance Urges",
    "Anger & Violence Management",
    "Gaming Addiction",
    "Stress & Anxiety",
    "Coding & Software",
    "Fitness & Movement",
    "Reading & Study Routines",
    "Communication & Boundaries"
  ];

  function loadCustomGuides() {
    try {
      var raw = localStorage.getItem(CUSTOM_GUIDES_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (g) {
        return g && typeof g === "object" && typeof g.name === "string" && g.name.trim();
      });
    } catch (err) {
      return [];
    }
  }

  function saveCustomGuides(guides) {
    try {
      localStorage.setItem(CUSTOM_GUIDES_KEY, JSON.stringify(guides));
    } catch (err) {
      // Ignore storage errors
    }
  }

  function getActiveCurrency() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return raw && raw.currency === "KES" ? "KES" : "USD";
    } catch (err) {
      return "USD";
    }
  }

  function formatRateBadge(hourlyRateUSD) {
    var rate = Number(hourlyRateUSD);
    if (!Number.isFinite(rate) || rate <= 0) {
      return "Free Peer";
    }
    var curr = getActiveCurrency();
    if (curr === "KES") {
      return "KSh " + Math.round(rate * USD_TO_KES).toLocaleString("en-US") + "/hr";
    }
    var clean = rate.toFixed(2).replace(/\.00$/, "");
    return "$" + clean + "/hr";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildCustomGuideCard(guide) {
    var article = document.createElement("article");
    article.className = "guide-card custom-guide-card";
    article.setAttribute("data-guide-id", guide.id);

    var rateText = formatRateBadge(guide.hourlyRateUSD);
    var isPaid = Number(guide.hourlyRateUSD) > 0;
    var trackLabel = guide.track === "learning" ? "Build & Learn Skills" : "Breaking Habits & Urges";
    var availability = guide.isAnonymousHost ? "Anonymous Host" : "Visible Mentor";
    var modes = Array.isArray(guide.modes) && guide.modes.length ? guide.modes : ["Chat"];

    article.innerHTML =
      '<div class="guide-card-top">' +
      '<span class="track-pill ' +
      (guide.track === "learning" ? "is-learning" : "is-breaking") +
      '">' +
      escapeHtml(trackLabel) +
      "</span>" +
      '<span class="price-pill ' +
      (isPaid ? "is-paid" : "is-free") +
      '">' +
      escapeHtml(rateText) +
      "</span>" +
      "</div>" +
      '<h3 class="guide-name">' +
      escapeHtml(guide.name) +
      "</h3>" +
      '<div class="guide-meta">' +
      "<span>" +
      escapeHtml(guide.topic) +
      "</span> &bull; <span>" +
      escapeHtml(availability) +
      "</span>" +
      "</div>" +
      '<p class="guide-bio">' +
      escapeHtml(guide.bio) +
      "</p>" +
      '<div class="guide-modes">' +
      modes
        .map(function (m) {
          return '<span class="mode-tag">' + escapeHtml(m) + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="guide-card-actions">' +
      '<button type="button" class="btn btn-primary btn-sm custom-select-guide-btn" data-custom-guide-id="' +
      escapeHtml(guide.id) +
      '">Select Guide</button>' +
      '<button type="button" class="btn btn-ghost btn-sm custom-delete-guide-btn" data-delete-guide-id="' +
      escapeHtml(guide.id) +
      '">Remove</button>' +
      "</div>";

    return article;
  }

  function renderCustomGuidesList() {
    var listEl = document.getElementById("custom-guides-saved-list");
    var gridEl = document.getElementById("guides-grid");
    var guides = loadCustomGuides();

    if (gridEl) {
      var existingCards = gridEl.querySelectorAll(".custom-guide-card");
      existingCards.forEach(function (el) {
        el.remove();
      });
      guides.forEach(function (guide) {
        gridEl.appendChild(buildCustomGuideCard(guide));
      });
    }

    if (listEl) {
      if (!guides.length) {
        listEl.innerHTML =
          '<p class="muted-text small-text">No custom circles or mentors added yet. Use the form above to publish one locally.</p>';
      } else {
        listEl.innerHTML = guides
          .map(function (g) {
            return (
              '<div class="custom-saved-item">' +
              "<div>" +
              "<strong>" +
              escapeHtml(g.name) +
              "</strong> " +
              '<span class="muted-text small-text">(' +
              escapeHtml(g.topic) +
              " &bull; " +
              escapeHtml(formatRateBadge(g.hourlyRateUSD)) +
              ")</span>" +
              "</div>" +
              '<button type="button" class="btn btn-ghost btn-xs custom-delete-guide-btn" data-delete-guide-id="' +
              escapeHtml(g.id) +
              '">Delete</button>' +
              "</div>"
            );
          })
          .join("");
      }
    }

    if (window.PeerToPeerBackup && typeof window.PeerToPeerBackup.renderSummary === "function") {
      window.PeerToPeerBackup.renderSummary();
    }
  }

  function handleCustomGuideSubmit(e) {
    e.preventDefault();
    var nameInput = document.getElementById("custom-guide-name");
    var trackSelect = document.getElementById("custom-guide-track");
    var topicSelect = document.getElementById("custom-guide-topic");
    var rateInput = document.getElementById("custom-guide-rate-usd");
    var bioInput = document.getElementById("custom-guide-bio");
    var anonCheckbox = document.getElementById("custom-guide-anon");

    if (!nameInput || !topicSelect || !bioInput) return;

    var name = nameInput.value.trim();
    var bio = bioInput.value.trim();
    if (!name || !bio) return;

    var rateVal = rateInput ? Number(rateInput.value) : 0;
    var hourlyRateUSD = Number.isFinite(rateVal) && rateVal > 0 ? Number(rateVal.toFixed(2)) : 0;
    var topic = ALLOWED_TOPICS.indexOf(topicSelect.value) !== -1 ? topicSelect.value : ALLOWED_TOPICS[0];
    var track = trackSelect && trackSelect.value === "learning" ? "learning" : "breaking";

    var modes = [];
    document.querySelectorAll('input[name="customGuideModes"]:checked').forEach(function (cb) {
      modes.push(cb.value);
    });
    if (!modes.length) modes = ["Chat"];

    var newGuide = {
      id: "cg-" + Date.now(),
      name: name.slice(0, 60),
      track: track,
      topic: topic,
      hourlyRateUSD: hourlyRateUSD,
      bio: bio.slice(0, 220),
      modes: modes,
      isAnonymousHost: anonCheckbox ? Boolean(anonCheckbox.checked) : true
    };

    var current = loadCustomGuides();
    current.unshift(newGuide);
    saveCustomGuides(current);

    nameInput.value = "";
    if (rateInput) rateInput.value = "0";
    bioInput.value = "";

    renderCustomGuidesList();

    var statusEl = document.getElementById("custom-guide-status");
    if (statusEl) {
      statusEl.textContent = 'Added "' + newGuide.name + '" to your local directory.';
    }
  }

  function selectCustomGuideIntoState(guideId) {
    var guides = loadCustomGuides();
    var chosen = null;
    for (var i = 0; i < guides.length; i++) {
      if (guides[i].id === guideId) {
        chosen = guides[i];
        break;
      }
    }
    if (!chosen) return;

    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      raw.selectedGuideId = chosen.id;
      raw.session = raw.session || {};
      raw.session.guideId = chosen.id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch (err) {
      // Ignore storage write errors
    }

    var banner = document.getElementById("selected-guide-banner");
    var bannerName = document.getElementById("selected-guide-name");
    var bannerMeta = document.getElementById("selected-guide-meta");
    if (banner && bannerName && bannerMeta) {
      banner.classList.remove("is-hidden");
      bannerName.textContent = chosen.name;
      bannerMeta.textContent = chosen.topic + " • " + formatRateBadge(chosen.hourlyRateUSD);
    }
  }

  function bindCustomGuidesEvents() {
    var form = document.getElementById("custom-guide-form");
    if (form) {
      form.addEventListener("submit", handleCustomGuideSubmit);
    }

    document.addEventListener("click", function (e) {
      var delBtn = e.target.closest("[data-delete-guide-id]");
      if (delBtn) {
        var delId = delBtn.getAttribute("data-delete-guide-id");
        var remaining = loadCustomGuides().filter(function (g) {
          return g.id !== delId;
        });
        saveCustomGuides(remaining);
        renderCustomGuidesList();
        return;
      }

      var selBtn = e.target.closest("[data-custom-guide-id]");
      if (selBtn) {
        selectCustomGuideIntoState(selBtn.getAttribute("data-custom-guide-id"));
      }
    });
  }

  window.PeerToPeerCustomGuides = {
    getGuides: loadCustomGuides,
    saveGuides: saveCustomGuides,
    render: renderCustomGuidesList
  };

  function initCustomGuides() {
    bindCustomGuidesEvents();
    renderCustomGuidesList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCustomGuides);
  } else {
    initCustomGuides();
  }
})();
