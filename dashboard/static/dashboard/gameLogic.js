document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // TIMER LOGIC
    // ==========================================
    window.timerInterval = null;
    window.currentSeconds = 0;
    window.isTimerActive = false;

    // --- FORCE OFF BY DEFAULT ON PAGE LOAD ---
    const timerDisplay = document.getElementById('main-timer-display');
    const settingsTimerToggle = document.getElementById('toggle-timer');

    if (timerDisplay) {
        timerDisplay.style.display = 'none'; // Ensure it's hidden initially
    }
    if (settingsTimerToggle) {
        settingsTimerToggle.checked = false; // Ensure the toggle is visually OFF
    }
    window.isTimerActive = false; 

    // Helper to add the icon and format
    window.formatTimeWithIcon = function(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        // Adds a clock symbol and the time
        return `<span style="margin-right: 6px; font-size: 1.1em;">⏱</span>${m}:${s}`;
    };

    window.startTimer = function() {
        clearInterval(window.timerInterval);
        const settingsTimerToggle = document.getElementById('toggle-timer'); 
        
        // ONLY start if the toggle is checked in settings
        if (!settingsTimerToggle || !settingsTimerToggle.checked) {
            window.isTimerActive = false;
            return;
        }
        
        window.isTimerActive = true;
        const timerDisplay = document.getElementById('main-timer-display');
        if(timerDisplay) {
            timerDisplay.style.display = 'block';
            timerDisplay.innerHTML = window.formatTimeWithIcon(window.currentSeconds);
        }
        
        window.timerInterval = setInterval(() => {
            window.currentSeconds++;
            
            const display = document.getElementById('main-timer-display');
            if(display) display.innerHTML = window.formatTimeWithIcon(window.currentSeconds);
            
            // Safely update mini timer if it exists
            const miniTimer = document.getElementById('settings-mini-timer');
            if(miniTimer) miniTimer.innerHTML = window.formatTimeWithIcon(window.currentSeconds);
            
        }, 1000);
    };

    window.stopTimer = function() {
        clearInterval(window.timerInterval);
        window.isTimerActive = false;
    };

    window.resetTimer = function() {
        window.stopTimer();
        window.currentSeconds = 0;
        const timerDisplay = document.getElementById('main-timer-display');
        if(timerDisplay) timerDisplay.innerHTML = window.formatTimeWithIcon(0);
    };

    window.addHintPenalty = function() {
        // Only apply penalty if the gameLogic timer is actually running
        if (window.isTimerActive) {
            
            window.currentSeconds += 30; // Add 15 seconds to the REAL timer
            
            const display = document.getElementById('main-timer-display');
            if (display) {
                // Update screen using the official format with the icon!
                display.innerHTML = window.formatTimeWithIcon(window.currentSeconds);
                
                // Flash red
                display.style.color = "#ff4444"; 
                setTimeout(() => {
                    display.style.color = ""; 
                }, 500);
            }
        }
    };

    // --- TOGGLE LOGIC ---
    if (settingsTimerToggle) {
        settingsTimerToggle.addEventListener('change', (e) => {
            const timerDisplay = document.getElementById('main-timer-display');
            window.isTimerActive = e.target.checked; 
            
            if(e.target.checked) {
                if(timerDisplay) timerDisplay.style.display = 'block';
                
                // 1. Trigger the new game FIRST (this resets the board and kills the old timer)
                const randomBtn = document.getElementById('random-btn');
                if (randomBtn) randomBtn.click(); 
                
                // 2. THEN explicitly start the new timer!
                if (typeof window.resetTimer === 'function') window.resetTimer();
                if (typeof window.startTimer === 'function') window.startTimer();
                
            } else {
                if(timerDisplay) timerDisplay.style.display = 'none';
                if (typeof window.resetTimer === 'function') window.resetTimer();
            }
        });
    }

    // ==========================================
    // 5. LEADERBOARD LOGIC
    // ==========================================
    window.handleGameWin = function() {
        if (typeof window.stopTimer === 'function') window.stopTimer();
        
        const settingsTimerToggle = document.getElementById('toggle-timer');
        
        // Save to leaderboard if timer is ON and they didn't finish suspiciously fast (< 5s)
        if (settingsTimerToggle && settingsTimerToggle.checked && window.currentSeconds > 5) {
            let topTimes = JSON.parse(localStorage.getItem('sudoku_leaderboard')) || [];
            topTimes.push(window.currentSeconds);
            topTimes.sort((a, b) => a - b);
            topTimes = topTimes.slice(0, 5); // Keep top 5
            localStorage.setItem('sudoku_leaderboard', JSON.stringify(topTimes));
        }

        // Auto-open Leaderboard with smooth delay
        setTimeout(() => { openSidebar(); }, 1200); 
    };

    window.refreshLeaderboardUI = function() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        let topTimes = JSON.parse(localStorage.getItem('sudoku_leaderboard')) || [];
        list.innerHTML = '';
        
        if (topTimes.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:#666; padding: 20px 0;">No completed games yet.</div>';
            return;
        } 
        
        // Generate the time slots
        topTimes.forEach((time, index) => {
            const m = Math.floor(time / 60).toString().padStart(2, '0');
            const s = (time % 60).toString().padStart(2, '0');
            
            const color = index === 0 ? 'color: gold;' : 'color: #ccc;';
            const size = index === 0 ? 'font-size: 1.2rem; font-weight: 600;' : 'font-size: 1rem;';
            
            list.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: rgba(255,255,255,0.03); margin-bottom: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <span style="${color} ${size}">#${index + 1}</span>
                    <span style="${color} ${size} font-family: monospace;">${m}:${s}</span>
                </div>
            `;
        });

        // Inject the sleek "Clear Leaderboard" button at the bottom
        list.innerHTML += `
            <div style="text-align: right; margin-top: 15px;">
                <button id="clear-leaderboard-btn" style="background: transparent; border: none; color: #ff6b6b; font-size: 0.85rem; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">
                    <i class="fas fa-trash-alt" style="margin-right: 5px;"></i> Clear Times
                </button>
            </div>
        `;

        // Attach the click event to the newly created button
        document.getElementById('clear-leaderboard-btn').addEventListener('click', () => {
            // Optional: You could add a confirm() popup here if you want safety
            localStorage.removeItem('sudoku_leaderboard');
            refreshLeaderboardUI(); // Instantly visually refresh the list
        });
        const leaderboardAccordion = document.querySelectorAll('.info-accordion')[0];
        const content = leaderboardAccordion?.querySelector('.accordion-content');

        if (content) {
            content.style.maxHeight = content.scrollHeight + 60 + "px";
        }
    }

    // ==========================================
    // MODAL CLOSE LOGIC (Fixing the Dim Screen)
    // ==========================================
    const closeModalBtn = document.getElementById('close-modal-btn');
    const infoModalElement = document.getElementById('info-modal');

    // 1. Close when clicking the "Close" button
    if (closeModalBtn && infoModalElement) {
        closeModalBtn.addEventListener('click', () => {
            infoModalElement.style.display = 'none';
        });
    }

    // 2. Close when clicking the dim overlay background itself
    if (infoModalElement) {
        infoModalElement.addEventListener('click', (e) => {
            // e.target checks if they clicked the exact overlay element, 
            // not the inner modal sheet or text
            if (e.target === infoModalElement) {
                infoModalElement.style.display = 'none';
            }
        });
    }
}); // <-- This closing bracket sequence was previously broken!