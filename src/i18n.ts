import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "hero_title": "Win the Game with AI Intelligence",
      "hero_subtitle": "The ultimate basketball scorekeeper and tactical analysis platform.",
      "start_free": "Start for Free",
      "upgrade_pro": "Upgrade to Pro",
      "scorekeeper": "Scorekeeper",
      "stats": "Stats",
      "ai_analyst": "AI Analyst",
      "pricing": "Pricing",
      "features": "Features",
      "login": "Login",
      "logout": "Logout",
      "language": "Language",
      "free_plan": "Free Plan",
      "pro_plan": "Pro Plan",
      "regional_pricing_notice": "Pricing adjusted for your region.",
      "live_scoring": "Live Scoring",
      "tactical_insights": "Tactical Insights",
      "advanced_stats": "Advanced Stats",
      "support_agent": "Support Agent",
      "how_to_register": "How to register a match?",
      "how_to_export": "How to export stats?",
      "how_to_roster": "How to create a roster?",
      "how_to_upgrade": "How to upgrade to Pro?",
      "dashboard": "Dashboard",
      "filter": "Filter",
      "search": "Search",
      "no_matches": "No matches found",
      "start_recording": "Start Recording",
      "play_by_play": "Play-by-Play Feed",
      "export_json": "Export JSON",
      "export_csv": "Export CSV",
      "select_player": "Select a player to record an action",
      "quarter": "Quarter",
      "time": "Time",
      "team": "Team",
      "player": "Player",
      "type": "Type"
    }
  },
  es: {
    translation: {
      "hero_title": "Gana el Juego con Inteligencia Artificial",
      "hero_subtitle": "La plataforma definitiva de anotación y análisis táctico de baloncesto.",
      "start_free": "Comienza Gratis",
      "upgrade_pro": "Mejorar a Pro",
      "scorekeeper": "Anotador",
      "stats": "Estadísticas",
      "ai_analyst": "Analista IA",
      "pricing": "Precios",
      "features": "Características",
      "login": "Iniciar Sesión",
      "logout": "Cerrar Sesión",
      "language": "Idioma",
      "free_plan": "Plan Gratis",
      "pro_plan": "Plan Pro",
      "regional_pricing_notice": "Precio ajustado para tu región.",
      "live_scoring": "Anotación en Vivo",
      "tactical_insights": "Insights Tácticos",
      "advanced_stats": "Estadísticas Avanzadas",
      "support_agent": "Agente de Soporte",
      "how_to_register": "¿Cómo registrar un partido?",
      "how_to_export": "¿Cómo exportar estadísticas?",
      "how_to_roster": "¿Cómo crear un roster?",
      "how_to_upgrade": "¿Cómo mejorar a Pro?",
      "dashboard": "Panel",
      "filter": "Filtrar",
      "search": "Buscar",
      "no_matches": "No se encontraron partidos",
      "start_recording": "Iniciar Grabación",
      "play_by_play": "Feed Jugada a Jugada",
      "export_json": "Exportar JSON",
      "export_csv": "Exportar CSV",
      "select_player": "Selecciona un jugador para registrar una acción",
      "quarter": "Cuarto",
      "time": "Tiempo",
      "team": "Equipo",
      "player": "Jugador",
      "type": "Tipo"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
