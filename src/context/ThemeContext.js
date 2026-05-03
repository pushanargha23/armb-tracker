import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("armb-theme") === "dark");

  const toggle = () => setIsDark(d => {
    const next = !d;
    localStorage.setItem("armb-theme", next ? "dark" : "light");
    return next;
  });

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
