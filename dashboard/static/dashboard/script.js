document.addEventListener('DOMContentLoaded', () => {

    // --- 1. PREMIUM TOAST NOTIFICATION SYSTEM ---
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.custom-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        toast.innerHTML = type === 'error' ? `<i class="fas fa-exclamation-circle"></i> ${message}` : `<i class="fas fa-check-circle"></i> ${message}`;
        
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); 
        }, 3500);
    }

    // --- 2. MODAL & THEME LOGIC (Replaces old Sidebar tabs) ---
    const infoModal = document.getElementById('info-modal');
    const infoBtn = document.getElementById('info-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Open Info/Settings modal
    const openModal = () => infoModal.classList.add('active');
    if (infoBtn) infoBtn.addEventListener('click', openModal);

    // --- DOM ELEMENTS ---

    // --- OPEN / CLOSE MODAL ---
    settingsBtn.addEventListener('click', () => {
        // Force info modal to close just in case
        document.getElementById('info-modal').style.display = 'none'; 
        // Open settings
        settingsModal.style.display = 'flex';
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Close when clicking outside the sheet
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Close Modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => infoModal.classList.remove('active'));
    }
    // Close if clicked outside the sheet
    window.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.classList.remove('active');
    });

    // Theme Toggle (Dark/Light)
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            html.setAttribute('data-theme', newTheme);
            showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} Mode Enabled`);
        });
    }


    // --- 4. INTERACTIVE APP LOGIC ---
    const boardElement = document.getElementById('sudoku-board');
    const solveBtn = document.getElementById('solve-btn');
    const clearBtn = document.getElementById('clear-board-btn');
    const randomBtn = document.getElementById('random-btn'); // Added reference to the new random button
    const csrfTokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
    const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';
    
    let cells = [];
    let activeCell = null; // Tracks which cell the user has tapped
    let solveClickTimer = null;

    // --- Highlighting & Validation Functions ---
    function highlightCrosshair(r, c) {
        removeHighlights();
        const targetBoxR = Math.floor(r / 3);
        const targetBoxC = Math.floor(c / 3);

        cells[r][c].classList.add('highlight-active');

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (i === r && j === c) continue;
                const boxR = Math.floor(i / 3);
                const boxC = Math.floor(j / 3);
                
                if (i === r || j === c || (boxR === targetBoxR && boxC === targetBoxC)) {
                    cells[i][j].classList.add('highlight');
                }
            }
        }
    }

    function removeHighlights() {
        cells.forEach(row => row.forEach(cell => {
            cell.classList.remove('highlight', 'highlight-active');
        }));
    }

    function validateBoard() {
        let hasError = false;
        let isFull = true; // NEW: Track if the board is completely filled
        
        cells.forEach(row => row.forEach(cell => cell.classList.remove('error')));

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = cells[r][c].innerText;
                
                // NEW: If we find even one empty cell, the board is not full yet
                if (!val) {
                    isFull = false;
                    continue;
                }

                const targetBoxR = Math.floor(r / 3);
                const targetBoxC = Math.floor(c / 3);

                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        if (i === r && j === c) continue;
                        const boxR = Math.floor(i / 3);
                        const boxC = Math.floor(j / 3);

                        if (cells[i][j].innerText === val) {
                            if (i === r || j === c || (boxR === targetBoxR && boxC === targetBoxC)) {
                                cells[r][c].classList.add('error');
                                cells[i][j].classList.add('error');
                                hasError = true;
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // THE WIN CONDITION! 🏆
        // ==========================================
        // If there are no red error squares, AND every single box has a number...
        if (!hasError && isFull) {
            triggerWin();
        }

        return hasError; 
    }

    // --- Custom Numpad Input Logic ---
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!activeCell) {
                showToast("Tap a square first", "error");
                return;
            }
            
            if (activeCell.classList.contains('given')) return;
            const val = btn.getAttribute('data-val');
            activeCell.innerText = val; // Works for 1-9 and "" (clear)
            activeCell.classList.remove('solved-text');
            validateBoard();
        });
    });

    // --- Desktop Keyboard Support ---
    document.addEventListener('keydown', (e) => {
        if (!activeCell) return;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            
            e.preventDefault();
            let r = parseInt(activeCell.getAttribute('data-r'));
            let c = parseInt(activeCell.getAttribute('data-c'));
            
            if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
            if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
            if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
            if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
            
            activeCell = cells[r][c];
            highlightCrosshair(r, c);
        }

        if (activeCell && activeCell.classList.contains('given')) {
            return; // prevent editing prefilled cells
        }

        // Number input
        if (/^[1-9]$/.test(e.key)) {
            activeCell.innerText = e.key;
            activeCell.classList.remove('solved-text');
            validateBoard();
        } 
        // Clear cell
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            if (activeCell.classList.contains('given')) return;
            activeCell.innerText = '';
            validateBoard();
        }

    });

    // --- Grid Initialization ---
    function initializeBoard() {
        if (!boardElement) return;
        boardElement.innerHTML = ''; 
        cells = [];

        for (let r = 0; r < 9; r++) {
            let row = [];
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-r', r);
                cell.setAttribute('data-c', c);
                
                if (c === 2 || c === 5) cell.classList.add('border-right');
                if (r === 2 || r === 5) cell.classList.add('border-bottom');
                
                cell.addEventListener('click', () => {
                    if (cell.classList.contains('given')) return
                    activeCell = cell;
                    highlightCrosshair(r, c);
                });

                boardElement.appendChild(cell);
                row.push(cell);
            }
            cells.push(row);
        }
    }

    // --- Win Animation Helper ---
    function triggerWin() {
        
        const sudokuGrid = document.querySelector('.sudoku-grid') || document.getElementById('sudoku-board');
        if (sudokuGrid) {
            sudokuGrid.classList.add('board-win-state');
        }

        // 1. Fire the toast immediately in the main script!
        showToast('Puzzle Solved!', 'success');

        // 2. Pass the baton to gameLogic to save the score and open the menu
        if (typeof window.handleGameWin === 'function') {
            window.handleGameWin(); 
        }
    }

    let clearClickTimer = null;

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {

            if (clearClickTimer) {
                // ==========================================
                // DOUBLE CLICK DETECTED: Show Modal
                // ==========================================
                clearTimeout(clearClickTimer);
                clearClickTimer = null;

                window.showConfirmModal({
                    title: "Clear Entire Board?",
                    message: "This will wipe the board completely blank, removing even the starting numbers. Do you want to just restart the current puzzle instead?",
                    primaryText: "Clear All",
                    secondaryText: "Restart Current",
                    
                    // EXTREME ACTION: Wipe the entire board
                    onPrimary: () => {
                        cells.forEach(row => row.forEach(cell => {
                            cell.innerText = '';
                            cell.classList.remove('given', 'solved-text', 'error', 'highlight');
                            cell.readOnly = false; // unlock cells
                        }));

                        removeHighlights();
                        activeCell = null;
                        document.querySelector('.sudoku-grid')?.classList.remove('board-win-state');
                        showToast('Board fully cleared.', 'success');

                        if (typeof window.resetGameTime === 'function') window.resetGameTime();
                    },
                    
                    // SAFE ACTION: Just clear user inputs
                    onSecondary: () => {
                        clearUserInputsOnly();
                    }
                });

            } else {
                // ==========================================
                // SINGLE CLICK DETECTED: Execute Safe Action
                // ==========================================
                clearClickTimer = setTimeout(() => {
                    clearClickTimer = null;
                    clearUserInputsOnly();
                }, 250);
            }
        });
    }

    // ==========================================
    // HELPER FUNCTION: Clear User Inputs
    // ==========================================
    // We put this in a separate function so we don't have to write it twice!
    function clearUserInputsOnly() {
        cells.forEach(row => row.forEach(cell => {
            // skip given cells
            if (!cell.classList.contains('given')) {
                cell.innerText = '';
            }
            // remove visual states
            cell.classList.remove('solved-text', 'error', 'highlight');
        }));

        removeHighlights();
        activeCell = null;
        document.querySelector('.sudoku-grid')?.classList.remove('board-win-state');

        showToast('Your inputs cleared.', 'success');
    }

    // --- NEW: Random Puzzle Logic ---
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {

            fetch('/get-random-sudoku/')
                .then(response => response.json())
                .then(data => {

                    const puzzleString = data.puzzle;

                    // RESET BOARD FIRST
                    cells.forEach(row => row.forEach(cell => {
                        cell.innerText = '';
                        cell.classList.remove(
                            'given',
                            'error',
                            'highlight',
                            'solved-text'
                        );
                    }));

                    removeHighlights();
                    activeCell = null;

                    document.querySelector('.sudoku-grid')?.classList.remove('board-win-state');

                    // NOW FILL NEW PUZZLE
                    let charIndex = 0;

                    for (let r = 0; r < 9; r++) {
                        for (let c = 0; c < 9; c++) {
                            const cell = cells[r][c];
                            const char = puzzleString[charIndex];

                            if (char !== '0' && char !== '.') {
                                cell.innerText = char;
                                cell.classList.add('given');
                            }
                            charIndex++;
                        }
                    }

                    showToast("New random puzzle loaded!", "success");

                    // ==========================================
                    // 🔥 THE TIMER FIX 🔥
                    // Start it only AFTER the new board is loaded
                    // ==========================================
                    if (window.isTimerActive) {
                        if (typeof window.resetTimer === 'function') window.resetTimer();
                        if (typeof window.startTimer === 'function') window.startTimer();
                    }
                })
                .catch(error => {
                    console.error("Error fetching puzzle:", error);
                    showToast("Failed to load random puzzle.", "error");
                });
        });
    }

    ///--------------------------
    async function solveEntireBoard() {

        if (validateBoard()) {
            showToast("Cannot solve! Fix the red errors first.", "error");
            return;
        }

        const originalHTML = solveBtn.innerHTML;
        solveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Thinking</span>';
        solveBtn.disabled = true;

        let currentGrid = cells.map(row =>
            row.map(cell => cell.innerText === '' ? 0 : parseInt(cell.innerText))
        );

        try {
            const response = await fetch('/solve/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ board: currentGrid })
            });

            const data = await response.json();

            if (response.ok) {
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (cells[r][c].innerText === '') {
                            cells[r][c].innerText = data.solvedBoard[r][c];
                            cells[r][c].classList.add('solved-text');
                        }
                    }
                }

                triggerWin();

            } else {
                showToast(
                    data.error || "Could not solve the puzzle.",
                    'error'
                );
            }

        } catch (error) {
            showToast("Server connection error.", 'error');
        } finally {
            solveBtn.innerHTML = originalHTML;
            solveBtn.disabled = false;
        }
    }

    function getRelatedIndices(index) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        
        let related = new Set();
        
        for (let i = 0; i < 9; i++) {
            related.add(row * 9 + i); // Add entire row
            related.add(i * 9 + col); // Add entire column
        }
        
        // Add entire 3x3 box
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                related.add((boxStartRow + r) * 9 + (boxStartCol + c));
            }
        }
        
        related.delete(index); // Remove the target cell itself from the "reason" list
        return Array.from(related);
    }


    function getSingleHint() {
        // clear old hint highlights
        cells.forEach(row => row.forEach(cell => {
            cell.classList.remove('hint-reason', 'hint-target');
        }));

        // BUILD A 2D ARRAY (Just like solveEntireBoard!)
        let currentGrid = cells.map(row =>
            row.map(cell => cell.innerText === '' ? 0 : parseInt(cell.innerText))
        );

        fetch('/get-hint/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ board: currentGrid }) // Send the 2D array
        })
        .then(response => response.json())
        .then(data => {
            if (data.target_index !== undefined) {
                const index = data.target_index;
                const row = Math.floor(index / 9);
                const col = index % 9;
                const targetCell = cells[row][col];

                if (targetCell.classList.contains('given')) return;

                const reasonIndices = getRelatedIndices(index);

                reasonIndices.forEach(i => {
                    const r = Math.floor(i / 9);
                    const c = i % 9;
                    cells[r][c].classList.add('hint-reason');
                });

                targetCell.classList.add('hint-target');
                targetCell.innerText = data.value;
                targetCell.classList.add('solved-text');

                // --- CHANGED THIS LINE TO SHOW YOUR ENGINE'S LOGIC ---
                // Instead of "Hint added!", we display the engine's thought process
                showToast(data.message, "success");

                if (typeof window.addHintPenalty === 'function') {
                    window.addHintPenalty();
                }

                setTimeout(() => {
                    cells.forEach(row => row.forEach(cell => {
                        cell.classList.remove('hint-reason', 'hint-target');
                    }));
                }, 4000); // Increased to 4 seconds so they have time to read the message!
            } else {
                 showToast(data.error || "Could not find a hint.", "error");
            }
        })
        .catch((err) => {
            console.error(err);
            showToast("Hint failed.", "error");
        });
        validateBoard();
    }

    ///--------------------------


    if (solveBtn) {
        solveBtn.addEventListener('click', () => {

            if (solveClickTimer) {
                // DOUBLE CLICK
                clearTimeout(solveClickTimer);
                solveClickTimer = null;
                window.showConfirmModal({
                    title: "Solve Entire Board?",
                    message: "Are you sure you want to let the AI finish the puzzle?",
                    primaryText: "Solve All",
                    secondaryText: "Just a Hint",
                    onPrimary: () => {
                        solveEntireBoard(); // The extreme action
                    },
                    onSecondary: () => {
                        getSingleHint();    // The safe action, just in case they misclicked!
                    }
                });

            } else {
                // SINGLE CLICK
                solveClickTimer = setTimeout(() => {
                    solveClickTimer = null;
                    getSingleHint();
                }, 250);
            }

        });
    }

    

    // ==========================================
    // 2. SIDEBAR OPEN/CLOSE LOGIC (Smooth Slide)
    // ==========================================
    function openSidebar() {
        if (!infoModal) return;
        infoModal.style.display = 'flex'; // Make it part of the DOM
        
        // Force browser repaint, THEN add active class to trigger CSS transform
        requestAnimationFrame(() => {
            infoModal.classList.add('active');
        });
        
        window.refreshLeaderboardUI();
    }

    function closeSidebar() {
        if (!infoModal) return;
        infoModal.classList.remove('active'); // Triggers slide out
        
        // Wait exactly 350ms (matching our CSS transition time) before hiding
        setTimeout(() => {
            infoModal.style.display = 'none';
        }, 350);
    }

    if (infoBtn) infoBtn.addEventListener('click', openSidebar);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSidebar);
    
    // Close on clicking outside the panel
    if (infoModal) {
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) closeSidebar();
        });
    }

    // ==========================================
    // 3. BUTTERY SMOOTH ACCORDION LOGIC (All Closed by Default)
    // ==========================================
    const accordions = document.querySelectorAll('.info-accordion');

    accordions.forEach((accordion) => {
        // Force the native element open permanently so we can control visibility via CSS
        // (Don't worry, our CSS max-height: 0 completely hides it visually!)
        accordion.setAttribute('open', '');
        
        const summary = accordion.querySelector('summary');
        const content = accordion.querySelector('.accordion-content');

        summary.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the instant snap!

            const isActive = accordion.classList.contains('is-active');

            // 1. Close all accordions first
            accordions.forEach(acc => {
                acc.classList.remove('is-active');
                const cont = acc.querySelector('.accordion-content');
                if(cont) cont.style.maxHeight = '0px'; // Slide up
            });

            // 2. If the one we clicked wasn't active, open it
            if (!isActive) {
                accordion.classList.add('is-active');
                // Calculate exact height needed for buttery smooth drop
                content.style.maxHeight = content.scrollHeight + 60 + "px"; 
            }
        });
    });

    // ==========================================
    // 4. PREMIUM BENCHMARK LOGIC (With Scramble Effect)
    // ==========================================

    // Helper function to animate numbers ticking up smoothly
    function animateValue(obj, start, end, duration, unit, isFloat = true) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentVal = start + (end - start) * easeOutQuart;
            
            // Format the number properly during animation
            const displayVal = isFloat ? currentVal.toFixed(3) : Math.floor(currentVal);
            
            obj.innerHTML = `${displayVal}<span class="stat-unit">${unit}</span>`;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                // Ensure it ends on the exact correct number
                const finalVal = isFloat ? end.toFixed(3) : end;
                // FIXED: We now use finalVal instead of the undefined 'current' variable!
                obj.innerHTML = `${finalVal}<span class="stat-unit">${unit}</span>`;
            }
        };
        window.requestAnimationFrame(step);
    }

    const runBenchmarkBtn = document.getElementById('run-benchmark-btn');
    let scrambleInterval; // Variable to hold our animation timer
    
    if (runBenchmarkBtn) {
        runBenchmarkBtn.addEventListener('click', async () => {
            const sampleSizeInput = document.getElementById('sample-size');
            const benchmarkProgress = document.getElementById('benchmark-progress');
            const btnText = runBenchmarkBtn.querySelector('.btn-text');
            
            const requestedSize = parseInt(sampleSizeInput.value) || 50;
            const statCards = document.querySelectorAll('.stat-card');
            const statValues = [
                document.getElementById('avg-time'),
                document.getElementById('accuracy-score'),
                document.getElementById('total-time')
            ];
            
            // --- UI STATE: CRUNCHING DATA ---
            runBenchmarkBtn.disabled = true;
            btnText.innerText = `Compiling...`;
            benchmarkProgress.innerText = `Engine analyzing ${requestedSize} matrices...`;
            benchmarkProgress.style.color = '#6366f1'; // Indigo
            
            // Add glowing borders
            statCards.forEach(card => card.classList.add('is-crunching'));

            // The "Hacker Scramble" effect while we wait for Python
            const chars = '0123456789!@#$%^&*';
            scrambleInterval = setInterval(() => {
                statValues.forEach((el, index) => {
                    // Keep the unit (ms, %, s) intact, scramble the numbers
                    const unit = index === 0 ? 'ms' : index === 1 ? '%' : 's';
                    const randomStr = chars.split('').sort(() => 0.5 - Math.random()).join('').substring(0, 3);
                    el.innerHTML = `${randomStr}<span class="stat-unit">${unit}</span>`;
                });
            }, 40); // Updates extremely fast to look like computational power

            try {
                const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
                const token = csrfMetaTag ? csrfMetaTag.getAttribute('content') : '';

                // Create a minimum 1.5-second delay timer for dramatic effect
                const minimumDelay = new Promise(resolve => setTimeout(resolve, 1500));

                // Start BOTH the server request and the timer at the same time
                const [response] = await Promise.all([
                    fetch('/benchmark/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
                        body: JSON.stringify({ sample_size: requestedSize })
                    }),
                    minimumDelay // Code pauses here until 1.5 seconds have passed
                ]);

                const data = await response.json();

                // Stop the scrambler exactly when data arrives AND 1.5s has passed
                clearInterval(scrambleInterval);
                statCards.forEach(card => card.classList.remove('is-crunching'));

                if (response.ok) {
                    const totalTimeSec = (data.avg_time_ms * requestedSize) / 1000;

                    // Trigger the sleek easing animations!
                    animateValue(statValues[0], 0, data.avg_time_ms, 1500, ' ms', false);
                    animateValue(statValues[1], 0, data.accuracy, 1500, ' %', false);
                    animateValue(statValues[2], 0, totalTimeSec, 1500, ' s', true);
                    
                    btnText.innerText = `Run Again`;
                    benchmarkProgress.innerText = `Simulation Complete.`;
                    benchmarkProgress.style.color = '#4ade80'; 
                } else {
                    throw new Error("Server response failed");
                }
            } catch (error) {
                clearInterval(scrambleInterval);
                statCards.forEach(card => card.classList.remove('is-crunching'));
                
                // Reset numbers to dashes on fail
                statValues[0].innerHTML = `--<span class="stat-unit">ms</span>`;
                statValues[1].innerHTML = `--<span class="stat-unit">%</span>`;
                statValues[2].innerHTML = `--<span class="stat-unit">s</span>`;

                benchmarkProgress.innerText = "Connection Failed.";
                benchmarkProgress.style.color = '#f87171'; 
                btnText.innerText = `Retry Test`;
            } finally {
                runBenchmarkBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // DYNAMIC CONFIRMATION MODAL LOGIC
    // ==========================================
    const confirmModal = document.getElementById('dynamic-confirm-modal');
    const titleEl = document.getElementById('dynamic-title');
    const messageEl = document.getElementById('dynamic-message');
    const primaryBtn = document.getElementById('dynamic-btn-primary');
    const secondaryBtn = document.getElementById('dynamic-btn-secondary');
    const closeX = document.getElementById('dynamic-close-btn');

// The Master Function to call anywhere in your code
    window.showConfirmModal = function(options) {
        // 1. Set the text
        titleEl.innerText = options.title || "Confirm Action";
        messageEl.innerText = options.message || "Are you sure you want to proceed?";
        
        primaryBtn.innerText = options.primaryText || "Yes";
        secondaryBtn.innerText = options.secondaryText || "Cancel";

        // 2. Assign the Primary Action (e.g., "Solve All", "Overwrite Save")
        primaryBtn.onclick = () => {
            if (options.onPrimary) options.onPrimary();
            closeConfirmModal();
        };

        // 3. Assign the Secondary Action (e.g., "Give Hint", "Restart Current")
        secondaryBtn.onclick = () => {
            if (options.onSecondary) options.onSecondary();
            closeConfirmModal();
        };

        // 4. Show the modal
        confirmModal.style.display = 'flex';
    };

    // Helper to close the modal safely
    function closeConfirmModal() {
        confirmModal.style.display = 'none';
        // Clear out the functions so they don't accidentally fire later
        primaryBtn.onclick = null;
        secondaryBtn.onclick = null;
    }

    // --- Close Modal Triggers (The 3rd Option to "Get Away") ---
    
    // Clicking the "X"
    if (closeX) closeX.addEventListener('click', closeConfirmModal);

    // Clicking the dark background overlay
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                closeConfirmModal();
            }
        });
    }

    
        

    initializeBoard();
});