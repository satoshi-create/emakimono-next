import { createContext } from "react";

/** Shared app shell state — import from here, not from _app.js (avoids circular deps). */
export const AppContext = createContext(null);
