import { render } from "preact";
import { App } from "./app";
import "./styles/win311.css";

const root = document.getElementById("app");
if (!root) throw new Error("Wurzelelement #app fehlt.");
render(<App />, root);
