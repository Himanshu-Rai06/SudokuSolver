// ==========================================
// STATE VARIABLES & DOM ELEMENTS
// ==========================================
window.animationsEnabled = true;

// Settings DOM Elements
const settingsBtn = document.getElementById('settings-btn'); 
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn'); 

const animToggle = document.getElementById('toggle-animations');
const fullscreenToggle = document.getElementById('toggle-fullscreen');
const timerToggle = document.getElementById('toggle-timer');
const timerDisplay = document.getElementById('game-timer') || document.querySelector('.timer');

// Slot Modal DOM Elements
const slotModal = document.getElementById('slot-modal');
const closeSlotBtn = document.getElementById('close-slot-btn');
const slotTitle = document.getElementById('slot-modal-title');
const slotDesc = document.getElementById('slot-modal-desc');

// Tracks if the slot menu is currently saving or loading
let currentAction = 'save'; 

// ==========================================
// MODAL OPEN / CLOSE LOGIC
// ==========================================

// Open Settings
settingsBtn?.addEventListener('click', (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    settingsModal.style.display = 'flex';
});

// Close Settings
closeSettingsBtn?.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// Close Settings when clicking the dark overlay outside the menu
settingsModal?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
        settingsModal.style.display = 'none'; // Fixed: Changed from .active to .style.display
    }
});

// Close Slot Modal
closeSlotBtn?.addEventListener('click', () => { 
    slotModal.style.display = 'none'; 
});

// ==========================================
// TOGGLES (ANIMATION, FULLSCREEN, TIMER)
// ==========================================

animToggle?.addEventListener('change', (e) => {
    window.animationsEnabled = e.target.checked;
    const canvas = document.getElementById('bg-canvas');
    if (!window.animationsEnabled && canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

fullscreenToggle?.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
        if (document.fullscreenElement) document.exitFullscreen();
    }
});

timerToggle?.addEventListener('change', (e) => {
    if (timerDisplay) {
        timerDisplay.style.visibility = e.target.checked ? 'visible' : 'hidden';
    }
});


// ==========================================
// MULTI-SLOT SAVE & LOAD SYSTEM
// ==========================================

function openSlotMenu(action) {
    currentAction = action;
    if (slotTitle) slotTitle.innerText = action === 'save' ? "Save Game" : "Load Game";
    if (slotDesc) slotDesc.innerText = action === 'save' ? "Click a slot to save." : "Choose a saved game to resume.";
    
    for (let i = 1; i <= 3; i++) {
        // Look for the container (fallback to just 'slot-1' if 'slot-1-container' doesn't exist)
        const slotContainer = document.getElementById(`slot-${i}-container`) || document.getElementById(`slot-${i}`);
        const nameInput = document.getElementById(`slot-${i}-name`);
        const timeDisplay = document.getElementById(`slot-${i}-time`);
        
        // ONLY skip if the actual button/container is completely missing!
        if (!slotContainer) continue; 

        const savedData = localStorage.getItem(`sudokuSave_${i}`);
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            const timeFormatted = (parsedData.time !== undefined && typeof window.formatTimeWithIcon === 'function') 
                ? window.formatTimeWithIcon(parsedData.time) 
                : "00:00";

            // If you have the complex HTML structure, update it:
            if (nameInput) nameInput.value = parsedData.name || `Save ${i}`;
            if (timeDisplay) timeDisplay.innerHTML = timeFormatted;
            
            // If you just have simple buttons, change the text directly:
            if (!nameInput && !timeDisplay) {
                slotContainer.innerText = `${parsedData.name || 'Save ' + i} (${parsedData.time}s)`;
            }

            slotContainer.style.border = "1px solid #666"; 
        } else {
            if (nameInput) nameInput.value = ""; 
            if (timeDisplay) timeDisplay.innerText = "--:--";
            
            if (!nameInput && !timeDisplay) {
                slotContainer.innerText = `Slot ${i}: Empty`;
            }

            slotContainer.style.border = "1px solid transparent";
        }

        if (nameInput) nameInput.readOnly = (action === 'load');
        
        // Attach the click! 🎯
        slotContainer.onclick = () => handleSlotClick(i, savedData !== null);
    }
    
    if (settingsModal) settingsModal.style.display = 'none';
    if (slotModal) slotModal.style.display = 'flex';
}

