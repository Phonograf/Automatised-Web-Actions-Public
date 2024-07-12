import { selfLaunch } from "./index.js";

console.log("Launching in the manual mode...");
let param = `${process.argv[2]} ${process.argv[3]}`
selfLaunch(param);