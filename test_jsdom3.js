const { JSDOM } = require("jsdom");

const html = `
<!DOCTYPE html>
<html>
<body>
<canvas id="c"></canvas>
<script>
    const ctx = document.getElementById("c").getContext("2d");
    if (ctx) {
        ctx.fillRect(0,0,10,10);
        console.log("Canvas filled successfully");
    } else {
        console.log("getContext returned null");
    }
</script>
</body>
</html>
`;

const jsdom = require("jsdom");
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("log", (msg) => { console.log(msg); });

const dom = new JSDOM(html, { 
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
        window.HTMLCanvasElement.prototype.getContext = function () {
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
});
