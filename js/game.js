
const LOADING = 0, PLAYING = 1, PAUSE = 2, GAMEOVER = 3;

// ratio 16/10
const WIDTH = 800, HEIGHT = 500;

// vitesse de déplacement du décor (en pixels/ms)
const SPEED = 0.16;

const DEBUG = 0;

export class Game {
    
    constructor(cvs, resources) {
        this.resources = resources;
        this.ctx = cvs.getContext("2d");
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.state = LOADING;
        this.floor = HEIGHT * 5/6;
        this.decorations = [];
        while (this.decorations.length < 10) {
            const x = Math.floor(Math.random() * WIDTH);
            const coeff = 0.1 + Math.random() * 0.9;
            const y = this.floor + 10 + Math.floor(coeff * HEIGHT / 4);
            const speed = SPEED * (1+coeff/3);
            const width = 2 + Math.random() * 10;
            this.decorations.push(new Rock(x, y, width, 1, speed));

        }
        this.decorations.push(new Cloud(Math.random() * WIDTH/3 + WIDTH / 2, 40 + Math.random() * 40, 100, 40, SPEED / 20));
    }

    update(dt) {
        if (this.state == PLAYING) {
            this.delayBeforeNewEnemy -= dt;
            if (this.delayBeforeNewEnemy <= 0) {
                this.enemies.push(new Cactus(WIDTH, this.floor-70, 40, 80, SPEED));
                this.delayBeforeNewEnemy = 1300 + Math.floor(Math.random() * 2000);
            }
            this.score += 10 * dt;
            this.dino.update(dt);
            this.decorations.forEach(d => d.update(dt));
            this.enemies = this.enemies.filter(e => e.update(dt));
            if (this.enemies.some(e => e.collidesWith(this.dino))) {
                this.state = GAMEOVER;
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
        // dessin du paysage 
        this.ctx.fillStyle = "#4bc1ec";
        this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
        this.ctx.save();
        this.ctx.shadowColor = "yellow";
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = "yellow";
        this.ctx.beginPath();
        this.ctx.arc(WIDTH * 0.8, HEIGHT * 0.15, HEIGHT * 0.06, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.fillStyle = "#d79016";
        this.ctx.fillRect(0, this.floor, WIDTH, HEIGHT - this.floor);
        this.decorations.forEach(d => d.render(this.ctx));

        // état de chargement 
        if (this.state == LOADING) {
            this.ctx.font = "800 20px arial";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("CHARGEMENT...", WIDTH/2, HEIGHT/2);
            return;
        }
        
        // dino
        this.dino.render(this.ctx);
        // cactus
        this.enemies.forEach(e => e.render(this.ctx));
        // score
        this.ctx.save();
        this.ctx.textAlign = "left";
        this.ctx.font = "20px arial";
        this.ctx.fillText(`Score : ${this.score} pts`, 10, 20);
        this.ctx.restore();

        if (this.state == PAUSE) {
            this.ctx.fillText("PAUSE", WIDTH/2, HEIGHT/2);
        }
        else if (this.state === GAMEOVER) {
            this.ctx.fillText("GAME OVER", WIDTH/2, HEIGHT * 0.5);
        }
    }

    /***************************************************
     *     Fonctions qui changent l'état du jeu
     **************************************************/
    
    notifyLoad() {
        console.log(this.resources);
        if (Object.values(this.resources).every(img => img.complete)) {
            this.start();
        }
    }

    start() {
        this.dino = new Dino(WIDTH / 10, this.floor, this.resources["dino"]);
        this.enemies = [];
        this.delayBeforeNewEnemy = 0;
        this.score = 0;
        this.state = PLAYING;
    }

    pause() {
        if (this.state == PLAYING) {
            this.state = PAUSE;
            return;
        }
        if (this.state == PAUSE) {
            this.state = PLAYING;
        }
    }

    keydown(code) {
        if (this.state == PLAYING) {
            switch (code) {
                case "Space":
                    this.dino.jump();
                    break;
                case "KeyC": 
                    this.dino.switchColor();
                    break;
                case "KeyP":
                    this.pause();
                    break;
            }
        }
        else if (this.state == PAUSE && code === "KeyP") {
            this.pause();
        }
        else if (this.state == GAMEOVER) {
            this.start();
        }
    }
}


/***************************************************************
 *   Entités manipulées dans le jeu : dino, cactus, etc.   
 **************************************************************/

class Entity {

    constructor(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    update(dt) {
        // rien à faire à ce niveau
    }

    render(ctx) {
        ctx.strokeStyle = "red";
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(e) {
        return !(this.x + this.width < e.x || this.x > e.x + e.width || this.y + this.height < e.y || this.y > e.y + e.height);
    }

}



const ANIMATION_DINO = { 
    x: 269, 
    dX: 231,
    nbFrames: 4,
    y: 136,
    dY: 167,
    nbColors: 6,
    width: 222, 
    height: 152, 
    delay: 100 
};

const JUMP_FORCE = 0.6;
const GRAVITY = 0.001;
const DINO_RATIO = 0.6;

class Dino extends Entity {

    constructor(x, floor, sprite) {
        super(x, floor + 15 - 80, 60, 80);
        this.offset = { x: 35, y: 10 }
        this.sprite = sprite;
        this.color = 0; 
        this.floor = this.y;
        this.animation = { frame: 0, delay: ANIMATION_DINO.delay };
        this.vecY = null;
    }

    update(dt) {
        this.animation.delay -= dt;
        if (this.animation.delay < 0) {
            this.animation.frame = (this.animation.frame + 1) % ANIMATION_DINO.nbFrames;
            this.animation.delay = ANIMATION_DINO.delay * (this.vecY !== null ? 4 : 1);
        }
        if (this.vecY !== null) {
            this.vecY += GRAVITY * dt;
            this.y = this.y + this.vecY * dt;
            if (this.y > this.floor) {
                this.y = this.floor;
                this.vecY = null;
                this.animation.delay = 0;
            }
        }
            
    }

    render(ctx) {
        //let DEBUG = 1;
        ctx.drawImage(this.sprite, ANIMATION_DINO.x + this.animation.frame * ANIMATION_DINO.dX, ANIMATION_DINO.y + this.color * ANIMATION_DINO.dY, ANIMATION_DINO.width, ANIMATION_DINO.height, this.x - this.offset.x, this.y - this.offset.y, ANIMATION_DINO.width*DINO_RATIO, ANIMATION_DINO.height*DINO_RATIO);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "lightgray";
        //ctx.strokeRect(this.x - this.offset.x, this.y - this.offset.y, ANIMATION_DINO.width*DINO_RATIO, ANIMATION_DINO.height*DINO_RATIO);
        DEBUG && super.render(ctx);
    }

    switchColor() {
        this.color = (this.color + 1) % ANIMATION_DINO.nbColors;
    }

    jump() {
        if (this.y == this.floor) {
            this.vecY = -JUMP_FORCE;
        }
    }

}

class Decoration extends Entity {

    constructor(x,y,w,h,speed) {
        super(x, y, w, h);
        this.speed = speed;
    }

    update(dt) {
        this.x -= this.speed * dt;
        if (this.x + this.width < 0) {
            this.x = WIDTH + this.width;
        }
    }
}

class Rock extends Decoration {

    render(ctx) {
        ctx.save();
        ctx.strokeStyle = "brown";
        ctx.lineCap = "round";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, 1);
        ctx.restore();
    }
}

class Cloud extends Decoration {

    render(ctx) {
        ctx.fillText("Cloud", this.x + this.width / 2, this.y + this.height / 2)
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";

        ctx.beginPath();
        const DEUPI = 2*Math.PI;
        ctx.arc(this.x + this.width * 0.25, this.y + this.height * 0.6, this.height * 0.5, 0, DEUPI)
        ctx.arc(this.x + this.width * 0.35, this.y + this.height * 0.3, this.height * 0.5, 0, DEUPI)
        ctx.arc(this.x + this.width * 0.55, this.y + this.height * 0.5, this.height * 0.7, 0, DEUPI)
        ctx.arc(this.x + this.width * 0.75, this.y + this.height * 0.6, this.height * 0.5, 0, DEUPI)
        ctx.stroke();
        ctx.fill();
        DEBUG && super.render(ctx);
    }
}


class Cactus extends Decoration {

    constructor(x,y,w,h,s) {
        super(x,y,w,h,s);
        this.maxLeft = Math.random() * 0.3 + 0.6;
        this.maxRight = Math.random() * 0.3 + 0.6;
        this.startLeft = Math.random() * 0.4 + 0.2;
        this.startRight = Math.random() * 0.4 + 0.2;
    }

    update(dt) {
        this.x -= this.speed * dt;
        return (this.x + this.width > 0);
    }

    render(ctx) {   
        //let DEBUG = 1; 
        ctx.save();
        ctx.strokeStyle = "darkgreen";
        ctx.lineJoin = "round";
        ctx.lineWidth = this.width/3;
        ctx.shadowColor = "green";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.moveTo(this.x + this.width/2, this.y + this.height);
        ctx.lineTo(this.x + this.width/2, this.y + this.height * 0.5);
        ctx.stroke();
        ctx.lineCap = "round";
        ctx.lineTo(this.x + this.width/2, this.y + this.height * 0.05);
        ctx.stroke();
        ctx.lineWidth = this.width/4;
        ctx.moveTo(this.x + this.width/2, this.y + this.height * (1-this.startLeft));
        ctx.lineTo(this.x, this.y + this.height * (1-this.startLeft));
        ctx.lineTo(this.x, this.y + this.height * (1-this.maxLeft));
        ctx.stroke();
        ctx.moveTo(this.x + this.width/2, this.y + this.height * (1-this.startRight));
        ctx.lineTo(this.x + this.width, this.y + this.height * (1-this.startRight));
        ctx.lineTo(this.x + this.width, this.y + this.height * (1-this.maxRight));
        ctx.stroke();
        ctx.restore();
        DEBUG && super.render(ctx);
    }
}