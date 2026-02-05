import React, { StrictMode, useRef, useEffect } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null,
    React.createElement(InteractiveSnowfall, null)));
const SnowflakePatternMap = {
    Dot: 0,
    Branches: 1,
    Spearheads: 2,
    Asterisk: 3
};
function InteractiveSnowfall() {
    const canvasRef = useRef(null);
    const cursor = useRef({ radius: 60 });
    const frameRef = useRef(0);
    const snowflakes = useRef([]);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext("2d");
        if (!canvas || !ctx)
            return;
        const sprites = [];
        for (let s = 0; s <= 3; ++s) {
            sprites.push(new SnowflakeSprite(s));
        }
        const animate = () => {
            const { width, height } = getCanvas();
            ctx.clearRect(0, 0, width, height);
            ctx.globalAlpha = 0.8;
            snowflakes.current.forEach((flake) => {
                flake.update(cursor.current, width, height);
                flake.draw(ctx);
            });
            frameRef.current = requestAnimationFrame(animate);
        };
        const createSnowflakes = () => {
            // keep the snowflake count proportional to the canvas area保持雪花数量与画布成比例
            const { width, height } = getCanvas();
            const snowflakesMin = Math.round(width * height / 800);
            const snowflakesMax = 1000;//雪花的数量
            const snowflakeCount = Math.min(snowflakesMin, snowflakesMax);
            const radiusMin = 4;
            const radiusMax = 10;//雪花的大小
            snowflakes.current = [];
            for (let i = 0; i < snowflakeCount; i++) {
                const radius = Utils.random(radiusMin, radiusMax);
                const pattern = Math.round(Utils.random(0, 3));
                const snowflake = new Snowflake(width, height, radius, sprites[pattern].canvas);
                snowflakes.current.push(snowflake);
            }
        };
        const getCanvas = () => {
            const { devicePixelRatio } = window;
            const width = canvas.width / devicePixelRatio;
            const height = canvas.height / devicePixelRatio;
            return { width, height };
        };
        const handleDown = (e) => {
            const event = e;
            cursor.current.x = event.clientX;
            cursor.current.y = event.clientY;
        };
        const handleUp = () => {
            const radius = cursor.current.radius;
            cursor.current.x = -radius;
            cursor.current.y = -radius;
        };
        const resize = () => {
            const { devicePixelRatio, innerWidth, innerHeight } = window;
            canvas.width = innerWidth * devicePixelRatio;
            canvas.height = innerHeight * devicePixelRatio;
            canvas.style.width = innerWidth + "px";
            canvas.style.height = innerHeight + "px";
            ctx.scale(devicePixelRatio, devicePixelRatio);
            createSnowflakes();
        };
        resize();
        animate();
        window.addEventListener("resize", resize);
        const eventMap = {
            pointerdown: handleDown,
            pointermove: handleDown,
            pointerout: handleUp,
            pointerup: handleUp
        };
        const eventMapEntries = Object.entries(eventMap);
        eventMapEntries.forEach(([event, handler]) => {
            canvas.addEventListener(event, handler);
        });
        return () => {
            window.removeEventListener("resize", resize);
            eventMapEntries.forEach(([event, handler]) => {
                canvas.removeEventListener(event, handler);
            });
            cancelAnimationFrame(frameRef.current);
        };
    }, []);
    return (React.createElement("canvas", { ref: canvasRef, "aria-label": "Snow falling and a small cursor-controlled area pushing the snowflakes" }));
}
class Snowflake {
    /**
     * @param width canvas width
     * @param height canvas height
     * @param radius snowflake radius
     * @param pattern snowflake pattern
     */
    constructor(width, height, radius, pattern) {
        /** Angle of the snowflake */
        this.rotation = Utils.random(0, Math.PI);
        /** Weight for the push effect */
        this.density = 50;
        /** How fast the snowflake rotates clockwise or counterclockwise */
        this.rotationSpeed = Utils.random(-0.02, 0.02);
        /** Horizontal speed */
        this.speedX = Utils.random(-0.5, 0.5);
        /** Vertical speed */
        this.speedY = Utils.random(1, 0.5);
        this.x = Utils.random(0, width);
        this.y = Utils.random(0, height);
        this.radius = radius;
        this.pattern = pattern;
    }
    /**
     * Draw the snowflake
     * @param ctx canvas context
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.pattern, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
    /**
     * Move the snowflake
     * @param cursor cursor object
     * @param width canvas width
     * @param height canvas height
     */
    update(cursor, width, height) {
        var _a, _b;
        // movement
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        this.rotation %= 2 * Math.PI;
        const dx = ((_a = cursor.x) !== null && _a !== void 0 ? _a : -cursor.radius) - this.x;
        const dy = ((_b = cursor.y) !== null && _b !== void 0 ? _b : -cursor.radius) - this.y;
        const distance = Math.hypot(dx, dy);
        if (distance < cursor.radius) {
            // apply cursor repulsion force when in range
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (cursor.radius - distance) / cursor.radius;
            const directionX = forceDirectionX * force * this.density;
            const directionY = forceDirectionY * force * this.density;
            this.x -= directionX;
            this.y -= directionY;
        }
        const outsideLeft = this.x < -cursor.radius;
        const outsideRight = this.x > width + cursor.radius;
        const outsideBottom = this.y > height + cursor.radius;
        if (outsideLeft || outsideRight || outsideBottom) {
            // reset when outside the canvas
            this.x = Utils.random(0, width);
            this.y = -this.radius;
        }
    }
}
class SnowflakeSprite {
    constructor(patternIndex) {
        this.lineWidth = 1;
        this.radius = 10;
        // set up the sprite canvas
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.patternType = patternIndex;
        const { devicePixelRatio } = window;
        const size = this.radius * 2 * devicePixelRatio;
        this.canvas.width = size;
        this.canvas.height = size;
        if (this.ctx) {
            // prepare styles for drawing
            const color = "hsl(0, 0%, 100%)";
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
            this.drawPattern();
        }
    }
    drawPattern() {
        var _a, _b, _c, _d;
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.save();
        (_b = this.ctx) === null || _b === void 0 ? void 0 : _b.translate(this.radius, this.radius);
        if (this.patternType === SnowflakePatternMap.Dot) {
            this.drawDot();
            return;
        }
        // other patterns will have rotated sectors
        const sectors = 6;
        for (let i = 0; i < sectors; i++) {
            (_c = this.ctx) === null || _c === void 0 ? void 0 : _c.rotate(Math.PI / (sectors / 2));
            switch (this.patternType) {
                case SnowflakePatternMap.Branches:
                    this.drawBranch();
                    break;
                case SnowflakePatternMap.Spearheads:
                    this.drawSpearhead();
                    break;
                default:
                    // SnowflakePatternMap.Asterisk
                    this.drawAsteriskStroke();
            }
        }
        (_d = this.ctx) === null || _d === void 0 ? void 0 : _d.restore();
    }
    drawAsteriskStroke() {
        var _a, _b, _c, _d, _e;
        const adjustedRadius = this.radius - 1;
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.beginPath();
        (_b = this.ctx) === null || _b === void 0 ? void 0 : _b.moveTo(0, 0);
        (_c = this.ctx) === null || _c === void 0 ? void 0 : _c.lineTo(0, adjustedRadius);
        (_d = this.ctx) === null || _d === void 0 ? void 0 : _d.closePath();
        (_e = this.ctx) === null || _e === void 0 ? void 0 : _e.stroke();
    }
    drawBranch() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const adjustedRadius = this.radius - 0.5;
        const spurPos = -adjustedRadius * 0.5;
        const spurLength = adjustedRadius * 0.35;
        // main branch
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.beginPath();
        (_b = this.ctx) === null || _b === void 0 ? void 0 : _b.moveTo(0, 0);
        (_c = this.ctx) === null || _c === void 0 ? void 0 : _c.lineTo(0, -adjustedRadius);
        // side branches
        (_d = this.ctx) === null || _d === void 0 ? void 0 : _d.moveTo(0, spurPos);
        (_e = this.ctx) === null || _e === void 0 ? void 0 : _e.lineTo(-spurLength, spurPos - spurLength);
        (_f = this.ctx) === null || _f === void 0 ? void 0 : _f.moveTo(0, spurPos);
        (_g = this.ctx) === null || _g === void 0 ? void 0 : _g.lineTo(spurLength, spurPos - spurLength);
        (_h = this.ctx) === null || _h === void 0 ? void 0 : _h.closePath();
        (_j = this.ctx) === null || _j === void 0 ? void 0 : _j.stroke();
    }
    drawDot() {
        var _a, _b, _c, _d;
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.beginPath();
        (_b = this.ctx) === null || _b === void 0 ? void 0 : _b.arc(0, 0, this.radius / 2, 0, Math.PI * 2);
        (_c = this.ctx) === null || _c === void 0 ? void 0 : _c.closePath();
        (_d = this.ctx) === null || _d === void 0 ? void 0 : _d.fill();
    }
    drawSpearhead() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const adjustedRadius = this.radius - 0.5;
        const headStart = -adjustedRadius * 0.6;
        const headEnd = -adjustedRadius;
        const headWidth = adjustedRadius * 0.2;
        // main “shaft” of the spear
        (_a = this.ctx) === null || _a === void 0 ? void 0 : _a.beginPath();
        (_b = this.ctx) === null || _b === void 0 ? void 0 : _b.moveTo(0, 0);
        (_c = this.ctx) === null || _c === void 0 ? void 0 : _c.lineTo(0, -adjustedRadius * 0.5);
        // tip
        (_d = this.ctx) === null || _d === void 0 ? void 0 : _d.moveTo(0, headEnd);
        // left corner
        (_e = this.ctx) === null || _e === void 0 ? void 0 : _e.lineTo(-headWidth, headStart);
        // bottom notch
        (_f = this.ctx) === null || _f === void 0 ? void 0 : _f.lineTo(0, headStart + (adjustedRadius * 0.1));
        // right corner
        (_g = this.ctx) === null || _g === void 0 ? void 0 : _g.lineTo(headWidth, headStart);
        // finish
        (_h = this.ctx) === null || _h === void 0 ? void 0 : _h.closePath();
        (_j = this.ctx) === null || _j === void 0 ? void 0 : _j.stroke();
        (_k = this.ctx) === null || _k === void 0 ? void 0 : _k.fill();
    }
}
class Utils {
    static random(min = 0, max = 1) {
        const value = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
        return min + (value * (max - min));
    }
}