function handleSlotClick(slotNum, hasData) {
    if (currentAction === 'save') {
        if (hasData) {
            window.showConfirmModal({
                title: "Overwrite Save?",
                message: `Slot ${slotNum} already has a saved game. Do you want to overwrite it?`,
                primaryText: "Overwrite",
                secondaryText: "Cancel",
                onPrimary: () => executeSave(slotNum),
                onSecondary: () => { slotModal.style.display = 'flex'; } 
            });
            slotModal.style.display = 'none'; 
        } else {
            executeSave(slotNum);
        }
    } else if (currentAction === 'load') {
        if (!hasData) return; // Do nothing if trying to load an empty slot
        
        window.showConfirmModal({
            title: "Load Game?",
            message: "Loading this save will overwrite your current board. Are you sure?",
            primaryText: "Load Game",
            secondaryText: "Cancel",
            onPrimary: () => executeLoad(slotNum),
            onSecondary: () => { slotModal.style.display = 'flex'; }
        });
        slotModal.style.display = 'none'; 
    }
}

function executeSave(slotNum) {
    const cells = document.querySelectorAll('.sudoku-grid div, #sudoku-board div'); 
    let boardData = [];
    
    cells.forEach(cell => {
        boardData.push({
            value: cell.innerText || "", 
            isGiven: cell.classList.contains('given') || cell.classList.contains('initial')
        });
    });

    // SAFELY check for a custom name input, otherwise default to "Save X"
    const nameInput = document.getElementById(`slot-${slotNum}-name`);
    const rawName = nameInput ? nameInput.value.trim() : "";
    const finalName = rawName !== "" ? rawName : `Save ${slotNum}`;

    const gameState = {
        name: finalName,
        time: window.currentSeconds || 0,
        board: boardData 
    };
    
    localStorage.setItem(`sudokuSave_${slotNum}`, JSON.stringify(gameState));
    
    // Show a success toast if available
    if(typeof showToast === 'function') showToast(`Game saved to Slot ${slotNum}!`, "success");
    
    slotModal.style.display = 'none';
}

function executeLoad(slotNum) {
    const savedData = localStorage.getItem(`sudokuSave_${slotNum}`);
    if (!savedData) return;

    const gameState = JSON.parse(savedData);
    
    // Restore exact time from when they saved
    if (gameState.time !== undefined) {
        window.currentSeconds = gameState.time;
        const display = document.getElementById('main-timer-display');
        if (display && typeof window.formatTimeWithIcon === 'function') {
            display.innerHTML = window.formatTimeWithIcon(window.currentSeconds);
        }
    }
    
    // Restore Board
    const cells = document.querySelectorAll('.sudoku-grid div, #sudoku-board div');
    if (gameState.board && cells.length > 0) {
        gameState.board.forEach((savedCell, index) => {
            if (cells[index]) {
                cells[index].innerText = savedCell.value;
                cells[index].classList.remove('given', 'initial', 'solved-text', 'error', 'highlight');
                if (savedCell.isGiven) cells[index].classList.add('given'); 
            }
        });
    }
    
    // Silently close
    slotModal.style.display = 'none';
}

// Global reset function so your main game can restart the timer!
window.resetGameTime = function() {
    if (typeof window.resetTimer === 'function') {
        window.resetTimer(); // Calls the master reset in gameLogic.js!
    }
};

document.getElementById('btn-save-game')?.addEventListener('click', () => openSlotMenu('save'));
document.getElementById('btn-load-game')?.addEventListener('click', () => openSlotMenu('load'));