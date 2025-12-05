import React from "react";

const DarkModeToggle = ({ toggleDarkMode, isDarkMode }) => {
  return (
    <button className="dark-mode-toggle" onClick={toggleDarkMode}>
      <span className="icon">{isDarkMode ? "🌙" : "☀️"}</span>
    </button>
  );
};

export default DarkModeToggle;
