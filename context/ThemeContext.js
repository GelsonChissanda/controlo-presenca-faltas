import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "nativewind";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setColorScheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const proximo = theme === "dark" ? "light" : "dark";
    setTheme(proximo);
    setColorScheme(proximo);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}