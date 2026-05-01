const { JSDOM } = require("jsdom");

const html = `
<!DOCTYPE html>
<html>
<body>
<canvas id="c"></canvas>
<script>
    window.addEventListener("message", (e) => {
        if (e.data.type === "START") {
            const ctx = document.getElementById("c").getContext("2d");
            setTimeout(() => {
                parent.postMessage({ type: "GAME_RESULT", win: true }, "*");
            }, 100);
        }
    });
</script>
</body>
</html>
`;

async function test() {
    const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
    
    // Polyfill canvas context 2d so it doesn't crash if the AI uses canvas
    const canvasEl = dom.window.document.createElement("canvas");
    if (!canvasEl.getContext) {
        dom.window.HTMLCanvasElement.prototype.getContext = function () {
            return {
                fillRect: () => {},
                clearRect: () => {},
                getImageData: () => ({ data: [] }),
                putImageData: () => {},
                createImageData: () => ({}),
                setTransform: () => {},
                drawImage: () => {},
                save: () => {},
                fillText: () => {},
                restore: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                closePath: () => {},
                stroke: () => {},
                translate: () => {},
                scale: () => {},
                rotate: () => {},
                arc: () => {},
                fill: () => {},
                measureText: () => ({ width: 0 }),
                transform: () => {},
                rect: () => {},
                clip: () => {},
            };
        };
    }

    let result = null;
    dom.window.parent = {
        postMessage: (msg) => {
            console.log("Parent got msg:", msg);
            if (msg.type === "GAME_RESULT") {
                result = msg;
            }
        }
    };

    dom.window.postMessage({ type: "START" }, "*");
    
    await new Promise(r => setTimeout(r, 500));
    console.log("Result received:", result);
    dom.window.close();
}

test();
