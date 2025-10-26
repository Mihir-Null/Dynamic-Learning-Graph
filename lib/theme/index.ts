import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00e5ff",
      light: "#66ffff",
      dark: "#00b0ff"
    },
    secondary: {
      main: "#ff4081",
      light: "#ff79b0",
      dark: "#c60055"
    },
    info: {
      main: "#7c4dff",
      light: "#b47cff",
      dark: "#3f1dcb"
    },
    success: {
      main: "#69f0ae",
      light: "#9affd5",
      dark: "#2bbf7b"
    },
    warning: {
      main: "#ffd740",
      light: "#ffff74",
      dark: "#c8a600"
    },
    error: {
      main: "#ff6e6e",
      light: "#ffa4a4",
      dark: "#c53b3b"
    },
    background: {
      default: "#050505",
      paper: "rgba(18, 18, 18, 0.92)"
    },
    text: {
      primary: "#f5f5f5",
      secondary: "rgba(255,255,255,0.66)"
    },
    divider: "rgba(255,255,255,0.1)"
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: "'Roboto', 'Inter', 'Helvetica Neue', Arial, sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at 20% 20%, rgba(124, 77, 255, 0.25), transparent 55%), radial-gradient(circle at 80% 0%, rgba(0, 229, 255, 0.28), transparent 45%), radial-gradient(circle at 10% 100%, rgba(255, 64, 129, 0.22), transparent 46%), #050505",
          color: "#f5f5f5"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(135deg, rgba(12, 12, 12, 0.92) 0%, rgba(28, 28, 36, 0.92) 50%, rgba(20, 20, 20, 0.9) 100%)",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.02)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(160deg, rgba(18, 18, 18, 0.92) 0%, rgba(35, 35, 45, 0.92) 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 16px 38px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.02)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          fontWeight: 600,
          letterSpacing: 0.2
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backdropFilter: "blur(12px)"
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          borderColor: "rgba(255,255,255,0.2)",
          "&.Mui-selected": {
            background:
              "linear-gradient(135deg, rgba(0, 229, 255, 0.25) 0%, rgba(255, 64, 129, 0.25) 100%)",
            color: "#ffffff"
          }
        }
      }
    }
  }
});

export default theme;
