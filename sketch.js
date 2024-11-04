// Game variables
let serialPort;
let statusDiv;
let connectButton;
let clawX = 300;
let clawY = 100;
let targetX = 300;
let coins = 0;
let score = 0;
let isGrabbing = false;
let selectedDoll = null;
let lastPotValue = 0;
const MOVEMENT_SMOOTHING = 0.05;
const DOLL_SIZE = 60;

// Images
let blackcat;
let cat1;
let cat2;
let donut;

// Game states
const MOVING = 'moving';
const DROPPING = 'dropping';
const RISING = 'rising';
let gameState = MOVING;

// Color palette
const COLORS = {
    background: '#FFFFFF',
    frame: '#88DDFF',
    darkFrame: '#66BBDD',
    accentPink: '#FFB7DD',
    accentMint: '#AAFFDD',
    textDark: '#446688',
    outline: '#224466'
};

// Initialize dolls
let dolls = [
    { x: 150, y: 400, img: 'blackcat', caught: false },
    { x: 400, y: 420, img: 'cat1', caught: false },
    { x: 650, y: 400, img: 'cat2', caught: false },
    { x: 300, y: 450, img: 'donut', caught: false }
];

function preload() {
    // Load PNG images
    blackcat = loadImage('blackcat.png');
    cat1 = loadImage('cat1.png');
    cat2 = loadImage('cat2.png');
    donut = loadImage('donunt.png');
}

function setup() {
    createCanvas(800, 600);
    pixelDensity(1);
    noSmooth();
    
    targetX = width/2;
    clawX = width/2;
}


function setup() {
    const canvas = createCanvas(800, 600);
    canvas.parent('game-container');
    pixelDensity(1);
    noSmooth();
    
    statusDiv = document.getElementById('status');
    connectButton = document.getElementById('connect-btn');
    connectButton.addEventListener('click', connectArduino);
    
    targetX = width/2;
    clawX = width/2;
}

function draw() {
    // Smooth movement
    if (targetX !== undefined && clawX !== undefined) {
        clawX = lerp(clawX, targetX, MOVEMENT_SMOOTHING);
    }
    
    background(COLORS.background);
    drawMachine();
    drawDolls();
    drawClaw();
    updateGame();
    drawInterface();
}

function drawMachine() {
    // Main frame
    stroke(COLORS.outline);
    strokeWeight(4);
    fill(COLORS.frame);
    rect(50, 30, width-100, height-80, 15);
    
    // Game area
    fill(COLORS.background);
    rect(70, 50, width-140, height-160, 10);
    
    // Top bar
    fill(COLORS.accentPink);
    noStroke();
    rect(90, 20, width-180, 40, 20);
    
    // Pixel dots border
    for(let i = 20; i < width-20; i += 10) {
        fill(i % 20 === 0 ? '#FF0000' : '#FF6666');
        rect(i, 20, 8, 8);
        rect(i, height-28, 8, 8);
    }
    // Draw pixel joystick
    drawJoystick();
}

function drawJoystick() {
    push();
    translate(100, height-100);
    
    // Base
    fill('#333333');
    noStroke();
    rect(0, 0, 40, 40);
    rect(15, -20, 10, 20);
    
    // Top
    fill('#666666');
    rect(10, -25, 20, 10);
    
    // Price text
    textAlign(LEFT, CENTER);
    textSize(30);
    fill('#FF0000');
    text("1$ / PLAY", 60, 20);
    
    pop();
}

function drawDolls() {
    dolls.forEach(doll => {
        if (!doll.caught) {
            drawDoll(doll.x, doll.y, doll.img);
        }
    });
}

function drawDoll(x, y, type) {
    push();
    imageMode(CENTER);
    let img;
    switch(type) {
        case 'blackcat':
            img = blackcat;
            break;
        case 'cat1':
            img = cat1;
            break;
        case 'cat2':
            img = cat2;
            break;
        case 'donut':
            img = donut;
            break;
    }
    image(img, x, y, DOLL_SIZE+20, DOLL_SIZE+20);
    pop();
}

