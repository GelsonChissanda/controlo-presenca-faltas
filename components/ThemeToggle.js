import { TouchableOpacity } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#1F2937" : "#E2E8F0",
      }}
    >
      {isDark ? <Moon size={16} color="#22D3EE" /> : <Sun size={16} color="#D97706" />}
    </TouchableOpacity>
  );
}