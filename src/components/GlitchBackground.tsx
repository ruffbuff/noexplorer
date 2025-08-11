import React from "react";
import { useTheme } from "next-themes";
import LetterGlitch from "./LetterGlitch";

const GlitchBackground = () => {
  const { theme } = useTheme();

  // Адаптивные цвета в зависимости от темы
  const getThemeColors = () => {
    if (theme === 'light') {
      return ["#333333", "#2d7d32", "#1976d2"]; // Темные цвета для светлой темы
    }
    return ["#7B7481", "#61dca3", "#61b3dc"]; // Светлые цвета для темной темы
  };

  try {
    return (
      <div 
        className="w-full h-full"
        style={{
          opacity: 1,
        }}
      >
        <LetterGlitch
          glitchColors={getThemeColors()}
          glitchSpeed={120}
          centerVignette={false}
          outerVignette={false}
          smooth={true}
        />
      </div>
    );
  } catch (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
      }}>
        {/* Fallback for glitch background */}
      </div>
    );
  }
};

export default GlitchBackground;