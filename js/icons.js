/* ================================================================
   ICONS.JS
   SVG-Icon-Bibliothek (Win95-Icon-Pack-Stil). Jeder Eintrag ist
   der innere SVG-Inhalt (viewBox 0 0 40 38), noch ohne <svg>-Tag.
   Wird global unter window.ICONS bereitgestellt, damit andere
   Skripte darauf zugreifen können, ohne Module/Bundler zu brauchen.
   ================================================================ */

const ICONS = {
  fuhrpark: `
    <rect x="1" y="17" width="15" height="10" rx="1" fill="#e8e4d8" stroke="#7a746a" stroke-width="1"/>
    <rect x="1" y="21" width="15" height="6" fill="#c8c4b8"/>
    <rect x="14" y="19" width="11" height="8" rx="1" fill="#3a5fc9" stroke="#1a2e78" stroke-width="1"/>
    <rect x="14" y="15" width="9" height="6" fill="#5578e0" stroke="#1a2e78" stroke-width="1"/>
    <rect x="16" y="16" width="5" height="4" fill="#cfe0ff"/>
    <rect x="9" y="8" width="24" height="16" rx="1" fill="#d0402e" stroke="#7a1c10" stroke-width="1"/>
    <rect x="9" y="18" width="24" height="6" fill="#a82c1c"/>
    <rect x="24" y="10" width="8" height="7" fill="#f0c8b0" stroke="#7a1c10" stroke-width="1"/>
    <rect x="26" y="11.5" width="4.5" height="3.5" fill="#cfe0ff"/>
    <rect x="4" y="27" width="32" height="3" fill="#2a2620"/>
    <circle cx="12" cy="31" r="4" fill="#2a2620"/><circle cx="12" cy="31" r="1.6" fill="#8a867c"/>
    <circle cx="29" cy="31" r="4" fill="#2a2620"/><circle cx="29" cy="31" r="1.6" fill="#8a867c"/>
  `,
  auftraege: `
    <rect x="6" y="4" width="26" height="33" rx="1" fill="#fbfaf5" stroke="#4a453e" stroke-width="1.2"/>
    <rect x="6" y="4" width="26" height="4" fill="#c8c4b8"/>
    <rect x="14" y="1" width="10" height="6" rx="1.5" fill="#8a867c" stroke="#4a453e" stroke-width="1"/>
    <rect x="10" y="13" width="18" height="3" fill="#3a5fc9"/>
    <rect x="10" y="19" width="18" height="3" fill="#8a867c"/>
    <rect x="10" y="25" width="12" height="3" fill="#8a867c"/>
    <path d="M10 31 l3 3 l6 -6" fill="none" stroke="#3a9a3a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  touren: `
    <path d="M4 8 L14 5 L14 30 L4 33 Z" fill="#e8e0c0" stroke="#8a7838" stroke-width="1"/>
    <path d="M14 5 L24 8 L24 33 L14 30 Z" fill="#d8cca0" stroke="#8a7838" stroke-width="1"/>
    <path d="M24 8 L34 5 L34 30 L24 33 Z" fill="#e8e0c0" stroke="#8a7838" stroke-width="1"/>
    <path d="M9 12 Q14 20 19 14 Q24 24 29 16" fill="none" stroke="#3a5fc9" stroke-width="1.4" stroke-dasharray="2 2"/>
    <path d="M27 2 C22 2 19 6 19 10 C19 15 27 24 27 24 C27 24 35 15 35 10 C35 6 32 2 27 2 Z" fill="#d0402e" stroke="#7a1c10" stroke-width="1"/>
    <circle cx="27" cy="10" r="3.4" fill="#fff5e8"/>
  `,
  personal: `
    <circle cx="12" cy="10" r="6" fill="#f0c8a0" stroke="#8a5a2c" stroke-width="1"/>
    <path d="M5 8 Q12 1 19 8 L18 10 Q12 5 6 10 Z" fill="#3a5fc9" stroke="#1a2e78" stroke-width="1"/>
    <path d="M2 33 Q2 20 12 20 Q22 20 22 33 Z" fill="#3a5fc9" stroke="#1a2e78" stroke-width="1"/>
    <circle cx="27" cy="12" r="6" fill="#e0b088" stroke="#7a4a20" stroke-width="1"/>
    <path d="M20 10 Q27 4 34 10 L33 12 Q27 7 21 12 Z" fill="#3a8a3a" stroke="#1a5a1a" stroke-width="1"/>
    <path d="M17 35 Q17 22 27 22 Q37 22 37 35 Z" fill="#3a8a3a" stroke="#1a5a1a" stroke-width="1"/>
  `,
  werkstatt: `
    <circle cx="10" cy="30" r="8" fill="#d0402e" opacity="0.18"/>
    <path d="M30 2 C25.5 2 22 5.6 22 10 C22 11.5 22.4 12.9 23.2 14.1 L8 29.3 C6.8 30.5 6.8 32.5 8 33.7 C9.2 34.9 11.2 34.9 12.4 33.7 L27.6 18.4 C28.8 19.2 30.2 19.6 31.7 19.6 C36.1 19.6 39.7 16 39.7 11.6 C39.7 10.2 39.3 8.9 38.7 7.8 L33.6 12.9 L29.4 12.3 L28.8 8.1 L33.9 3 C32.7 2.4 31.4 2 30 2 Z"
      fill="#a8a49a" stroke="#4a453e" stroke-width="1"/>
    <circle cx="10" cy="31.5" r="3.4" fill="#7a746a" stroke="#4a453e" stroke-width="1"/>
  `,
  kassenbuch: `
    <rect x="2" y="6" width="20" height="28" rx="2" fill="#8a867c" stroke="#4a453e" stroke-width="1"/>
    <rect x="4.5" y="9" width="15" height="7" rx="0.5" fill="#3a5c3a"/>
    <rect x="6" y="11" width="11" height="3" fill="#7ada7a"/>
    <rect x="5" y="18" width="4" height="4" fill="#d8d4c8"/><rect x="10.5" y="18" width="4" height="4" fill="#d8d4c8"/><rect x="16" y="18" width="4" height="4" fill="#e0a83c"/>
    <rect x="5" y="23" width="4" height="4" fill="#d8d4c8"/><rect x="10.5" y="23" width="4" height="4" fill="#d8d4c8"/><rect x="16" y="23" width="4" height="4" fill="#e0a83c"/>
    <rect x="5" y="28" width="4" height="4" fill="#d8d4c8"/><rect x="10.5" y="28" width="4" height="4" fill="#d8d4c8"/><rect x="16" y="28" width="4" height="4" fill="#c93a3a"/>
    <circle cx="30" cy="27" r="8" fill="#e6c14a" stroke="#8a6a10" stroke-width="1"/>
    <circle cx="30" cy="27" r="5.2" fill="#f0d878"/>
    <circle cx="25" cy="15" r="7" fill="#f0d878" stroke="#8a6a10" stroke-width="1"/>
  `,
  kunden: `
    <path d="M2 15 L15 15 L20 20 L15 25 L2 25 Z" fill="#2a2620" stroke="#000" stroke-width="1"/>
    <path d="M6 17 L14 17 L17 20 L14 23 L6 23 Z" fill="#f0c8a0"/>
    <path d="M38 15 L25 15 L20 20 L25 25 L38 25 Z" fill="#b8763a" stroke="#5a3a18" stroke-width="1"/>
    <path d="M34 17 L26 17 L23 20 L26 23 L34 23 Z" fill="#f0c8a0"/>
    <rect x="17" y="18" width="6" height="4" fill="#f0c8a0"/>
  `,
  statistik: `
    <rect x="3" y="20" width="8" height="15" fill="#d0402e" stroke="#7a1c10" stroke-width="1"/>
    <rect x="14" y="9" width="8" height="26" fill="#e0a83c" stroke="#8a6a10" stroke-width="1"/>
    <rect x="25" y="15" width="8" height="20" fill="#3a8a3a" stroke="#1a5a1a" stroke-width="1"/>
    <line x1="1" y1="36" x2="36" y2="36" stroke="#2a2620" stroke-width="1.4"/>
    <line x1="1" y1="4" x2="1" y2="36" stroke="#2a2620" stroke-width="1.4"/>
  `,
  nachrichten: `
    <rect x="2" y="9" width="34" height="24" rx="1" fill="#fbfaf5" stroke="#4a453e" stroke-width="1.2"/>
    <path d="M2 9 L19 22 L36 9" fill="none" stroke="#4a453e" stroke-width="1.4"/>
    <path d="M2 32 L15 20" stroke="#c8c4b8" stroke-width="1"/>
    <path d="M36 32 L23 20" stroke="#c8c4b8" stroke-width="1"/>
    <rect x="2" y="9" width="34" height="5" fill="#3a5fc9" opacity="0.15"/>
  `,
  niederlassungen: `
    <rect x="3" y="16" width="32" height="19" fill="#a8a49a" stroke="#4a453e" stroke-width="1"/>
    <rect x="3" y="16" width="32" height="4" fill="#8a867c"/>
    <rect x="7" y="6" width="5" height="12" fill="#7a746a" stroke="#4a453e" stroke-width="1"/>
    <rect x="16" y="1" width="5" height="17" fill="#7a746a" stroke="#4a453e" stroke-width="1"/>
    <rect x="26" y="9" width="5" height="9" fill="#7a746a" stroke="#4a453e" stroke-width="1"/>
    <rect x="6.5" y="22" width="5" height="5" fill="#8fc4e8" stroke="#2a5878" stroke-width="0.8"/>
    <rect x="14.5" y="22" width="5" height="5" fill="#8fc4e8" stroke="#2a5878" stroke-width="0.8"/>
    <rect x="22.5" y="22" width="5" height="5" fill="#e0a83c" stroke="#8a6a10" stroke-width="0.8"/>
    <rect x="16" y="28" width="7" height="7" fill="#4a453e"/>
  `,
  kartenuebersicht: `
    <circle cx="18" cy="18" r="16" fill="#3a6fc9" stroke="#1a3878" stroke-width="1.2"/>
    <path d="M6 12 Q12 8 18 11 T30 10 Q26 16 30 22 Q20 20 15 27 Q8 22 6 14 Z" fill="#3a9a3a" stroke="#1a5a1a" stroke-width="0.6"/>
    <ellipse cx="18" cy="18" rx="16" ry="6" fill="none" stroke="#e8f0ff" stroke-width="0.8" opacity="0.55"/>
    <ellipse cx="18" cy="18" rx="6" ry="16" fill="none" stroke="#e8f0ff" stroke-width="0.8" opacity="0.55"/>
    <circle cx="13" cy="12" r="3" fill="#ffffff" opacity="0.25"/>
  `,
  einstellungen: `
    <path d="M18 3 L21.5 3 L22.6 8 L26.4 9.6 L30.8 6.8 L33.2 9.2 L30.4 13.6 L32 17.4 L37 18.5 L37 22 L32 23.1 L30.4 26.9 L33.2 31.3 L30.8 33.7 L26.4 30.9 L22.6 32.5 L21.5 37.5 L18 37.5 L16.9 32.5 L13.1 30.9 L8.7 33.7 L6.3 31.3 L9.1 26.9 L7.5 23.1 L2.5 22 L2.5 18.5 L7.5 17.4 L9.1 13.6 L6.3 9.2 L8.7 6.8 L13.1 9.6 L16.9 8 Z"
      fill="#a8a49a" stroke="#4a453e" stroke-width="1"/>
    <circle cx="19.75" cy="20" r="7.4" fill="#8a867c" stroke="#4a453e" stroke-width="1"/>
    <circle cx="19.75" cy="20" r="3.4" fill="#d8d4c8"/>
  `
};
