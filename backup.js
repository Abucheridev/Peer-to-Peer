(function () {
  "use strict";

  var STORAGE_KEY = "peer_to_peer_app_state_v1";
  var CUSTOM_GUIDES_KEY = "peer_to_peer_custom_guides_v1";
  var USD_TO_KES = 129;

  function loadCustomGuides() {
    try {
      var raw = localStorage.getItem(CUSTOM_GUIDES_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveCustomGuides(guides) {
    try {
      localStorage.setItem(CUSTOM_GUIDES_KEY, JSON.stringify(guides));
    } catch (err) {
      // Ignore storage quota issues gracefully
    }
  }

  function formatBackupTimestamp() {
    var now = new Date();
    var pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    return (
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      "_" +
      pad(now.getHours()) +
      "-" +
      pad(now.getMinutes())
    );
  }

  function exportAllAppData() {
    var rawState = null;
    try {
      rawState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (err) {
      rawState = null;
    }

    var payload = {
      app: "Peer to Peer",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      state: rawState,
      customGuides: loadCustomGuides()
    };

    var jsonText = JSON.stringify(payload, null, 2);
    var blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "peer-to-peer-backup-" + formatBackupTimestamp() + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function normalizeImportedState(importedState) {
    if (!importedState || typeof importedState !== "object") {
      return null;
    }

    var clean = {};
    clean.currency = importedState.currency === "KES" ? "KES" : "USD";

    var idSrc = importedState.identity && typeof importedState.identity === "object"
      ? importedState.identity
      : {};
    clean.identity = {
      isAnonymous: idSrc.isAnonymous !== false,
      alias:
        typeof idSrc.alias === "string" && idSrc.alias.trim()
          ? idSrc.alias.trim().slice(0, 32)
          : "CalmHarbor_19",
      visibleName:
        typeof idSrc.visibleName === "string" ? idSrc.visibleName.slice(0, 40) : "",
      visibleBio:
        typeof idSrc.visibleBio === "string" ? idSrc.visibleBio.slice(0, 70) : ""
    };

    var fSrc = importedState.filters && typeof importedState.filters === "object"
      ? importedState.filters
      : {};
    clean.filters = {
      track:
        fSrc.track === "breaking" || fSrc.track === "learning" ? fSrc.track : "all",
      pricing:
        fSrc.pricing === "free" || fSrc.pricing === "paid" ? fSrc.pricing : "all",
      topic: typeof fSrc.topic === "string" && fSrc.topic.trim() ? fSrc.topic : "all",
      search: typeof fSrc.search === "string" ? fSrc.search.slice(0, 120) : ""
    };

    clean.selectedGuideId =
      typeof importedState.selectedGuideId === "string"
        ? importedState.selectedGuideId
        : "g-1";

    clean.activeView =
      importedState.activeView === "session" || importedState.activeView === "habits"
        ? importedState.activeView
        : "directory";

    var sSrc = importedState.session && typeof importedState.session === "object"
      ? importedState.session
      : {};
    var dur = Number(sSrc.durationMins);
    clean.session = {
      active: Boolean(sSrc.active),
      guideId: typeof sSrc.guideId === "string" ? sSrc.guideId : clean.selectedGuideId,
      mode:
        sSrc.mode === "voice" || sSrc.mode === "video" ? sSrc.mode : "chat",
      durationMins: dur === 15 || dur === 30 || dur === 60 ? dur : 30,
      paymentMethod:
        sSrc.paymentMethod === "Bank Transfer" ? "Bank Transfer" : "PayPal",
      messages: Array.isArray(sSrc.messages) ? sSrc.messages.slice(-50) : [],
      optInShareNote: Boolean(sSrc.optInShareNote),
      checkinNote:
        typeof sSrc.checkinNote === "string" ? sSrc.checkinNote.slice(0, 500) : "",
      history: Array.isArray(sSrc.history) ? sSrc.history.slice(0, 20) : []
    };

    var pSrc = importedState.helperPayout && typeof importedState.helperPayout === "object"
      ? importedState.helperPayout
      : {};
    var rawRate = Number(pSrc.hourlyRateUSD);
    clean.helperPayout = {
      hourlyRateUSD:
        Number.isFinite(rawRate) && rawRate >= 0
          ? Number(rawRate.toFixed(2))
          : 0,
      method: pSrc.method === "PayPal" ? "PayPal" : "Bank Transfer",
      bankName: typeof pSrc.bankName === "string" ? pSrc.bankName.slice(0, 80) : "",
      accountHolder:
        typeof pSrc.accountHolder === "string" ? pSrc.accountHolder.slice(0, 80) : "",
      accountNumber:
        typeof pSrc.accountNumber === "string" ? pSrc.accountNumber.slice(0, 80) : "",
      routingCode:
        typeof pSrc.routingCode === "string" ? pSrc.routingCode.slice(0, 40) : "",
      paypalEmail:
        typeof pSrc.paypalEmail === "string" ? pSrc.paypalEmail.slice(0, 100) : "",
      paypalHandle:
        typeof pSrc.paypalHandle === "string" ? pSrc.paypalHandle.slice(0, 80) : "",
      note: typeof pSrc.note === "string" ? pSrc.note.slice(0, 140) : ""
    };

    clean.habits = Array.isArray(importedState.habits)
      ? importedState.habits.slice(0, 50).map(function (h, idx) {
          return {
            id: typeof h.id === "string" ? h.id : "h-imp-" + idx,
            title: typeof h.title === "string" ? h.title.slice(0, 120) : "Habit",
            type: h.type === "build" ? "build" : "break",
            category:
              typeof h.category === "string"
                ? h.category
                : "Urge & Impulse Control",
            streak: Math.max(0, Number(h.streak) || 0),
            completedToday: Boolean(h.completedToday)
          };
        })
      : [];

    clean.urgeLogs = Array.isArray(importedState.urgeLogs)
      ? importedState.urgeLogs.slice(0, 50).map(function (u, idx) {
          return {
            id: typeof u.id === "string" ? u.id : "u-imp-" + idx,
            trigger:
              typeof u.trigger === "string" ? u.trigger.slice(0, 140) : "Logged trigger",
            intensity: Math.min(10, Math.max(1, Number(u.intensity) || 5)),
            action:
              typeof u.action === "string" ? u.action.slice(0, 160) : "Paused and reflected",
            timestamp:
              typeof u.timestamp === "string" ? u.timestamp : "Restored from backup"
          };
        })
      : [];

    return clean;
  }

  function importBackupJsonText(jsonText) {
    var parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid backup structure.");
    }

    var sourceState = parsed.state && typeof parsed.state === "object" ? parsed.state : parsed;
    var normalized = normalizeImportedState(sourceState);
    if (!normalized) {
      throw new Error("Backup file does not contain valid Peer to Peer state data.");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    if (Array.isArray(parsed.customGuides)) {
      saveCustomGuides(parsed.customGuides);
    }

    return normalized;
  }

  function renderBackupSummaryCard() {
    var container = document.getElementById("backup-restore-summary");
    if (!container) return;

    var stateObj = null;
    try {
      stateObj = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (err) {
      stateObj = null;
    }

    var habitCount = stateObj && Array.isArray(stateObj.habits) ? stateObj.habits.length : 0;
    var urgeCount = stateObj && Array.isArray(stateObj.urgeLogs) ? stateObj.urgeLogs.length : 0;
    var historyCount =
      stateObj && stateObj.session && Array.isArray(stateObj.session.history)
        ? stateObj.session.history.length
        : 0;
    var currency = stateObj && stateObj.currency === "KES" ? "KES" : "USD";
    var rateUSD =
      stateObj && stateObj.helperPayout && Number.isFinite(Number(stateObj.helperPayout.hourlyRateUSD))
        ? Number(stateObj.helperPayout.hourlyRateUSD)
        : 0;
    var rateFormatted =
      rateUSD <= 0
        ? "Free Peer"
        : currency === "KES"
        ? "KSh " + Math.round(rateUSD * USD_TO_KES).toLocaleString("en-US") + "/hr"
        : "$" + rateUSD.toFixed(2).replace(/\.00$/, "") + "/hr";

    container.innerHTML =
      '<div class="backup-stats-grid">' +
      '<div class="backup-stat"><span>Habits</span><strong>' +
      habitCount +
      "</strong></div>" +
      '<div class="backup-stat"><span>Urge Logs</span><strong>' +
      urgeCount +
      "</strong></div>" +
      '<div class="backup-stat"><span>Session Log</span><strong>' +
      historyCount +
      "</strong></div>" +
      '<div class="backup-stat"><span>Helper Rate</span><strong>' +
      rateFormatted +
      "</strong></div>" +
      "</div>";
  }

  function setBackupStatusMessage(text, isError) {
    var statusEl = document.getElementById("backup-status-message");
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", Boolean(isError));
  }

  function bindBackupControls() {
    var exportBtn = document.getElementById("export-json-backup-btn");
    var importTriggerBtn = document.getElementById("import-json-trigger-btn");
    var fileInput = document.getElementById("import-json-file-input");

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        try {
          exportAllAppData();
          renderBackupSummaryCard();
          setBackupStatusMessage("Exported JSON backup file.", false);
        } catch (err) {
          setBackupStatusMessage("Could not export backup: " + err.message, true);
        }
      });
    }

    if (importTriggerBtn && fileInput) {
      importTriggerBtn.addEventListener("click", function () {
        fileInput.click();
      });

      fileInput.addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            importBackupJsonText(String(ev.target.result || ""));
            setBackupStatusMessage(
              'Restored backup from "' + file.name + '". Reloading view...',
              false
            );
            setTimeout(function () {
              window.location.reload();
            }, 450);
          } catch (err) {
            setBackupStatusMessage("Restore failed: " + err.message, true);
          } finally {
            fileInput.value = "";
          }
        };
        reader.onerror = function () {
          setBackupStatusMessage("Failed to read the selected file.", true);
          fileInput.value = "";
        };
        reader.readAsText(file);
      });
    }

    document.addEventListener("click", function (e) {
      if (
        e.target.closest('[data-view="habits"]') ||
        e.target.closest("#save-checkin-note-btn") ||
        e.target.closest('#add-habit-form button[type="submit"]') ||
        e.target.closest('#urge-log-form button[type="submit"]') ||
        e.target.closest('#payout-settings-form button[type="submit"]')
      ) {
        setTimeout(renderBackupSummaryCard, 120);
      }
    });
  }

  window.PeerToPeerBackup = {
    exportJson: exportAllAppData,
    importJsonText: importBackupJsonText,
    renderSummary: renderBackupSummaryCard
  };

  function initBackupModule() {
    bindBackupControls();
    renderBackupSummaryCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackupModule);
  } else {
    initBackupModule();
  }
})();
