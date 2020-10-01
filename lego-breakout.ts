
enum ButtonEvent {
    Pressed,
    Released
}enum BeatFraction {
    Quarter
}
{
var brick = {
    buttonRight: {onEvent(...args) {}},
    buttonLeft: {onEvent(...args) {}},
    clearScreen() {},
    showString(...args) {},
};

var music = {
    playSoundEffectUntilDone(...args) {},
    beat(...args) {},
    playTone(...args) {}
};

var sounds = {
    informationErrorAlarm: 1
}

var control = {
    timer1: {
        reset() {},
        millis() { return 0; }
    },
    waitMicros(...args) {}
}

class Screen {
    fillRect(...args) {}
}
}







const WIDTH = 178;  // 0 - 177
const HEIGHT = 128; // 0 - 127

class Vector {
    public x: number;
    public y: number;
    constructor(x: number, y: number) { this.x = x; this.y = y; }
    add(v1: Vector): Vector { return new Vector(this.x + v1.x, this.y + v1.y); }
    sub(v1: Vector): Vector { return new Vector(v1.x - this.x, v1.y - this.y); }
    product(v1: Vector): Vector { return new Vector(this.x * v1.x, this.y * v1.y); }
    plus(n1: number): void { if(this.x < 0) this.x -= n1; else this.x += n1; if(this.y < 0) this.y -= n1; else this.y += n1; }
    times(n1: number): void { this.x *= n1; this.y *= n1; }
    normal(direction: boolean) { return (direction ? new Vector(-this.y, this.x) : new Vector(this.y, -this.x)); }
    get abs(): number { return (this.x ** 2 + this.y ** 2) ** (1 / 2); }
}
class GameObject {
    public pos: Vector;
    public readonly size: Vector;
    public tone: number;
    constructor(pos: Vector, size: Vector) {
        this.pos = pos;
        this.size = size;
    }
    get left() { return this.pos.x; }
    get right() { return this.pos.x + this.size.x; }
    get top() { return this.pos.y; }
    get bottom() { return this.pos.y + this.size.y; }

    collide() {
        music.playTone(this.tone, music.beat(BeatFraction.Quarter));
    }
}
class Box extends GameObject {
    constructor(pos: Vector) {
        super(pos, new Vector(44, 15));
        this.tone = 1046;
    }
    draw() {
        screen.fillRect(this.pos.x + 1, this.pos.y + 1, this.size.x - 2, this.size.y - 2, 1);
    }
}
class MovingObject extends GameObject {
    public speed: Vector;
    constructor(pos: Vector, size: Vector, speed: Vector) {
        super(pos, size);
        this.speed = speed;
    }
    tick(dt: number) {
        screen.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y, 1);
    }
}
class Paddle extends MovingObject {
    constructor() {
        super(new Vector(WIDTH / 2 - 20, HEIGHT - 7), new Vector(40, 5), new Vector(0, 0));
        this.tone = 262;
    }
    tick(dt: number) {
        this.pos.x += this.speed.x * dt;
        this.speed.x = (right ? 40 : 0) + (left ? -40 : 0);
        if(0 > this.left) this.pos.x = 0;
        if(WIDTH < this.right) this.pos.x = WIDTH - this.size.x;
        super.tick(dt);
    }
}
class Ball extends MovingObject {
    public outOfMap: boolean;
    public r: number;
    constructor() {
        super(new Vector(86, 110), new Vector(8, 8), new Vector(20, -20));
        this.tone = 523;
        this.r = 4;
    }

    tick(dt: number) {
        this.pos.x += this.speed.x * dt;
        this.pos.y += this.speed.y * dt;
        
        screen.fillRect(this.pos.x + 3, this.pos.y, 2, 8, 1);
        screen.fillRect(this.pos.x, this.pos.y + 3, 8, 2, 1);
        screen.fillRect(this.pos.x + 1, this.pos.y + 1, 6, 6, 1);

        LEVEL.boxes.forEach(box => {
            if(this.isColliding(box)) {
                // if(this.top < box.bottom && this.right < box.right)
                box.collide();
                this.speed.y = -this.speed.y;
                LEVEL.spliceBox(box);
            }
        });

        if(this.isColliding(LEVEL.paddle)) {
            LEVEL.paddle.collide();
            this.speed.y = -this.speed.y;
        }

        if (WIDTH < this.right) {
            this.speed.x = -this.speed.x;
            this.collide();
        }
        if (0 > this.left) {
            this.speed.x = -this.speed.x;
            this.collide();
        }
        if (0 > this.top) {
            this.speed.y = -this.speed.y;
            this.collide();
        }
        if (HEIGHT < this.top) { game = false; }
    }

    isColliding(rect: GameObject){
        let distX = Math.abs(this.pos.x + 4 - rect.pos.x-rect.size.x/2);
        let distY = Math.abs(this.pos.y + 4 - rect.pos.y-rect.size.y/2);
    
        if (distX > (rect.size.x/2 + this.r)) { return false; }
        if (distY > (rect.size.y/2 + this.r)) { return false; }
    
        if (distX <= (rect.size.x/2)) { return true; } 
        if (distY <= (rect.size.y/2)) { return true; }
    
        let dx=distX-rect.size.x/2;
        let dy=distY-rect.size.y/2;
        return (dx*dx+dy*dy<=(this.r*this.r));
    }
}
class Level {
    public boxes: Array<Box>;
    public ball: Ball;
    public paddle: Paddle;
    public score: number;
    constructor() {
        this.boxes = [];
        this.score = 0;
        this.paddle = new Paddle();
        this.ball = new Ball();
        this.initBoxes();
    }

    tick(dt: number) {
        this.paddle.tick(dt);
        this.ball.tick(dt);
        this.boxes.forEach(element => (element.draw()));
    }

    spliceBox(box: Box) {
        this.score++;
        for(let i = 0; i < this.boxes.length; i++) {
            if(this.boxes[i] === box) {
                this.boxes.splice(i, 1);
                break;
            }
        }
        if (this.boxes.length === 0) {
            this.ball.speed.plus(5);
            this.initBoxes();
        }
    }

    initBoxes() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                this.boxes.push(new Box(new Vector(j * 44, i * 15)));
            }
        }
    }
}

let game: boolean = true;
let left: boolean;
let right: boolean;
brick.buttonRight.onEvent(ButtonEvent.Pressed, () => (right = true));
brick.buttonRight.onEvent(ButtonEvent.Released, () => (right = false));
brick.buttonLeft.onEvent(ButtonEvent.Pressed, () => (left = true));
brick.buttonLeft.onEvent(ButtonEvent.Released, () => (left = false));

const LEVEL = new Level();
function update(dt: number) {
    if (dt > 50) dt = 50;
    brick.clearScreen();
    LEVEL.tick(dt);
}
control.timer1.reset();
let prevTime = 0;
let thisTime = 0;
function main() {
    while (game) {
        control.waitMicros(10000);
        prevTime = thisTime;
        thisTime = control.timer1.millis();
        update((thisTime - prevTime)/1000);
    }
    music.playSoundEffectUntilDone(sounds.informationErrorAlarm)
    brick.clearScreen();
    brick.showString("      Game Over\n\n  Your score is: " + LEVEL.score, 6)
    control.waitMicros(2000000);
}

main();

