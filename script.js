const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initHeart();
});

const audio = new Audio('music.mp3');
audio.loop = true; 

// НАСТРОЙКИ
const FLOAT_COUNT = 3000; // 3000 частиц для невероятной детализации
const floatParticles = [];
const burstParticles = [];
const ringParticles = []; // Для эффекта кольца при клике

// Палитра "Квантовой энергии"
const NEON_SHADES = [
    "#ff007f", // Яркий неоновый розовый
    "#d900ff", // Электрический фиолетовый
    "#6600ff", // Глубокий индиго
    "#00e5ff", // Кислотный циан
    "#ffffff"  // Чистый белый (для ядра)
];

// 3D Шум для создания объема
function noise3D(x, y, z) {
    return Math.sin(x) * Math.cos(y) * Math.sin(z);
}

class Particle {
    constructor(type) {
        this.type = type;
        
        if (type === 'float') {
            // Случайные координаты для начального хаоса
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 2 - 1; // Z-ось для объема
            
            this.originalX = 0;
            this.originalY = 0;
            
            // Выбираем цвет: 80% неон, 20% белый (для ярких вспышек)
            this.color = Math.random() > 0.8 ? "#ffffff" : NEON_SHADES[Math.floor(Math.random() * (NEON_SHADES.length - 1))];
            
            this.size = Math.random() * 2.5 + 0.5; // Разный размер
            this.speed = Math.random() * 0.05 + 0.01; // Скорость притяжения
            
            this.vx = 0;
            this.vy = 0;
            
            this.maxLife = Math.random() * 200 + 100;
            this.life = Math.random() * this.maxLife; 
        } else if (type === 'burst') {
            this.x = 0; this.y = 0;
            this.vx = 0; this.vy = 0;
            this.color = NEON_SHADES[Math.floor(Math.random() * NEON_SHADES.length)];
            this.size = Math.random() * 2 + 1;
            this.life = 100;
        } else if (type === 'ring') {
            this.x = 0; this.y = 0;
            this.angle = 0;
            this.speed = 0;
            this.radius = 0;
            this.color = "#ffffff";
            this.life = 100;
        }
    }

    update() {
        if (this.type === 'float') {
            // Вычисляем притяжение к сердцу
            const dx = this.originalX - this.x;
            const dy = this.originalY - this.y;
            
            // Плавное притяжение + эффект "дыхания"
            const time = Date.now() * 0.001;
            const pulse = Math.sin(time * 2) * 0.5 + 0.5;
            
            this.vx += dx * this.speed * (1 + pulse * 0.2);
            this.vy += dy * this.speed * (1 + pulse * 0.2);
            
            // Трение
            this.vx *= 0.92;
            this.vy *= 0.92;
            
            // Хаос (тряска)
            this.vx += (Math.random() - 0.5) * 1.5;
            this.vy += (Math.random() - 0.5) * 1.5;
            
            this.x += this.vx;
            this.y += this.vy;

            this.life -= 0.5;
            if (this.life <= 0) this.life = this.maxLife;
        } else if (this.type === 'burst') {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.94;
            this.vy *= 0.94;
            this.vy += 0.1; // Гравитация
            this.life -= 1.5;
        } else if (this.type === 'ring') {
            this.radius += this.speed;
            this.speed *= 0.95;
            this.x = this.originX + Math.cos(this.angle) * this.radius;
            this.y = this.originY + Math.sin(this.angle) * this.radius;
            this.life -= 2;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        if (this.type === 'float') {
            // Прозрачность зависит от Z (глубины) и жизни
            ctx.globalAlpha = Math.max(0.1, (this.life / this.maxLife) * (0.5 + (this.z + 1) / 2));
        } else {
            ctx.globalAlpha = Math.max(0, this.life / 100);
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function initHeart() {
    floatParticles.length = 0; 
    const centerX = width / 2;
    const centerY = height / 2 - 20;
    const scale = Math.min(width, height) / 45; 

    for (let i = 0; i < FLOAT_COUNT; i++) {
        // Математическая форма сердца
        const t = Math.PI - (i / FLOAT_COUNT) * 2 * Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        const p = new Particle('float');
        
        // Создаем объем: раскидываем частицы не только по контуру, но и внутри
        const spread = Math.random() * 40 - 20; // Разброс
        const depth = noise3D(x, y, p.z) * 30; // Z-глубина

        p.originalX = centerX + (x * scale) + spread + depth;
        p.originalY = centerY + (y * scale) + spread + depth;
        
        // Чем ближе к центру, тем ярче и меньше частицы (эффект ядра)
        const distToCenter = Math.sqrt(Math.pow(p.originalX - centerX, 2) + Math.pow(p.originalY - centerY, 2));
        if (distToCenter < 100) {
            p.color = "#ffffff";
            p.size = Math.random() * 1.5 + 0.5;
        }

        floatParticles.push(p);
    }
}

initHeart();

const hint = document.getElementById('hint'); 

canvas.addEventListener('click', (e) => {
    // 1. Эффект взрыва
    for (let i = 0; i < 300; i++) {
        const p = new Particle('burst');
        p.x = e.clientX;
        p.y = e.clientY;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        burstParticles.push(p);
    }

    // 2. Эффект кольца (ударная волна)
    for (let i = 0; i < 100; i++) {
        const p = new Particle('ring');
        p.originX = e.clientX;
        p.originY = e.clientY;
        p.angle = (i / 100) * Math.PI * 2;
        p.radius = 0;
        p.speed = 15;
        ringParticles.push(p);
    }

    if (audio.paused) audio.play().catch(e => console.log("Нет музыки"));
    if (hint) hint.style.opacity = '0'; 
});

function animate() {
    // Очень длинный шлейф для эффекта "жидкого стекла"
    ctx.fillStyle = 'rgba(5, 5, 10, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Включаем сложение цветов для неонового свечения
    ctx.globalCompositeOperation = 'lighter';

    // Рисуем частицы сердца
    for (let i = 0; i < floatParticles.length; i++) {
        floatParticles[i].update();
        floatParticles[i].draw();
    }

    // Рисуем взрыв
    for (let i = burstParticles.length - 1; i >= 0; i--) {
        burstParticles[i].update();
        burstParticles[i].draw();
        if (burstParticles[i].life <= 0) burstParticles.splice(i, 1);
    }

    // Рисуем кольцо
    for (let i = ringParticles.length - 1; i >= 0; i--) {
        ringParticles[i].update();
        ringParticles[i].draw();
        if (ringParticles[i].life <= 0) ringParticles.splice(i, 1);
    }

    // Возвращаем режим наложения
    ctx.globalCompositeOperation = 'source-over';

    // ТЕКСТ (Магия шрифта)
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#ff007f";
    
    // Быстрая пульсация, как биение сердца
    const textPulse = Math.sin(Date.now() * 0.005) * 4 + 40; 
    
    // Используем жирный шрифт
    ctx.font = `900 ${textPulse}px Arial`; 
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Добавляем обводку для четкости
    ctx.strokeStyle = "#d900ff";
    ctx.lineWidth = 2;
    
    ctx.strokeText("Люблю тебя,", width / 2, height / 2 - 15);
    ctx.fillText("Люблю тебя,", width / 2, height / 2 - 15);
    
    ctx.strokeText("Маша", width / 2, height / 2 + 35);
    ctx.fillText("Маша", width / 2, height / 2 + 35);
    
    ctx.shadowBlur = 0;

    requestAnimationFrame(animate);
}

animate();