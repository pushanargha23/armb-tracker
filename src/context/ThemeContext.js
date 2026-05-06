import { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const ThemeContext = createContext();

const DEFAULTS = {
  dark:  { bg: "#000000", border: "rgba(255,241,158,0.35)", text: "#FFF19E" },
  light: { bg: "#FFFFFF", border: "rgba(102,20,20,0.28)",   text: "#000000" },
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("armb-theme") === "dark");
  const [customColors, setCustomColors] = useState(DEFAULTS);

  // Listen to Firestore for theme changes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "theme"), (snap) => {
      if (snap.exists()) {
        setCustomColors(snap.data().colors || DEFAULTS);
      }
    }, () => {
      // On error (e.g., doc doesn't exist), use defaults
      setCustomColors(DEFAULTS);
    });
    return unsub;
  }, []);

  const toggle = () => setIsDark(d => {
    const next = !d;
    localStorage.setItem("armb-theme", next ? "dark" : "light");
    return next;
  });

  const updateColor = async (mode, key, value) => {
    const next = { ...customColors, [mode]: { ...customColors[mode], [key]: value } };
    setCustomColors(next);
    await setDoc(doc(db, "settings", "theme"), { colors: next });
  };

  const resetColors = async () => {
    setCustomColors(DEFAULTS);
    await setDoc(doc(db, "settings", "theme"), { colors: DEFAULTS });
  };

  const C = isDark ? customColors.dark : customColors.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, customColors, updateColor, resetColors, C }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
