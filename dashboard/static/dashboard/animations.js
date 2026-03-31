document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    
    // Safety check just in case the ID is wrong or missing
    if (!canvas) {
        console.error("Could not find the canvas element!");
        return;
    }
    
    const ctx = canvas.getContext('2d');

    // --- THEME DETECTOR ---
    function isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark' || 
               document.body.classList.contains('dark-mode') ||
               document.body.classList.contains('dark-theme');
    }

    // --- HIGH-DPI SCALING ---
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        initShapes();
    }

    window.addEventListener('resize', resizeCanvas);

    // --- THE AESTHETIC SHAPE CLASS ---
    let shapesArray = [];

    class AestheticShape {
        constructor() {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;
            
            this.baseSize = (Math.random() * 15) + 5; 
            
            const isMobile = window.innerWidth < 768;
            const maxScale = isMobile ? 2.5 : 4; 
            
            this.lightModeScale = (Math.pow(Math.random(), 2) * maxScale) + 1; 
            this.depth = this.baseSize / 20; 

            this.speedX = (Math.random() - 0.5) * 0.3 * this.depth;
            this.speedY = (Math.random() - 0.5) * 0.3 * this.depth;
            
            this.angle = Math.random() * Math.PI * 2;
            this.spinSpeed = (Math.random() - 0.5) * 0.005;

            const types = ['circle', 'square', 'triangle', 'diamond'];
            this.type = types[Math.floor(Math.random() * types.length)];
            this.isFilled = Math.random() > 0.6; 
        }

        draw(ctx, isDark) {
            let currentSize = isDark ? this.baseSize : this.baseSize * this.lightModeScale;
            let currentSpeedMultiplier = isDark ? 1 : Math.max(1, this.lightModeScale * 0.6);
            let currentDepth = isDark ? this.depth : (currentSize / 35); 

            this.x += this.speedX * currentSpeedMultiplier;
            this.y += this.speedY * currentSpeedMultiplier;
            this.angle += this.spinSpeed;

            const buffer = currentSize + 20;
            if (this.x < -buffer) this.x = window.innerWidth + buffer;
            if (this.x > window.innerWidth + buffer) this.x = -buffer;
            if (this.y < -buffer) this.y = window.innerHeight + buffer;
            if (this.y > window.innerHeight + buffer) this.y = -buffer;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            const baseOpacity = Math.min(currentDepth * 0.4, 0.85); 
            
            if (isDark) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${baseOpacity * 0.5})`; 
                ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 0.15})`;
            } else {
                if (this.isFilled) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 1.8})`; 
                    ctx.strokeStyle = `rgba(0, 0, 0, ${baseOpacity * 0.8})`; 
                } else {
                    ctx.strokeStyle = `rgba(0, 0, 0, ${baseOpacity * 0.5})`;
                    ctx.fillStyle = `transparent`;
                }
            }

            ctx.lineWidth = 1.2; 
            ctx.beginPath();

            if (this.type === 'circle') {
                ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            } else if (this.type === 'square') {
                ctx.rect(-currentSize, -currentSize, currentSize * 2, currentSize * 2);
            } else if (this.type === 'triangle') {
                ctx.moveTo(0, -currentSize);
                ctx.lineTo(currentSize * 0.866, currentSize * 0.5);
                ctx.lineTo(-currentSize * 0.866, currentSize * 0.5);
                ctx.closePath();
            } else if (this.type === 'diamond') {
                ctx.moveTo(0, -currentSize);
                ctx.lineTo(currentSize, 0);
                ctx.lineTo(0, currentSize);
                ctx.lineTo(-currentSize, 0);
                ctx.closePath();
            }

            if (this.isFilled) {
                ctx.fill();
                ctx.stroke(); 
            } else {
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // --- INITIALIZE & ANIMATE ---
    function initShapes() {
        shapesArray = [];
        let numShapes = Math.floor((window.innerWidth * window.innerHeight) / 10000);
        
        const maxShapes = window.innerWidth < 768 ? 45 : 120;
        if (numShapes > maxShapes) numShapes = maxShapes; 

        for (let i = 0; i < numShapes; i++) {
            shapesArray.push(new AestheticShape());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ONLY draw if animations are enabled
        if (window.animationsEnabled) {
            const isDark = isDarkMode();
            for (let i = 0; i < shapesArray.length; i++) {
                shapesArray[i].draw(ctx, isDark);
            }
        }

        requestAnimationFrame(animate);
    }

    // Boot everything up
    resizeCanvas(); 
    requestAnimationFrame(animate);
});