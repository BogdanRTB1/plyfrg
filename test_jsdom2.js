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

const virtualConsole = new (require("jsdom").VirtualConsole)();
virtualConsole.sendTo(console, { omitJSDOMErrors: true });

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
