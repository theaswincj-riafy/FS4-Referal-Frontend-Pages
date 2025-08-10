// Color combinations for task cards and other UI elements
const COLOR_COMBOS = [
  {
    gradientBG: ["#FAD0C4", "#FAD0C4"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#A7D1AB", "#A7D1AB"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#B2EBF2", "#B2EBF2"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#FFD54F", "#FFD54F"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#E1BEE7", "#E1BEE7"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#CE93D8", "#CE93D8"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#81D4FA", "#81D4FA"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#E9D8A6", "#C6B38E"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#FFD700", "#FFA500"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#FFD700", "#FFA500"],
    textColor: "#000000",
  },
  {
    gradientBG: ["#90CAF9", "#42A5F5"],
    textColor: "#000000",
  },
  {
    gradientBG: ["#FCE38A", "#F38184"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#45B649", "#DBD5A4"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#64B5F6", "#E3F2FD"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#4DB6AC", "#80CBC4"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#FFECB3", "#FFECB3"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#FFAB91", "#FFAB91"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#fceabb", "#f8b500"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#ff9a9e", "#fad0c4"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#84fab0", "#8fd3f4"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#fbc2eb", "#a6c1ee"],
    textColor: "#333333",
  },
  {
    gradientBG: ["#c6ffdd", "#fbd786"],
    textColor: "#333333",
  },
];

// Function to get a random color combination
function getRandomColorCombo() {
  const randomIndex = Math.floor(Math.random() * COLOR_COMBOS.length);
  return COLOR_COMBOS[randomIndex];
}

// Function to get a color combination by index (useful for consistent colors)
function getColorComboByIndex(index) {
  return COLOR_COMBOS[index % COLOR_COMBOS.length];
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { COLOR_COMBOS, getRandomColorCombo, getColorComboByIndex };
}