function drawClaw() {
    push();
    translate(clawX, clawY);
    
    // Cable
    stroke(COLORS.darkFrame);
    strokeWeight(4);
    line(0, -clawY+90, 0, 0);
    
    // Claw mechanism
    fill(COLORS.darkFrame);
    noStroke();
    
    // Base
    rect(-20, -10, 40, 20);
    
    // Arms
    if (isGrabbing) {
        rect(-12, 10, 8, 30);
        rect(4, 10, 8, 30);
    } else {
        rect(-25, 10, 8, 30);
        rect(17, 10, 8, 30);
    }
    pop();
}

function updateGame() {
    switch(gameState) {
        case DROPPING:
            clawY += 2;
            if (clawY > height-200) {
                grabDoll();
                gameState = RISING;
            }
            break;
            
        case RISING:
            clawY -= 2;
            if (clawY <= 100) {
                gameState = MOVING;
                if (selectedDoll) {
                    if (clawX < 100) {
                        selectedDoll.caught = true;
                        score += 100;
                        playWinSound();
                    }
                    selectedDoll = null;
                }
                isGrabbing = false;
            }
            break;
            
        case MOVING:
            clawY = 100;
            break;
    }
    
    if (selectedDoll) {
        selectedDoll.x = lerp(selectedDoll.x, clawX, 0.1);
        selectedDoll.y = lerp(selectedDoll.y, clawY + 30, 0.1);
    }
}

function drawInterface() {
    // Score and coins
    fill(COLORS.textDark);
    textSize(24);
    textAlign(LEFT);
    text(`Score: ${score}`, 100, 50);
    text(`Coins: ${coins}`, width-200, 50);
}

function grabDoll() {
    dolls.forEach(doll => {
        if (!doll.caught && 
            abs(clawX - doll.x) < DOLL_SIZE/2 && 
            abs(clawY - doll.y) < DOLL_SIZE/2) {
            selectedDoll = doll;
            isGrabbing = true;
            playGrabSound();
        }
    });
}

function playGrabSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

function playWinSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    
    oscillator.start();
    setTimeout(() => {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    }, 100);
    oscillator.stop(audioCtx.currentTime + 0.2);
}

async function connectArduino() {
    if ('serial' in navigator) {
        try {
            updateStatus('Connecting...');
            serialPort = await navigator.serial.requestPort();
            await serialPort.open({ baudRate: 9600 });
            updateStatus('Connected!');
            readSerial();
        } catch (err) {
            console.error('Arduino connection error:', err);
            updateStatus('Connection failed: ' + err.message);
        }
    } else {
        updateStatus('Web Serial not supported. Use Chrome or Edge.');
    }
}


function updateStatus(message) {
    if (statusDiv) {
        statusDiv.textContent = message;
    }
}

async function readSerial() {
    const reader = serialPort.readable.getReader();
    
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const data = new TextDecoder().decode(value);
            const [potValue, forceValue] = data.trim().split(',').map(Number);
            
            if (!isNaN(potValue)) {
                const newTarget = map(potValue, 0, 1023, 100, width-100);
                if (Math.abs(newTarget - targetX) > 20) {
                    targetX = newTarget;
                    lastPotValue = potValue;
                }
            }
            
            if (!isNaN(forceValue)) {
                if (forceValue > 500 && gameState === MOVING) {
                    gameState = DROPPING;
                } else if (forceValue <= 500 && gameState === DROPPING) {
                    isGrabbing = true;
                }
            }
        }
    } catch (err) {
        console.error('Serial read error:', err);
        updateStatus('Read error: ' + err.message);
    } finally {
        reader.releaseLock();
    }
}

function keyPressed() {
    if (key === ' ' && gameState === MOVING) {
        gameState = DROPPING;
    }
    
    if (keyCode === LEFT_ARROW) {
        targetX = max(100, targetX - 20);
    }
    if (keyCode === RIGHT_ARROW) {
        targetX = min(width-100, targetX + 20);
    }
}

function mousePressed() {
    if (mouseY > height-100 && mouseX > width-200) {
        coins++;
    }
}