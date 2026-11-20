(function () {
  "use strict";

  var ROLES_KEY = "peer_to_peer_roles_v1";

  var STRUGGLE_OPTIONS = [
    "Porn & Compulsive Habits",
    "Masturbation Restraint",
    "Drug & Substance Urges",
    "Anger & Violence Management",
    "Gaming Addiction",
    "Stress & Anxiety",
    "Late-Night Screen / Doomscrolling"
  ];

  var LEARN_OPTIONS = [
    "Coding & Software",
    "Fitness & Movement",
    "Reading & Study Routines",
    "Communication & Boundaries",
    "Public Speaking & Confidence",
    "Personal Finance & Budgeting",
    "Time Management & Deep Work"
  ];

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadRoleState() {
    try {
      var raw = JSON.parse(localStorage.getItem(ROLES_KEY) || "null");
      if (!raw || typeof raw !== "object") {
        return getDefaultRoleState();
      }
      var client = raw.client && typeof raw.client === "object" ? raw.client : {};
      var mentor = raw.mentor && typeof raw.mentor === "object" ? raw.mentor : {};

      return {
        signedUp: Boolean(raw.signedUp),
        activeRole: raw.activeRole === "mentor" ? "mentor" : "client",
        client: {
          name: typeof client.name === "string" ? client.name : "",
          intentType: client.intentType === "learn" ? "learn" : "struggle",
          struggleDropdown:
            typeof client.struggleDropdown === "string" && client.struggleDropdown
              ? client.struggleDropdown
              : STRUGGLE_OPTIONS[0],
          struggleCustomText:
            typeof client.struggleCustomText === "string" ? client.struggleCustomText : "",
          learnDropdown:
            typeof client.learnDropdown === "string" && client.learnDropdown
              ? client.learnDropdown
              : LEARN_OPTIONS[0],
          learnCustomText:
            typeof client.learnCustomText === "string" ? client.learnCustomText : "",
          requestedGuide:
            typeof client.requestedGuide === "string" ? client.requestedGuide : ""
        },
        mentor: {
          name: typeof mentor.name === "string" ? mentor.name : "",
          activeBranch: mentor.activeBranch === "guide" ? "guide" : "teacher",
          teachTopics: Array.isArray(mentor.teachTopics)
            ? mentor.teachTopics
            : ["Coding & Software"],
          teachCustomSkill:
            typeof mentor.teachCustomSkill === "string" ? mentor.teachCustomSkill : "",
          guideTopics: Array.isArray(mentor.guideTopics)
            ? mentor.guideTopics
            : ["Porn & Compulsive Habits", "Stress & Anxiety"],
          guideCustomStruggle:
            typeof mentor.guideCustomStruggle === "string" ? mentor.guideCustomStruggle : "",
          hourlyRateUSD:
            Number.isFinite(Number(mentor.hourlyRateUSD)) && Number(mentor.hourlyRateUSD) >= 0
              ? Number(mentor.hourlyRateUSD)
              : 0,
          payoutMethod:
            mentor.payoutMethod === "PayPal" ? "PayPal" : "Bank Transfer"
        }
      };
    } catch (err) {
      return getDefaultRoleState();
    }
  }

  function getDefaultRoleState() {
    return {
      signedUp: false,
      activeRole: "client",
      client: {
        name: "",
        intentType: "struggle",
        struggleDropdown: STRUGGLE_OPTIONS[0],
        struggleCustomText: "",
        learnDropdown: LEARN_OPTIONS[0],
        learnCustomText: "",
        requestedGuide: ""
      },
      mentor: {
        name: "",
        activeBranch: "teacher",
        teachTopics: ["Coding & Software"],
        teachCustomSkill: "",
        guideTopics: ["Porn & Compulsive Habits", "Stress & Anxiety"],
        guideCustomStruggle: "",
        hourlyRateUSD: 0,
        payoutMethod: "Bank Transfer"
      }
    };
  }

  function saveRoleState(state) {
    try {
      localStorage.setItem(ROLES_KEY, JSON.stringify(state));
    } catch (err) {
      // Ignore storage errors
    }
  }

  function getActiveStruggleValue(state) {
    var custom = (state.client.struggleCustomText || "").trim();
    return custom || state.client.struggleDropdown || STRUGGLE_OPTIONS[0];
  }

  function getActiveLearnValue(state) {
    var custom = (state.client.learnCustomText || "").trim();
    return custom || state.client.learnDropdown || LEARN_OPTIONS[0];
  }

  function syncFormsFromState(state) {
    var signupRoleRadios = document.querySelectorAll('input[name="signupAccountRole"]');
    signupRoleRadios.forEach(function (r) {
      r.checked = r.value === state.activeRole;
    });

    var nameInput = document.getElementById("signup-display-name");
    if (nameInput) {
      nameInput.value =
        state.activeRole === "mentor" ? state.mentor.name : state.client.name;
    }

    var intentRadios = document.querySelectorAll('input[name="clientIntentTrack"]');
    intentRadios.forEach(function (r) {
      r.checked = r.value === state.client.intentType;
    });

    var struggleSelect = document.getElementById("client-struggle-select");
    var struggleText = document.getElementById("client-struggle-text");
    if (struggleSelect) struggleSelect.value = state.client.struggleDropdown;
    if (struggleText) struggleText.value = state.client.struggleCustomText;

    var learnSelect = document.getElementById("client-learn-select");
    var learnText = document.getElementById("client-learn-text");
    if (learnSelect) learnSelect.value = state.client.learnDropdown;
    if (learnText) learnText.value = state.client.learnCustomText;

    var teachChecks = document.querySelectorAll('input[name="mentorTeachTopic"]');
    teachChecks.forEach(function (cb) {
      cb.checked = state.mentor.teachTopics.indexOf(cb.value) !== -1;
    });
    var teachCustom = document.getElementById("mentor-teach-custom");
    if (teachCustom) teachCustom.value = state.mentor.teachCustomSkill;

    var guideChecks = document.querySelectorAll('input[name="mentorGuideTopic"]');
    guideChecks.forEach(function (cb) {
      cb.checked = state.mentor.guideTopics.indexOf(cb.value) !== -1;
    });
    var guideCustom = document.getElementById("mentor-guide-custom");
    if (guideCustom) guideCustom.value = state.mentor.guideCustomStruggle;

    var mentorRate = document.getElementById("mentor-role-rate");
    var mentorPayout = document.getElementById("mentor-role-payout");
    if (mentorRate) mentorRate.value = String(state.mentor.hourlyRateUSD);
    if (mentorPayout) mentorPayout.value = state.mentor.payoutMethod;
  }

  function renderMatchedSuggestions(state) {
    var box = document.getElementById("client-matched-suggestions");
    if (!box) return;

    var isLearn = state.client.intentType === "learn";
    var focusVal = isLearn ? getActiveLearnValue(state) : getActiveStruggleValue(state);
    var heading = isLearn
      ? "Mentors for people who want to learn: " + focusVal
      : "Guides for people struggling with: " + focusVal;

    var candidates = isLearn
      ? [
          { name: "Steady Craft Mentor", role: "Mentor (Skill Teacher)", rate: "$15/hr" },
          { name: "Focused Routine Coach", role: "Mentor (Skill Teacher)", rate: "Free Peer" }
        ]
      : [
          { name: "Quiet Harbor Circle", role: "Guide (Habit Struggle)", rate: "Free Peer" },
          { name: "Calm Reset Guide", role: "Guide (Habit Struggle)", rate: "$10/hr" }
        ];

    box.innerHTML =
      "<p class='small-text'><strong>" +
      escapeHtml(heading) +
      "</strong></p>" +
      candidates
        .map(function (c) {
          var isReq = state.client.requestedGuide === c.name;
          return (
            '<div class="custom-saved-item">' +
            "<div><strong>" +
            escapeHtml(c.name) +
            "</strong> <span class='muted-text small-text'>(" +
            escapeHtml(c.role) +
            " &bull; " +
            escapeHtml(c.rate) +
            ")</span></div>" +
            '<button type="button" class="btn btn-primary btn-xs client-request-session-btn" data-guide-name="' +
            escapeHtml(c.name) +
            '">' +
            (isReq ? "Session Requested" : "Request Session") +
            "</button>" +
            "</div>"
          );
        })
        .join("") +
      (state.client.requestedGuide
        ? '<p class="muted-text small-text" role="status">Active request sent to: <strong>' +
          escapeHtml(state.client.requestedGuide) +
          "</strong>.</p>"
        : "");
  }

  function renderDashboards(state) {
    var clientDash = document.getElementById("client-role-dashboard");
    var mentorDash = document.getElementById("mentor-role-dashboard");
    var switcherClient = document.getElementById("switch-to-client-dash-btn");
    var switcherMentor = document.getElementById("switch-to-mentor-dash-btn");
    var roleBadge = document.getElementById("active-account-role-badge");

    var isMentor = state.activeRole === "mentor";

    if (clientDash) clientDash.classList.toggle("is-hidden", isMentor);
    if (mentorDash) mentorDash.classList.toggle("is-hidden", !isMentor);

    if (switcherClient) {
      switcherClient.classList.toggle("is-active", !isMentor);
      switcherClient.setAttribute("aria-pressed", String(!isMentor));
    }
    if (switcherMentor) {
      switcherMentor.classList.toggle("is-active", isMentor);
      switcherMentor.setAttribute("aria-pressed", String(isMentor));
    }

    if (roleBadge) {
      var displayName = isMentor
        ? state.mentor.name || "Mentor Account"
        : state.client.name || "Client Account";
      roleBadge.textContent =
        (isMentor ? "Mentor Dashboard" : "Client Dashboard") + " • " + displayName;
    }

    var struggleBox = document.getElementById("client-struggle-panel");
    var learnBox = document.getElementById("client-learn-panel");
    var isLearn = state.client.intentType === "learn";

    if (struggleBox) struggleBox.classList.toggle("is-hidden", isLearn);
    if (learnBox) learnBox.classList.toggle("is-hidden", !isLearn);

    var struggleSummary = document.getElementById("client-struggle-active-summary");
    if (struggleSummary) {
      struggleSummary.textContent =
        "Current focus: I'm struggling with " + getActiveStruggleValue(state) + ".";
    }

    var learnSummary = document.getElementById("client-learn-active-summary");
    if (learnSummary) {
      learnSummary.textContent =
        "Current focus: I want to learn " + getActiveLearnValue(state) + ".";
    }

    var teacherPanel = document.getElementById("mentor-teacher-panel");
    var guidePanel = document.getElementById("mentor-guide-panel");
    var tabTeacher = document.getElementById("mentor-branch-teacher-btn");
    var tabGuide = document.getElementById("mentor-branch-guide-btn");
    var isGuideBranch = state.mentor.activeBranch === "guide";

    if (teacherPanel) teacherPanel.classList.toggle("is-hidden", isGuideBranch);
    if (guidePanel) guidePanel.classList.toggle("is-hidden", !isGuideBranch);

    if (tabTeacher) {
      tabTeacher.classList.toggle("is-active", !isGuideBranch);
      tabTeacher.setAttribute("aria-pressed", String(!isGuideBranch));
    }
    if (tabGuide) {
      tabGuide.classList.toggle("is-active", isGuideBranch);
      tabGuide.setAttribute("aria-pressed", String(isGuideBranch));
    }

    var teachPreview = document.getElementById("mentor-teach-summary");
    if (teachPreview) {
      var tList = state.mentor.teachTopics.slice();
      if ((state.mentor.teachCustomSkill || "").trim()) {
        tList.push(state.mentor.teachCustomSkill.trim());
      }
      teachPreview.textContent =
        "Teaching learners: " + (tList.length ? tList.join(", ") : "No skill selected yet");
    }

    var guidePreview = document.getElementById("mentor-guide-summary");
    if (guidePreview) {
      var gList = state.mentor.guideTopics.slice();
      if ((state.mentor.guideCustomStruggle || "").trim()) {
        gList.push(state.mentor.guideCustomStruggle.trim());
      }
      guidePreview.textContent =
        "Guiding habit struggles: " + (gList.length ? gList.join(", ") : "No struggle focus selected yet");
    }

    renderMatchedSuggestions(state);
  }

  function applyFilterForClient(state) {
    var searchInput = document.getElementById("guide-search-input");
    var topicSelect = document.getElementById("topic-filter-select");
    var isLearn = state.client.intentType === "learn";
    var chosenValue = isLearn ? getActiveLearnValue(state) : getActiveStruggleValue(state);

    if (searchInput) {
      searchInput.value = chosenValue;
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (topicSelect) {
      var matchedOption = false;
      for (var i = 0; i < topicSelect.options.length; i++) {
        if (topicSelect.options[i].value.toLowerCase() === chosenValue.toLowerCase()) {
          topicSelect.value = topicSelect.options[i].value;
          matchedOption = true;
          break;
        }
      }
      if (!matchedOption) topicSelect.value = "all";
      topicSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    renderMatchedSuggestions(state);
  }

  function bindRoleEvents() {
    var state = loadRoleState();
    syncFormsFromState(state);
    renderDashboards(state);

    var signupForm = document.getElementById("role-signup-form");
    if (signupForm) {
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var selectedRoleRadio = document.querySelector('input[name="signupAccountRole"]:checked');
        var role = selectedRoleRadio && selectedRoleRadio.value === "mentor" ? "mentor" : "client";
        var nameInput = document.getElementById("signup-display-name");
        var displayName = nameInput ? nameInput.value.trim().slice(0, 50) : "";

        state.signedUp = true;
        state.activeRole = role;
        if (role === "mentor") {
          state.mentor.name = displayName || "Mentor_" + Math.floor(100 + Math.random() * 900);
        } else {
          state.client.name = displayName || "Member_" + Math.floor(100 + Math.random() * 900);
        }

        saveRoleState(state);
        renderDashboards(state);

        var statusEl = document.getElementById("role-signup-status");
        if (statusEl) {
          statusEl.textContent =
            "Signed up as " +
            (role === "mentor" ? "Mentor" : "Client") +
            ". Showing " +
            (role === "mentor" ? "Mentor Dashboard." : "Client Dashboard.");
        }
      });
    }

    var btnClient = document.getElementById("switch-to-client-dash-btn");
    var btnMentor = document.getElementById("switch-to-mentor-dash-btn");

    if (btnClient) {
      btnClient.addEventListener("click", function () {
        state.activeRole = "client";
        saveRoleState(state);
        syncFormsFromState(state);
        renderDashboards(state);
      });
    }

    if (btnMentor) {
      btnMentor.addEventListener("click", function () {
        state.activeRole = "mentor";
        saveRoleState(state);
        syncFormsFromState(state);
        renderDashboards(state);
      });
    }

    document.querySelectorAll('input[name="clientIntentTrack"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        state.client.intentType = radio.value === "learn" ? "learn" : "struggle";
        saveRoleState(state);
        renderDashboards(state);
      });
    });

    var struggleSelect = document.getElementById("client-struggle-select");
    var struggleText = document.getElementById("client-struggle-text");
    if (struggleSelect) {
      struggleSelect.addEventListener("change", function () {
        state.client.struggleDropdown = struggleSelect.value;
        saveRoleState(state);
        renderDashboards(state);
      });
    }
    if (struggleText) {
      struggleText.addEventListener("input", function () {
        state.client.struggleCustomText = struggleText.value;
        saveRoleState(state);
        renderDashboards(state);
      });
    }

    var learnSelect = document.getElementById("client-learn-select");
    var learnText = document.getElementById("client-learn-text");
    if (learnSelect) {
      learnSelect.addEventListener("change", function () {
        state.client.learnDropdown = learnSelect.value;
        saveRoleState(state);
        renderDashboards(state);
      });
    }
    if (learnText) {
      learnText.addEventListener("input", function () {
        state.client.learnCustomText = learnText.value;
        saveRoleState(state);
        renderDashboards(state);
      });
    }

    var applyClientBtn = document.getElementById("client-apply-match-btn");
    if (applyClientBtn) {
      applyClientBtn.addEventListener("click", function () {
        applyFilterForClient(state);
      });
    }

    document.addEventListener("click", function (e) {
      var reqBtn = e.target.closest(".client-request-session-btn");
      if (reqBtn) {
        var gName = reqBtn.getAttribute("data-guide-name") || "";
        state.client.requestedGuide = gName;
        saveRoleState(state);
        renderMatchedSuggestions(state);
      }
    });

    var tabTeacher = document.getElementById("mentor-branch-teacher-btn");
    var tabGuide = document.getElementById("mentor-branch-guide-btn");
    if (tabTeacher) {
      tabTeacher.addEventListener("click", function () {
        state.mentor.activeBranch = "teacher";
        saveRoleState(state);
        renderDashboards(state);
      });
    }
    if (tabGuide) {
      tabGuide.addEventListener("click", function () {
        state.mentor.activeBranch = "guide";
        saveRoleState(state);
        renderDashboards(state);
      });
    }

    var mentorSaveBtn = document.getElementById("save-mentor-profile-btn");
    if (mentorSaveBtn) {
      mentorSaveBtn.addEventListener("click", function () {
        var teachSelected = [];
        document.querySelectorAll('input[name="mentorTeachTopic"]:checked').forEach(function (cb) {
          teachSelected.push(cb.value);
        });
        var guideSelected = [];
        document.querySelectorAll('input[name="mentorGuideTopic"]:checked').forEach(function (cb) {
          guideSelected.push(cb.value);
        });

        var teachCustom = document.getElementById("mentor-teach-custom");
        var guideCustom = document.getElementById("mentor-guide-custom");
        var mentorRate = document.getElementById("mentor-role-rate");
        var mentorPayout = document.getElementById("mentor-role-payout");

        state.mentor.teachTopics = teachSelected;
        state.mentor.teachCustomSkill = teachCustom ? teachCustom.value.trim() : "";
        state.mentor.guideTopics = guideSelected;
        state.mentor.guideCustomStruggle = guideCustom ? guideCustom.value.trim() : "";
        state.mentor.hourlyRateUSD =
          mentorRate && Number(mentorRate.value) >= 0 ? Number(mentorRate.value) : 0;
        state.mentor.payoutMethod =
          mentorPayout && mentorPayout.value === "PayPal" ? "PayPal" : "Bank Transfer";

        saveRoleState(state);
        renderDashboards(state);

        if (window.PeerToPeerCustomGuides && typeof window.PeerToPeerCustomGuides.getGuides === "function") {
          var existing = window.PeerToPeerCustomGuides.getGuides().filter(function (g) {
            return g.id !== "cg-mentor-role-listing";
          });
          var hostTitle = (state.mentor.name || "Mentor") + " (" +
            (state.mentor.activeBranch === "guide" ? "Habit Guide" : "Skill Mentor") + ")";
          var bioText =
            state.mentor.activeBranch === "guide"
              ? "Guides habit struggles: " +
                (state.mentor.guideTopics.concat(state.mentor.guideCustomStruggle ? [state.mentor.guideCustomStruggle] : []).join(", ") || "Habit accountability")
              : "Mentors learners in: " +
                (state.mentor.teachTopics.concat(state.mentor.teachCustomSkill ? [state.mentor.teachCustomSkill] : []).join(", ") || "Skill building");
          var primaryTopic =
            state.mentor.activeBranch === "guide"
              ? (state.mentor.guideTopics[0] || "Stress & Anxiety")
              : (state.mentor.teachTopics[0] || "Coding & Software");

          existing.unshift({
            id: "cg-mentor-role-listing",
            name: hostTitle.slice(0, 60),
            track: state.mentor.activeBranch === "guide" ? "breaking" : "learning",
            topic: primaryTopic,
            hourlyRateUSD: state.mentor.hourlyRateUSD,
            bio: bioText.slice(0, 220),
            modes: ["Chat", "Voice", "Video"],
            isAnonymousHost: false
          });
          window.PeerToPeerCustomGuides.saveGuides(existing);
          window.PeerToPeerCustomGuides.render();
        }

        var mStatus = document.getElementById("mentor-role-status");
        if (mStatus) {
          mStatus.textContent = "Saved Mentor & Guide settings.";
        }
      });
    }
  }

  window.PeerToPeerRoles = {
    getState: loadRoleState,
    saveState: saveRoleState,
    render: renderDashboards
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindRoleEvents);
  } else {
    bindRoleEvents();
  }
})();
