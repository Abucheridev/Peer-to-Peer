(function () {
  "use strict";

  var DEFAULT_GUIDES = [
    {
      id: "g-1",
      name: "Quiet Harbor Circle",
      track: "breaking",
      topic: "Porn & Compulsive Habits",
      hourlyRateUSD: 0,
      bio: "Confidential peer check-ins focused on late-night trigger awareness and calm evening routines.",
      modes: ["Chat", "Voice"],
      isAnonymousHost: true
    },
    {
      id: "g-2",
      name: "Steady Craft Mentor",
      track: "learning",
      topic: "Coding & Software",
      hourlyRateUSD: 15,
      bio: "Practical beginner-to-project guidance in HTML, CSS, and JavaScript with clear weekly milestones.",
      modes: ["Chat", "Voice", "Video"],
      isAnonymousHost: false
    }
  ];

  var grid = document.getElementById("guides-grid");
  if (grid) {
    grid.innerHTML = DEFAULT_GUIDES.map(function (g) {
      return (
        '<article class="guide-card">' +
        "<h3>" + g.name + "</h3>" +
        "<p>" + g.bio + "</p>" +
        "<span>" + (g.hourlyRateUSD === 0 ? "Free Peer" : "$" + g.hourlyRateUSD + "/hr") + "</span>" +
        "</article>"
      );
    }).join("");
  }
})();
