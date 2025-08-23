      console.log(" slotmachine.js geladen");
      // === CHEAT FLAG ===
      window.forceDiamonds = false;

      class SlotMachine {
        constructor() {
          this.initializeProperties();
          this.initializeThemes();
          this.initializeElements();
          this.initializeEventListeners();
          this.initializeNewFeatures();
          this.loadGameState();
          this.updateDisplays();
          this.refreshStatsDisplay();
          this.updateLimitNotice();
          this.checkInitialBetLimitNotice();
          this.showWelcomeMessage();
          this.updateProgressiveJackpot();
          this.renderAchievements();
          this.applyTheme(this.currentTheme, true);
          this.updateLineCostsUI();
        }

        /* ========= GRUNDEINSTELLUNGEN / STATE ========= */
        initializeProperties() {
          this.balance = 10000;
          this.highscore = 10000;
          this.spinCount = 0;
          this.currentAutoSpin = 0;
          this.winStreak = 0;
          this.lastWinAmount = 0;

          this.freeSpins = 0;
          this.totalFreeSpinWinnings = 0;
          this.inFreeSpinMode = false;
          this.probsAreBoosted = false;

          this.autoActive = false;
          this.autoSpinCooldown = false;
          this.spinIsRunning = false;
          this.autoInterval = null;
          this.maxAutoSpins = 69;

          this.spinLimitThreshold = 10;
          this.maxLimitedBet = 500;

          this.bufferCount = 10;
          this.baseSymbols = ['🍆', '🍒', '🦄', '🔥', '6️⃣', '9️⃣', '🏎️', '📖', '🎁'];
          this.allSymbols = [...this.baseSymbols];
          this.allSymbolsNoFire = this.baseSymbols.filter(s => s !== '🔥');

          this.activeLines = [true, true, true, true, true];
          this.historyEntries = [];
          this.stats = { totalSpins:0, totalWins:0, totalLosses:0, totalBet:0, totalWon:0 };

          this.previousVolume = 0.3;
          this.secretPassword = 'admin';
          this.easterEggCode = 'FSG2025';

          this.progressiveJackpot = 50000;
          this.currentMultiplier = 1;
          this.multiplierActive = false;
          this.multiplierSpinsRemaining = 0;

          this.mysteryBoxActive = false;
          this.achievements = {
            firstWin:      { unlocked: false, title: "Erster Gewinn",           desc: "Gewinne zum ersten Mal",                  reward: 500,   icon: "🎯" },
            bigWinner:     { unlocked: false, title: "Großer Gewinner",         desc: "Gewinne 10.000 Credits auf einmal",       reward: 2000,  icon: "💰" },
            luckyStreak:   { unlocked: false, title: "Glückssträhne",           desc: "Gewinne 5 Mal hintereinander",            reward: 5000,  icon: "🔥" },
            jackpotHunter: { unlocked: false, title: "Jackpot Jäger",           desc: "Knacke den Progressive Jackpot",          reward: 10000, icon: "🎰" },
            spinMaster:    { unlocked: false, title: "Spin Meister",            desc: "Erreiche 100 Spins",                      reward: 3000,  icon: "🌟" },
            mysterySeeker: { unlocked: false, title: "Mystery Sucher",          desc: "Öffne 5 Mystery Boxen",                   reward: 4000,  icon: "🎁" },
            wheelOfFortune:{ unlocked: false, title: "Glücksrad Champion",      desc: "Gewinne das Maximum am Glücksrad",        reward: 7500,  icon: "🎡" },
            millionaire:   { unlocked: false, title: "Millionär",               desc: "Erreiche 1.000.000 Credits",              reward: 50000, icon: "💎" }
          };
          this.mysteryBoxCount = 0;
          this.wheelSpinning = false;

          this.currentTheme = localStorage.getItem('slotTheme') || 'casino';

          /* 🪜 Leiter-States */
          this.ladderActive = false;
          this.ladderSteps = [];
          this.ladderIndex = 0;
          this.ladderCap = 0;
          this.ladderSeed = 0;
        }

        /* ========= THEME-MAPPING ========= */
        initializeThemes() {
          this.themes = {
            casino: {
              class: 'theme-casino',
              map: { '🍆':'🍆','🍒':'🍒','🦄':'🦄','🔥':'🔥','6️⃣':'6️⃣','9️⃣':'9️⃣','🏎️':'🏎️','📖':'📖','🎁':'🎁','💎':'💎' }
            },
            de: {
              class: 'theme-de',
              map: { '🍆':'🥨','🍒':'🍺','🦄':'🦅','🔥':'🔥','6️⃣':'6️⃣','9️⃣':'9️⃣','🏎️':'🚗','📖':'📜','🎁':'🎁','💎':'💎' }
            },
            at: {
              class: 'theme-at',
              map: { '🍆':'⛰️','🍒':'🍰','🦄':'🎿','🔥':'🔥','6️⃣':'6️⃣','9️⃣':'9️⃣','🏎️':'🚞','📖':'📖','🎁':'🎁','💎':'💎' }
            },
            fr: {
              class: 'theme-fr',
              map: { '🍆':'🥖','🍒':'🍷','🦄':'🗼','🔥':'🔥','6️⃣':'6️⃣','9️⃣':'9️⃣','🏎️':'🚴','📖':'📘','🎁':'🎁','💎':'💎' }
            },
            cz: {
              class: 'theme-cz',
              map: { '🍆':'🏰','🍒':'🍺','🦄':'🦌','🔥':'🔥','6️⃣':'6️⃣','9️⃣':'9️⃣','🏎️':'🚋','📖':'📗','🎁':'🎁','💎':'💎' }
            }
          };
        }

        themeMap(sym) {
          const t = this.themes[this.currentTheme];
          return (t && t.map[sym]) ? t.map[sym] : sym;
        }

        applyTheme(theme, firstRun = false) {
          if (!this.themes[theme]) return;
          if (!firstRun && (this.spinIsRunning || this.autoActive || this.elements.gambleArea.style.display !== 'none' || this.ladderActive)) {
            this.elements.themeLockMsg.textContent = '🔒 Theme-Wechsel nur möglich, wenn kein Spin/Autospin/Gamble/Leiter läuft.';
            setTimeout(() => this.elements.themeLockMsg.textContent = '', 2000);
            return;
          }
          if (!firstRun) document.body.classList.add('theme-fade');

          setTimeout(() => {
            document.body.classList.remove(...Object.values(this.themes).map(t => t.class));
            document.body.classList.add(this.themes[theme].class);
            this.currentTheme = theme;
            localStorage.setItem('slotTheme', theme);

            document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
            document.querySelectorAll('.symbol').forEach(el => {
              const base = el.dataset.base || el.textContent.trim();
              el.textContent = this.themeMap(base);
            });

            if (!firstRun) setTimeout(() => document.body.classList.remove('theme-fade'), 50);
          }, firstRun ? 0 : 220);
        }

        /* ========= DOM ========= */
        initializeElements() {
          this.reels = ['reel1','reel2','reel3','reel4','reel5'].map(id => document.getElementById(id));
          this.elements = {
            spinButton: document.getElementById('spinButton'),
            resetButton: document.getElementById('resetButton'),
            autoButton: document.getElementById('autoSpinButton'),
            autoStatus: document.getElementById('autoSpinStatus'),
            betInput: document.getElementById('betInput'),
            lever: document.getElementById('lever'),
            message: document.getElementById('message'),
            balance: document.getElementById('balance'),
            highscore: document.getElementById('highscore'),
            statsDisplay: document.getElementById('statsDisplay'),
            limitNotice: document.getElementById('limitNotice'),
            freeSpinStats: document.getElementById('freeSpinStats'),
            historyList: document.getElementById('historyList'),
            volumeControl: document.getElementById('volumeControl'),
            muteToggle: document.getElementById('muteToggle'),
            probSum: document.getElementById('probSum'),
            probabilitiesPanel: document.getElementById('probabilities'),
            riskAccept: document.getElementById('riskAccept'),
            riskCancel: document.getElementById('riskCancel'),
            gambleArea: document.getElementById('gambleArea'),
            gambleResult: document.getElementById('gambleResult'),
            gambleRed: document.getElementById('gambleRed'),
            gambleBlack: document.getElementById('gambleBlack'),
            passwordOverlay: document.getElementById('passwordOverlay'),
            pwInput: document.getElementById('pwInput'),
            pwSubmit: document.getElementById('pwSubmit'),
            progressiveAmount: document.getElementById('progressiveAmount'),
            multiplierDisplay: document.getElementById('multiplierDisplay'),
            multiplierValue: document.getElementById('multiplierValue'),
            mysteryBox: document.getElementById('mysteryBox'),
            mysteryPrize: document.getElementById('mysteryPrize'),
            mysteryText: document.getElementById('mysteryText'),
            luckyWheelContainer: document.getElementById('luckyWheelContainer'),
            luckyWheel: document.getElementById('luckyWheel'),
            wheelResult: document.getElementById('wheelResult'),
            achievementsList: document.getElementById('achievementsList'),
            themeButtons: document.querySelectorAll('.theme-btn'),
            themeLockMsg: document.getElementById('themeLockMsg'),
            multiplierBadge: document.getElementById('multiplierBadge'),
            multiplierBadgeValue: document.getElementById('multiplierBadgeValue'),

            /* 🪜 Leiter */
            ladderButton: document.getElementById('ladderButton'),
            ladderOverlay: document.getElementById('ladderOverlay'),
            ladderList: document.getElementById('ladderList'),
            ladderUp: document.getElementById('ladderUp'),
            ladderTake: document.getElementById('ladderTake'),
            ladderCancel: document.getElementById('ladderCancel'),
            ladderCap: document.getElementById('ladderCap'),
            ladderStart: document.getElementById('ladderStart'),
            ladderFoot: document.getElementById('ladderFoot'),
          };
          this.sounds = {
            spin: document.getElementById('sound-spin'),
            jackpot: document.getElementById('sound-jackpot'),
            fala: document.getElementById('sound-fala'),
            bg: document.getElementById('sound-bg')
          };
          Object.values(this.sounds).forEach(a => a.volume = parseFloat(this.elements.volumeControl.value));
        }

        /* ========= PERIODISCH ========= */
        initializeNewFeatures() {
          setInterval(() => {
            if (!this.spinIsRunning) {
              this.progressiveJackpot += Math.floor(Math.random() * 50) + 10;
              this.updateProgressiveJackpot();
            }
          }, 3000);

          setInterval(() => {
            if (this.multiplierActive && this.multiplierSpinsRemaining > 0) {
              this.updateMultiplierDisplay();
            }
          }, 100);
        }

        /* ========= EVENTS ========= */
        initializeEventListeners() {
          this.elements.spinButton.addEventListener('click', () => this.spin());
          this.elements.resetButton.addEventListener('click', () => this.resetGame());
          this.elements.autoButton.addEventListener('click', () => this.toggleAutoSpin());
          this.elements.lever.addEventListener('click', () => this.handleLeverClick());

          this.elements.betInput.addEventListener('input', () => {
            this.checkInitialBetLimitNotice();
            this.updateLineCostsUI();
          });

          this.elements.volumeControl.addEventListener('input', () => this.updateVolume());
          this.elements.muteToggle.addEventListener('click', () => this.toggleMute());
          this.sounds.bg.addEventListener('timeupdate', () => this.handleBgMusicLoop());

          this.initializeProbabilityInputs();
          this.initializeLineToggles();
          this.initializeGambleSystem();
          this.initializeKeyboardControls();
          this.initializePasswordSystem();

          window.spinWheel = () => this.spinLuckyWheel();

          this.elements.themeButtons.forEach(btn => btn.addEventListener('click', () => this.applyTheme(btn.dataset.theme)));
          this.elements.themeButtons.forEach(b => b.classList.toggle('active', b.dataset.theme === this.currentTheme));

          /* 🪜 Leiter: Button + Aktionen */
          this.elements.ladderButton.addEventListener('click', () => this.openLadder());
          this.elements.ladderUp.addEventListener('click', () => this.ladderStepUp());
          this.elements.ladderTake.addEventListener('click', () => this.ladderTakeWin());
          this.elements.ladderCancel.addEventListener('click', () => this.closeLadder(true));
        }

        initializeProbabilityInputs() {
          const ids = ['prob1','prob2','prob3','prob4','probBook','probMystery','prob5','prob6','prob7','prob8','prob9'];
          ids.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', () => this.updateProbabilitySum()); });
          this.updateProbabilitySum();
        }

        initializeLineToggles() {
          const box = document.getElementById('lineSelection');
          if (!box) return;

          // Delegation: klappt auch, wenn Buttons später neu gerendert würden
          box.addEventListener('click', (e) => {
            const btn = e.target.closest('.line-toggle');
            if (!btn) return;

            // UI toggeln
            btn.classList.toggle('active');

            // internen Zustand aus DOM ableiten & synchronisieren
            const line = parseInt(btn.dataset.line, 10);
            this.activeLines[line] = btn.classList.contains('active');

            // Feedback & Kosten neu berechnen
            this.highlightLine?.(line);               // falls du die Linie visuell hervorhebst
            btn.classList.add('flash');
            setTimeout(() => btn.classList.remove('flash'), 400);

            this.updateLineCostsUI();
            this.checkInitialBetLimitNotice();
          });

          // Initiale Anzeige korrekt setzen (aus DOM statt nur aus Array)
          this.syncActiveLinesFromDOM();
          this.updateLineCostsUI();
        }

          syncActiveLinesFromDOM() {
          const buttons = [...document.querySelectorAll('.line-toggle')];
          buttons.forEach(b => {
            const i = parseInt(b.dataset.line, 10);
            this.activeLines[i] = b.classList.contains('active');
          });
        }



        getActiveLineCount() {
          // robust: direkt aus DOM zählen
          return document.querySelectorAll('.line-toggle.active').length || 0;
        }

        updateLineCostsUI() {
          // internen Zustand mit DOM synchron halten (falls woanders getoggelt wurde)
          this.syncActiveLinesFromDOM();

          const lineBet = parseInt(this.elements.betInput.value, 10) || 0;
          const lines   = this.getActiveLineCount();
          const effective = lineBet * Math.max(lines, 0);

          const a = document.getElementById('activeLinesCount');
          const e = document.getElementById('effectiveBet');
          if (a) a.textContent = lines;
          if (e) e.textContent = effective.toLocaleString('de-DE');
        }


        initializeGambleSystem() { /* Gamble abgeschaltet */ }


        /* ========= GAMBLE-UI (fehlende Methoden) ========= */
        showGambleOptions(_amount) { /* Gamble abgeschaltet */ }
        hideGambleOptions() { /* Gamble abgeschaltet */ }

        // Optional – falls du irgendwo explizit "Area zeigen" nutzt:
        showGambleArea() {
          if (!this.elements.gambleArea) return;
          this.elements.gambleArea.style.display = 'block';
          this.updateSpinButtonState();
        }

        /* ========= GAMBLE-LOGIK (Buttons) ========= */
        gambleColor(color) {
          if (!this.elements.gambleArea || !this.pendingGambleWin) return;
          const win = Math.random() < 0.5; // 50/50
          if (win) {
            const payout = this.pendingGambleWin * 2;
            this.balance += payout;
            this.updateDisplays();
            this.elements.gambleResult.textContent =
              `✅ ${color === 'red' ? 'Rot' : 'Schwarz'} getroffen! +${payout.toLocaleString('de-DE')} Credits`;
            this.playJackpotSound();
          } else {
            this.elements.gambleResult.textContent = '❌ Verloren! Gewinn ist weg.';
          }
          // Ende der Gamble-Runde
          this.pendingGambleWin = 0;
          setTimeout(() => this.hideGambleOptions(), 900);
        }

        gambleSuit(suit) {
          if (!this.elements.gambleArea || !this.pendingGambleWin) return;
          const win = Math.random() < 0.25; // 1/4
          if (win) {
            const payout = this.pendingGambleWin * 4;
            this.balance += payout;
            this.updateDisplays();
            this.elements.gambleResult.textContent =
              `✅ ${suit} getroffen! +${payout.toLocaleString('de-DE')} Credits`;
            this.playJackpotSound();
          } else {
            this.elements.gambleResult.textContent = '❌ Verloren! Gewinn ist weg.';
          }
          this.pendingGambleWin = 0;
          setTimeout(() => this.hideGambleOptions(), 900);
        }


        initializeKeyboardControls() {
          document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.elements.spinButton.disabled && !this.autoActive) { e.preventDefault(); this.handleLeverClick(); }
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
              e.preventDefault();
              this.elements.pwInput.value = '';
              this.elements.passwordOverlay.style.display = 'flex';
              setTimeout(() => this.elements.pwInput.focus(), 100);
            }
            if (this.ladderActive) {
              if (e.key === 'ArrowUp') { e.preventDefault(); this.ladderStepUp(); }
              if (e.key === 'Enter')   { e.preventDefault(); this.ladderTakeWin(); }
              if (e.key === 'Escape')  { e.preventDefault(); this.closeLadder(true); }
            }
          });
        }

        initializePasswordSystem() {
          this.elements.pwSubmit.addEventListener('click', () => this.handlePasswordSubmit());
          this.elements.pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handlePasswordSubmit(); });
        }

        /* ========= PERSISTENZ ========= */
        loadGameState() {
          const b = parseInt(localStorage.getItem('slotBalance'), 10);
          const h = parseInt(localStorage.getItem('slotHighscore'), 10);
          const s = localStorage.getItem('slotStats');
          const a = localStorage.getItem('slotAchievements');
          const j = parseInt(localStorage.getItem('slotProgressiveJackpot'), 10);
          const t = localStorage.getItem('slotTheme');

          if (!isNaN(b)) this.balance = b;
          if (!isNaN(h)) this.highscore = h;
          if (s) this.stats = JSON.parse(s);
          if (a) this.achievements = JSON.parse(a);
          if (!isNaN(j)) this.progressiveJackpot = j;
          if (t) this.currentTheme = t;
        }
        saveGameState() {
          localStorage.setItem('slotBalance', this.balance);
          localStorage.setItem('slotHighscore', this.highscore);
          localStorage.setItem('slotStats', JSON.stringify(this.stats));
          localStorage.setItem('slotAchievements', JSON.stringify(this.achievements));
          localStorage.setItem('slotProgressiveJackpot', this.progressiveJackpot);
          localStorage.setItem('slotTheme', this.currentTheme);
        }

        /* ========= UI ========= */
        showWelcomeMessage() { this.elements.message.innerHTML = ' 🎯 Willkommen! Setze deinen Einsatz und drehe die Walzen. Viel Glück! '; }
        updateSpinButtonState() {
        const isDisabled =
          this.autoActive ||
          this.balance <= 0 ||
          this.spinIsRunning ||
          this.ladderActive;
          this.elements.spinButton.disabled = isDisabled;
          const themeLocked = this.spinIsRunning || this.autoActive || this.elements.gambleArea.style.display !== 'none' || this.ladderActive;
          document.querySelectorAll('.theme-btn').forEach(b => b.disabled = themeLocked);
          this.elements.ladderButton.disabled = this.ladderActive || this.spinIsRunning || this.autoActive;
        }
        updateDisplays() {
          this.elements.balance.textContent = `${this.balance.toLocaleString('de-DE')} Credits`;
          if (this.balance > this.highscore) this.highscore = this.balance;
          this.elements.highscore.textContent = `${this.highscore.toLocaleString('de-DE')} Credits`;
          this.saveGameState();
          this.checkAchievements();
        }
        refreshStatsDisplay() {
          const wr = this.stats.totalSpins > 0 ? ((this.stats.totalWins / this.stats.totalSpins) * 100).toFixed(1) : 0;
          this.elements.statsDisplay.innerHTML =
            `Spins: ${this.stats.totalSpins} | Gewinne: ${this.stats.totalWins} | Verluste: ${this.stats.totalLosses}
            <br>Gesamt-Einsatz: ${this.stats.totalBet.toLocaleString('de-DE')} | Gesamt-Gewinn: ${this.stats.totalWon.toLocaleString('de-DE')} | Winrate: ${wr}%`;
        }
        updateLimitNotice() {
          const remaining = this.spinLimitThreshold - this.spinCount;
          if (remaining > 0) {
            this.elements.limitNotice.textContent = `🔒 Einsatzlimit ${this.maxLimitedBet} aktiv – noch ${remaining} Spin${remaining===1?'':'s'} übrig`;
            this.elements.limitNotice.style.display = 'block';
          } else this.elements.limitNotice.style.display = 'none';
        }
        checkInitialBetLimitNotice(){
          const lineBet = parseInt(this.elements.betInput.value,10);
          const lines = this.getActiveLineCount();
          const effectiveBet = (isNaN(lineBet)?0:lineBet) * lines;
          const invalid = (
              this.spinCount < this.spinLimitThreshold && effectiveBet > this.maxLimitedBet
          ) || isNaN(lineBet) || lineBet < 1 || effectiveBet < 1 || effectiveBet > this.balance;
          if (invalid) {
              this.elements.message.textContent = `🔒 Einsatzlimit! Maximal erlaubt: ${this.maxLimitedBet} Credits (effektiv).`;
              this.elements.betInput.classList.add('invalid-bet');
          } else {
              if (this.elements.message.textContent.includes('🔒 Einsatzlimit!')) this.showWelcomeMessage();
              this.elements.betInput.classList.remove('invalid-bet');
          }
        }
        updateVolume() {
          const v = parseFloat(this.elements.volumeControl.value);
          Object.values(this.sounds).forEach(a => a.volume = v);
          this.elements.muteToggle.textContent = v === 0 ? '🔇' : '🔊';
        }
        toggleMute() {
          if (this.elements.volumeControl.value > 0) {
            this.previousVolume = this.elements.volumeControl.value;
            this.elements.volumeControl.value = 0;
          } else {
            this.elements.volumeControl.value = this.previousVolume || 0.3;
          }
          this.updateVolume();
        }
        handleBgMusicLoop() {
          if (this.sounds.bg.currentTime >= 120) {
            this.sounds.bg.currentTime = 0;
            this.sounds.bg.play();
          }
        }
        updateProbabilitySum() {
          const ids = ['prob1','prob2','prob3','prob4','probBook','probMystery','prob5','prob8','prob9','prob6','prob7'];
          let total = 0;
          ids.forEach(id => {
            const el = document.getElementById(id);
            let v = parseFloat(el?.value);
            if (isNaN(v) || v < 0) v = 0;
            total += v;
          });
          if (total > 100) {
            const scale = 100 / total;
            ids.forEach(id => {
              const el = document.getElementById(id);
              if (el) {
                let v = parseFloat(el.value);
                v = isNaN(v) || v < 0 ? 0 : v * scale;
                el.value = v.toFixed(1);
              }
            });
            total = 100;
          }
          if (this.elements.probSum) {
            this.elements.probSum.textContent = `Summe: ${total.toFixed(1)}%`;
            this.elements.probSum.style.color = total > 100 ? '#f55' : '#0f0';
          }
        }

        /* ========= SPIN ========= */
        handleLeverClick() {
          if (!this.elements.spinButton.disabled) {
            this.elements.lever.classList.add('pulled');
            setTimeout(() => this.elements.lever.classList.remove('pulled'), 300);
            this.spin();
          }
        }
        getRandomSymbol() {
          const pool = this.inFreeSpinMode ? this.allSymbolsNoFire : this.allSymbols;
          return pool[Math.floor(Math.random() * pool.length)];
        }
        generateRandomResult() {
          // Cheat-Option: Immer 5x Diamanten, wenn Flag aktiv
          if (window.forceDiamonds) {
            return ['💎','💎','💎','💎','💎'];
          }


          if (Math.random() < 0.001) return ['💎','💎','💎','💎','💎'];

          const probs = this.getProbabilities();
          const r = Math.random();
          const t = this.calculateThresholds(probs);

          if (!this.inFreeSpinMode) {
            if (r < t[0]) return ['🔥','🔥','🔥','🔥','🔥'];
            else if (r < t[1]) return ['🔥','🔥','🏎️','🔥','🔥'];
          }

          if (r < t[2]) return ['6️⃣','9️⃣','🏎️','6️⃣','9️⃣'];
          else if (r < t[3]) return ['🦄','🦄','🦄','🦄','🦄'];
          else if (r < t[4]) return ['📖','📖','📖','📖','📖'];
          else if (r < t[5]) return ['🎁','🎁','🎁','🎁','🎁'];
          else if (r < t[6]) return this.generateSameSymbols(3);
          else if (r < t[7]) return ['6️⃣','9️⃣','🍒','6️⃣','9️⃣'];
          else if (r < t[8]) return this.generateTwoSame();
          else if (r < t[9]) return this.generateSameSymbols(4);
          else if (r < t[10]) return this.generateSameSymbols(5);

          return this.generateRandomLoss();
        }
        getProbabilities() {
          const p = [
            parseFloat(document.getElementById('prob1')?.value) || 0,
            parseFloat(document.getElementById('prob2')?.value) || 0,
            parseFloat(document.getElementById('prob3')?.value) || 0,
            parseFloat(document.getElementById('prob4')?.value) || 0,
            parseFloat(document.getElementById('probBook')?.value) || 0,
            parseFloat(document.getElementById('probMystery')?.value) || 0,
            parseFloat(document.getElementById('prob5')?.value) || 0,
            parseFloat(document.getElementById('prob6')?.value) || 0,
            parseFloat(document.getElementById('prob7')?.value) || 0,
            parseFloat(document.getElementById('prob8')?.value) || 0,
            parseFloat(document.getElementById('prob9')?.value) || 0
          ];
          if (this.balance >= 100000000) p[0] *= 5;
          else if (this.balance >= 1000000) p[0] *= 3;
          if (this.inFreeSpinMode && !this.probsAreBoosted) {
            for (let i = 0; i < p.length; i++) p[i] *= 3;
            this.probsAreBoosted = true;
          }
          if (this.multiplierActive) {
            for (let i = 2; i < p.length; i++) p[i] *= 1.5;
          }
          return p;
        }
        calculateThresholds(p) {
          const th = []; let total = 0;
          for (let i = 0; i < p.length; i++) { total += p[i] / 100; th.push(total); }
          return th;
        }
        generateSameSymbols(count) {
          const src = ['🍆','🍒','🦄','6️⃣','9️⃣','🏎️'];
          const sym = src[Math.floor(Math.random() * src.length)];
          const result = Array(5).fill(this.getRandomSymbol());
          for (let i = 0; i < count; i++) result[i] = sym;
          return result;
        }
        generateTwoSame() {
          const two = ['🍆','🍒','🦄','🏎️','📖'][Math.floor(Math.random() * 5)];
          const others = Array(3).fill(null).map(() => this.getRandomSymbol());
          const res = [two, two, ...others];
          return this.shuffleArray(res);
        }
        generateRandomLoss() {
          const pool = this.inFreeSpinMode ? this.allSymbolsNoFire : this.allSymbols;
          let res; let tries = 0;
          do { res = Array(5).fill(null).map(() => pool[Math.floor(Math.random() * pool.length)]); tries++; }
          while (this.hasWinningCombination(res) && tries < 100);
          return res;
        }
        hasWinningCombination(arr) {
          const [a,b,c] = arr;
          return (a===b && b===c) || (a==='🔥' && b==='🔥' && c==='🔥');
        }
        shuffleArray(a) { const s=[...a]; for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [s[i],s[j]]=[s[j],s[i]];} return s; }

        validateSpin(){
          if (this.balance <= 0) { this.elements.message.textContent = '💸 Kein Guthaben! Bitte Reset.'; this.spinIsRunning = false; this.updateSpinButtonState(); return false; }
          if (this.spinIsRunning || this.ladderActive) return false;
          const lineBet = parseInt(this.elements.betInput.value,10);
          const lines = this.getActiveLineCount();
          const effectiveBet = (isNaN(lineBet)?0:lineBet) * lines;
          if (this.spinCount < this.spinLimitThreshold && effectiveBet > this.maxLimitedBet) { this.elements.message.textContent = `🔒 Einsatz limitiert! Max ${this.maxLimitedBet} (effektiv).`; return false; }
          if (isNaN(lineBet) || lineBet < 1 || effectiveBet < 1 || effectiveBet > this.balance) { this.elements.message.textContent = '⚠️ Ungültiger Einsatz!'; return false; }
          return true;
        }
        prepareSpin(){
          this.spinIsRunning = true; this.updateSpinButtonState(); this.elements.betInput.disabled = true;
          const lineBet = parseInt(this.elements.betInput.value,10);
          const lines = this.getActiveLineCount();
          const effectiveBet = lineBet * lines;
          this.spinCount++; this.updateLimitNotice();
          if (!this.inFreeSpinMode) this.balance -= effectiveBet;
          this.updateDisplays();
          this.elements.message.textContent = `🎰 Die Walzen drehen sich… (Linieneinsatz: ${lineBet.toLocaleString('de-DE')}, Linien: ${lines}, effektiv: ${effectiveBet.toLocaleString('de-DE')})`;
          this.hideGambleOptions();
        }

        spin() {
          if (!this.validateSpin()) return;
          this.prepareSpin();

          const lineBet = parseInt(this.elements.betInput.value,10);
          const effectiveBet = lineBet * this.getActiveLineCount();

          // Progressive wächst mit Einsatz
          this.progressiveJackpot += Math.floor(effectiveBet * 0.02);
          this.updateProgressiveJackpot();

          const results = this.generateRandomResult();
          this.animateReels(results);
          this.playSpinSound();

          setTimeout(() => {
            this.evaluateSpinResults(results, lineBet);
            this.completeSpin();

            // Multiplier-Ticks
            if (this.multiplierActive && this.multiplierSpinsRemaining > 0) {
              this.multiplierSpinsRemaining--;
              if (this.multiplierSpinsRemaining === 0) this.deactivateMultiplier();
            }
          }, 1800);
        }

        completeSpin() {
          this.spinIsRunning = false;
          this.updateSpinButtonState();
          this.elements.betInput.disabled = this.inFreeSpinMode;
        }

        generateReelStrip(targetBase) {
          const strip = [];
          for (let j = 0; j < this.bufferCount; j++) strip.push(this.getRandomSymbol());
          strip.push(this.getRandomSymbol());
          strip.push(targetBase);
          strip.push(this.getRandomSymbol());
          for (let j = 0; j < this.bufferCount - 1; j++) strip.push(this.getRandomSymbol());
          return strip;
        }

        animateReels(results) {
          this.reels.forEach((reel, i) => {
            const strip = this.generateReelStrip(results[i]);
            reel.innerHTML = strip.map(base => `<div class="symbol" data-base="${base}">${this.themeMap(base)}</div>`).join('');
            reel.style.transition = 'none';
            reel.style.transform = 'translateY(0)';
            void reel.offsetWidth;
            const sample = reel.children[0];
            const symbolHeight = sample ? sample.getBoundingClientRect().height : 80;
            const scrollY = this.bufferCount * symbolHeight;
            setTimeout(() => {
              reel.style.transition = 'transform 1.6s cubic-bezier(0.22,1,0.36,1)';
              reel.style.transform = `translateY(-${scrollY}px)`;
            }, i * 200);
          });
        }

        playSpinSound() {
          this.sounds.spin.currentTime = 0;
          this.sounds.spin.play();
        }

        evaluateSpinResults(_results, bet) {
          this.sounds.spin.pause(); this.sounds.spin.currentTime = 0;

          // Sichtfenster-Symbole holen
          const symbolsForLines = this.reels.map(reel => [
            reel.children[this.bufferCount]?.dataset.base,
            reel.children[this.bufferCount + 1]?.dataset.base,
            reel.children[this.bufferCount + 2]?.dataset.base
          ]);

          this.logWinLines(symbolsForLines);

          const totalPayout = this.evaluateAllLines(symbolsForLines, bet);
          this.updateStats(bet * this.getActiveLineCount(), totalPayout);
          this.handleFreeSpinMode();
        }

        logWinLines(sfl) {
          const names = ['Oben', 'Mitte', 'Unten', 'Diagonal ↘️', 'Diagonal ↗️'];
          const combos = [
            [sfl[0][0], sfl[1][0], sfl[2][0], sfl[3][0], sfl[4][0]],
            [sfl[0][1], sfl[1][1], sfl[2][1], sfl[3][1], sfl[4][1]],
            [sfl[0][2], sfl[1][2], sfl[2][2], sfl[3][2], sfl[4][2]],
            [sfl[0][0], sfl[1][1], sfl[2][2], sfl[3][1], sfl[4][0]],
            [sfl[0][2], sfl[1][1], sfl[2][0], sfl[3][1], sfl[4][2]]
          ];
          console.log('🎰 --- Gewinnlinien ---');
          combos.forEach((line, i) => console.log(`Linie ${i+1} (${names[i]}): ${line.join(' | ')}`));
        }

        evaluateAllLines(symbolsForLines, bet) {
          const lines = this.getWinLines(symbolsForLines);
          let totalPayout = 0, specialTotal = 0, winLinesGrouped = [], any = false;

          lines.forEach((line, idx) => {
            if (!this.activeLines[idx]) return;
            const r = this.evaluateLine(line.symbols, bet, line.positions) || {};
            if (r.specialPaid) specialTotal += r.specialPaid;
            const linePayout = typeof r.payout === 'number' ? r.payout : 0;
            totalPayout += linePayout;
            if (Array.isArray(r.winSymbols) && r.winSymbols.length > 0) winLinesGrouped.push(r.winSymbols);
            if (linePayout > 0 || (r.winSymbols && r.winSymbols.length) || (r.text && r.text.trim() !== '')) any = true;
          });

          if (totalPayout > 0) {
            if (this.inFreeSpinMode) this.totalFreeSpinWinnings += totalPayout;
            else {
              this.balance += totalPayout;
              this.lastWinAmount = totalPayout;
              // kein Gamble mehr
            }
            this.updateDisplays();
          }

          const gesamt = totalPayout + specialTotal;
          this.handleWinResult(any, gesamt, winLinesGrouped);
          return gesamt;
        }

        getWinLines(sfl) {
          return [{
            symbols:[sfl[0][0],sfl[1][0],sfl[2][0],sfl[3][0],sfl[4][0]],
            positions:[{reel:0,row:0},{reel:1,row:0},{reel:2,row:0},{reel:3,row:0},{reel:4,row:0}]
          }, {
            symbols:[sfl[0][1],sfl[1][1],sfl[2][1],sfl[3][1],sfl[4][1]],
            positions:[{reel:0,row:1},{reel:1,row:1},{reel:2,row:1},{reel:3,row:1},{reel:4,row:1}]
          }, {
            symbols:[sfl[0][2],sfl[1][2],sfl[2][2],sfl[3][2],sfl[4][2]],
            positions:[{reel:0,row:2},{reel:1,row:2},{reel:2,row:2},{reel:3,row:2},{reel:4,row:2}]
          }, {
            symbols:[sfl[0][0],sfl[1][1],sfl[2][2],sfl[3][1],sfl[4][0]],
            positions:[{reel:0,row:0},{reel:1,row:1},{reel:2,row:2},{reel:3,row:1},{reel:4,row:0}]
          }, {
            symbols:[sfl[0][2],sfl[1][1],sfl[2][0],sfl[3][1],sfl[4][2]],
            positions:[{reel:0,row:2},{reel:1,row:1},{reel:2,row:0},{reel:3,row:1},{reel:4,row:2}]
          }];
        }

        /* ========= LINIEN-AUSWERTUNG ========= */
        evaluateLine([a, b, c, d, e], bet, linePositions) {
          let payout = 0;
          let text = '';
          let winSymbols = [];

          // 📖x5 – während Freispielen: +5 weitere Freispiele
          if (this.inFreeSpinMode && [a,b,c,d,e].every(s => s === '📖')) {
            this.freeSpins += 5;
            // UI/History aktualisieren (keine Credits, nur Info)
            this.updateAfterEvaluate('📖📖📖📖📖 – +5 Freispiele!', 0, bet);
            this.updateFreeSpinUI();
            return { text:'📖📖📖📖📖 – +5 Freispiele!', winSymbols: linePositions, payout: 0 };
          }

          // Specials (außerhalb Freispielen direkt)
          if (!this.inFreeSpinMode) {
            const sp = this.checkSpecialCombinations([a, b, c, d, e], bet, linePositions);
            if (sp) return sp;
          }

          // 🎁 Mystery Box
          if ([a,b,c,d,e].every(s=>s==='🎁')) {
            this.triggerMysteryBox(bet);
            return { text:'🎁🎁🎁🎁🎁 – Mystery Box aktiviert!', winSymbols: linePositions };
          }

          // 💎 Progressive Jackpot
          if ([a,b,c,d,e].every(s=>s==='💎')) {
            const amount = this.winProgressiveJackpot();
            return { text:`💎💎💎💎💎 – PROGRESSIVE JACKPOT! ${amount.toLocaleString('de-DE')} Credits!`, winSymbols: linePositions, payout:0, specialPaid:amount };
          }

          

          // 3–5 gleiche von links
          const run = this.getMatchingSymbolRun([a,b,c,d,e]);
          if (run >= 3) {
            if (run === 3) payout = bet * 1;
            else if (run === 4) payout = bet * 2;
            else if (run === 5) payout = bet * 5;
            winSymbols = Array.from({length:run},(_,i)=>i);
          }

          // Multiplikator / Freispiel-Bonus
          if (this.multiplierActive && payout > 0) payout *= this.currentMultiplier;
          if (this.inFreeSpinMode && payout > 0)   payout *= 2;

          if (payout > 0) {
            this.playJackpotSound();
            text = `🎉 Gewinn: ${payout.toLocaleString('de-DE')} Credits`;
            if (this.multiplierActive) text += ` (x${this.currentMultiplier})`;
          }

          // Trostpreis bei 2 linken
          if (payout === 0 && a === b) {
            const consolation = Math.floor(bet * 0.5);
            if (consolation > 0) {
              this.playJackpotSound();
              text = `🙂 Trostpreis für 2 Gleiche links: ${consolation.toLocaleString('de-DE')} Credits`;
              winSymbols = [0,1];
              payout = consolation;
            }
          }

          this.updateDisplays();
          return { text, winSymbols: winSymbols.map(i=>linePositions[i]), payout };
        }

        checkSpecialCombinations([a,b,c,d,e], bet, linePositions) {
          // 🔥🔥🔥🔥🔥 – alles weg
          if ([a,b,c,d,e].every(s=>s==='🔥')) {
            this.balance = 0;
            this.playFalaSound();
            this.updateAfterEvaluate('🔥🔥🔥🔥🔥 – FALA ist abgebrannt! Alles verloren!', 0, bet);
            return { text:'🔥🔥🔥🔥🔥 – FALA ist abgebrannt! Alles verloren!', winSymbols:[] };
          }
          // 🔥🔥🏎️🔥🔥 – halber Verlust
          if (a==='🔥' && b==='🔥' && c==='🏎️' && d==='🔥' && e==='🔥') {
            const loss = Math.floor(this.balance/2);
            this.balance -= loss;
            this.playFalaSound();
            this.updateAfterEvaluate('🔥🔥🏎️🔥🔥 – H16 passiert! Du verlierst die Hälfte.', 0, bet);
            return { text:'🔥🔥🏎️🔥🔥 – H16 passiert! Du verlierst die Hälfte.', winSymbols:[] };
          }
          // 6️⃣9️⃣🏎️6️⃣9️⃣ – kleiner Jackpot (+ evtl. Glücksrad)
          if (a==='6️⃣' && b==='9️⃣' && c==='🏎️' && d==='6️⃣' && e==='9️⃣') {
            const win = bet * 10;
            this.balance += win;
            this.lastWinAmount = win;
            this.playJackpotSound();
            this.updateAfterEvaluate(`🎉 JACKPOT! 6️⃣9️⃣🏎️6️⃣9️⃣ – Gewinn: ${win.toLocaleString('de-DE')} Credits`, win, bet);
            if (Math.random() < 0.5) setTimeout(()=>this.showLuckyWheel(), 1000);
            return { text:`🎉 JACKPOT! 6️⃣9️⃣🏎️6️⃣9️⃣ – Gewinn: ${win.toLocaleString('de-DE')} Credits`, winSymbols: linePositions, payout: win };
          }
          // 🦄x5 – Hochgewinn + Multiplikator
          if ([a,b,c,d,e].every(s=>s==='🦄')) {
            const win = bet * 7;
            this.balance += win;
            this.lastWinAmount = win;
            this.playJackpotSound();
            this.updateAfterEvaluate(`🦄🦄🦄🦄🦄 – Hochgewinn! ${win.toLocaleString('de-DE')} Credits`, win, bet);
            this.activateMultiplier();
            return { text:`🦄🦄🦄🦄🦄 – Hochgewinn! ${win.toLocaleString('de-DE')} Credits`, winSymbols: linePositions, payout: win };
          }
          // 📖x5 – Freispiele
          if ([a,b,c,d,e].every(s=>s==='📖')) {
            if (this.inFreeSpinMode) {
              this.freeSpins += 5;
              this.updateAfterEvaluate('📖📖📖📖📖 – +5 Freispiele!', 0, bet);
              return { text:'📖📖📖📖📖 – +5 Freispiele!', winSymbols: linePositions };
            } else {
              this.freeSpins = 11; // 10 echte + 1 sofort
              this.totalFreeSpinWinnings = 0;
              this.inFreeSpinMode = true;
              this.elements.betInput.disabled = true;
              this.updateAfterEvaluate('📖📖📖📖📖 – Du hast 10 Freispiele!', 0, bet);
              return { text:'📖📖📖📖📖 – Du hast 10 Freispiele!', winSymbols: linePositions };
            }
          }
          // 6️⃣9️⃣🍒6️⃣9️⃣ – Spezialgewinn
          if (a==='6️⃣' && b==='9️⃣' && c==='🍒' && d==='6️⃣' && e==='9️⃣') {
            const win = bet * 4;
            this.balance += win;
            this.lastWinAmount = win;
            this.playJackpotSound();
            this.updateAfterEvaluate(`🎉 Spezial 6️⃣9️⃣🍒6️⃣9️⃣ – Gewinn: ${win.toLocaleString('de-DE')} Credits`, win, bet);
            return { text:`🎉 Spezial 6️⃣9️⃣🍒6️⃣9️⃣ – Gewinn: ${win.toLocaleString('de-DE')} Credits`, winSymbols: linePositions, payout: win };
          }
          return null;
        }

        getMatchingSymbolRun(arr) {
          const first = arr[0];
          let c = 1;
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] === first) c++; else break;
          }
          return c;
        }

        updateAfterEvaluate(msg, payout, _bet) {
          if (!this.inFreeSpinMode) {
            if (payout > 0) this.balance += payout;
          } else {
            if (payout > 0) this.totalFreeSpinWinnings += payout;
          }
          if (this.balance > this.highscore) {
            this.highscore = this.balance;
            msg += ' 🏆 Neuer Highscore!';
          }
          if (this.balance <= 0) {
            this.balance = 0;
            msg += ' 💸 Konto leer – bitte Reset!';
          }
          this.elements.message.textContent = msg;
          this.updateHistory(msg, payout > 0);
          this.updateDisplays();
        }

        /* ========= WIN UI ========= */
        handleWinResult(any, total, groups) {
          if (any) {
            this.winStreak++;
            let msg = `🎉 Gesamtgewinn: ${total.toLocaleString('de-DE')} Credits`;
            if (this.winStreak >= 5) {
              msg += ' 🔥 Glückssträhne!';
              this.checkAchievements();
            }
            this.updateHistory(msg, true);
            this.elements.message.textContent = msg;
            this.animateWinningLines(groups);
          } else {
            this.winStreak = 0;
            this.updateHistory('😞 Keine Kombi – Du verlierst …', false);
            this.elements.message.textContent = '😞 Keine Kombi – Du verlierst …';
          }
        }

        async animateWinningLines(groups) {
          for (const g of groups) {
            if (g && g.length > 0) {
              this.blinkWinningSymbols(g);
              await new Promise(r => setTimeout(r, 1600));
              this.stopBlinkingSymbols(g);
            }
          }
        }

        blinkWinningSymbols(idxArr) {
          idxArr.forEach(({ reel, row }) => {
            const r = this.reels[reel];
            if (r) {
              const el = r.children[this.bufferCount + row];
              if (el) el.classList.add('blink');
            }
          });
        }

        stopBlinkingSymbols(idxArr) {
          if (!idxArr || idxArr.length === 0) return;
          idxArr.forEach(({ reel, row }) => {
            const r = this.reels[reel];
            if (r) {
              const el = r.children[this.bufferCount + row];
              if (el) el.classList.remove('blink');
            }
          });
        }

        /* ========= AUTOSPIN ========= */
        toggleAutoSpin() {
          if (this.balance <= 0) { this.stopAutoSpin(); return; }
          if (this.autoSpinCooldown) return;
          this.autoSpinCooldown = true;
          setTimeout(() => this.autoSpinCooldown = false, 1000);

          // Sperre wenn Leiter aktiv
          if (this.ladderActive) return;

          this.autoActive = !this.autoActive;
          this.elements.autoButton.classList.toggle('running', this.autoActive);
          this.elements.autoButton.textContent = this.autoActive ? '🛑 Autospin stoppen' : '🔄 Autospin starten';

          if (this.autoActive) this.startAutoSpin();
          else this.stopAutoSpin();

          this.updateSpinButtonState();
        }

        startAutoSpin() {
          this.currentAutoSpin = 1;
          this.spin();
          this.elements.autoStatus.textContent = `Autospin: ${this.currentAutoSpin} / ${this.maxAutoSpins}`;
          this.autoInterval = setInterval(() => {
            if (this.balance > 0 && this.currentAutoSpin < this.maxAutoSpins && !this.ladderActive) {
              this.currentAutoSpin++;
              this.spin();
              this.elements.autoStatus.textContent = `Autospin: ${this.currentAutoSpin} / ${this.maxAutoSpins}`;
            } else {
              this.stopAutoSpin();
            }
          }, 3000);
        }

        stopAutoSpin() {
          this.autoActive = false;
          clearInterval(this.autoInterval);
          this.elements.autoButton.classList.remove('running');
          this.elements.autoButton.textContent = '🔄 Autospin starten';
          this.elements.autoStatus.textContent = '';
          this.updateSpinButtonState();
        }

        /* ========= 🪜 LEITER FEATURE ========= */
        openLadder() {
          // Autospin stoppen
          if (this.autoActive) this.stopAutoSpin();

          // Letzten Gewinn als Start verwenden
          const start = Math.floor(this.lastWinAmount || 0);

          if (!start || start <= 0) {
            this.elements.message.textContent = 'ℹ️ Kein letzter Gewinn vorhanden – erst gewinnen, dann hochdrücken.';
            return;
          }

          // Falls der Gewinn schon dem Guthaben gutgeschrieben wurde, reservieren wir ihn jetzt
          if (this.balance < start) {
            this.elements.message.textContent = '💸 Zu wenig Guthaben – der letzte Gewinn ist nicht mehr vollständig verfügbar.';
            return;
          }

          // Gamble schließen & Reuse verhindern
          this.hideGambleOptions();
          this.balance -= start;
          this.lastWinAmount = 0;  // nicht doppelt nutzbar
          this.updateDisplays();

          // Cap (z. B. x100 vom Start)
          const cap = Math.max(start, start * 100);

          // Steps bauen
          this.ladderSteps = this.buildLadderSteps(start, cap);
          this.ladderIndex = 0;
          this.ladderCap = cap;

          // UI füllen
          this.elements.ladderCap.textContent = cap.toLocaleString('de-DE');
          this.elements.ladderStart.textContent = start.toLocaleString('de-DE');
          this.renderLadderList();

          // Overlay zeigen
          this.ladderActive = true;
          this.elements.ladderOverlay.classList.add('show');
          this.elements.ladderOverlay.style.display = 'flex';
          this.elements.message.textContent =
            `🪜 Leiter gestartet – letzter Gewinn (${start.toLocaleString('de-DE')} Credits) als Einsatz reserviert. 50/50 je Schritt.`;
          this.updateSpinButtonState();
        }


        buildLadderSteps(start, cap) {
          const steps = [start];
          let v = start;
          // sanfte Progression ~1.6x pro Schritt, am Ende exakt Cap
          while (v < cap) {
            v = Math.ceil(v * 1.6 / 10) * 10; // auf 10er runden
            if (v >= cap) { v = cap; steps.push(v); break; }
            steps.push(v);
            if (steps.length > 20) break; // Safety
          }
          return steps;
        }

        renderLadderList() {
          // Von oben nach unten anzeigen (höchste oben)
          const html = this.ladderSteps
            .map((amt, idx) => ({ amt, idx }))
            .reverse()
            .map(({amt, idx}) => {
              const active = (idx === this.ladderIndex) ? 'active' : '';
              const tag = (idx === this.ladderSteps.length - 1) ? '<span class="tag">MAX</span>' :
                          (idx === 0 ? '<span class="tag">START</span>' : '');
              return `<div class="ladder-step ${active}" data-idx="${idx}">
                        <span>${amt.toLocaleString('de-DE')} Credits</span>${tag}
                      </div>`;
            }).join('');
          this.elements.ladderList.innerHTML = html;
        }

        ladderStepUp() {
          if (!this.ladderActive) return;

          // Wenn schon am Cap, sofort auszahlen
          if (this.ladderIndex >= this.ladderSteps.length - 1) {
            this.ladderTakeWin();
            return;
          }

          // 50/50
          const win = Math.random() < 0.5;

          // aktuelle aktiven Step-Elemente identifizieren
          const nodes = [...this.elements.ladderList.querySelectorAll('.ladder-step')];
          const findNodeByIdx = (i) => nodes.find(n => parseInt(n.getAttribute('data-idx'),10) === i);

          const curr = findNodeByIdx(this.ladderIndex);
          if (win) {
            this.ladderIndex++;
            const next = findNodeByIdx(this.ladderIndex);
            if (curr) { curr.classList.remove('active'); curr.classList.add('won'); }
            if (next) next.classList.add('active');

            this.elements.message.textContent = `✅ Hochgedrückt! Aktuell: ${this.ladderSteps[this.ladderIndex].toLocaleString('de-DE')} Credits.`;
            this.playJackpotSound();

            // Automatisch auszahlen wenn Cap erreicht
            if (this.ladderIndex === this.ladderSteps.length - 1) {
              setTimeout(()=> this.ladderTakeWin(), 500);
            }
          } else {
            if (curr) { curr.classList.remove('active'); curr.classList.add('lost'); }
            this.elements.message.textContent = '❌ Verloren! Leiter-Einsatz weg.';
            // Nichts auszahlen – Einsatz war bereits reserviert
            setTimeout(()=> this.closeLadder(false), 500);
          }
        }

        ladderTakeWin() {
          if (!this.ladderActive) return;
          const pay = this.ladderSteps[this.ladderIndex] || 0;
          this.balance += pay; // Einsatz war zu Beginn abgezogen – jetzt Gesamtbetrag ausschütten
          this.updateDisplays();
          this.elements.message.textContent = `🪜 Eingesackt: ${pay.toLocaleString('de-DE')} Credits.`;
          this.playJackpotSound();
          this.closeLadder(true);
        }

        closeLadder(_withPayout) {
          this.ladderActive = false;
          this.elements.ladderOverlay.classList.remove('show');
          this.elements.ladderOverlay.style.display = 'none';
          this.updateSpinButtonState();
        }

        /* ========= FREISPIELE / STATS ========= */
        handleFreeSpinMode() {
          if (this.inFreeSpinMode) {
            this.freeSpins--;
            if (this.freeSpins <= 0) {
              this.inFreeSpinMode = false;
              this.probsAreBoosted = false;
              this.balance += this.totalFreeSpinWinnings;
              this.elements.message.textContent = `🎰 Freispiele beendet! Du gewinnst insgesamt ${this.totalFreeSpinWinnings.toLocaleString('de-DE')} Credits.`;
              this.updateHistory(`🎰 Freispiele beendet! ${this.totalFreeSpinWinnings.toLocaleString('de-DE')} Credits gewonnen!`, this.totalFreeSpinWinnings > 0);
              this.updateDisplays();
              this.totalFreeSpinWinnings = 0;
              this.elements.betInput.disabled = false;
            }
            this.updateFreeSpinUI();
          }
        }

        updateFreeSpinUI() {
          if (this.inFreeSpinMode) {
            this.elements.freeSpinStats.style.display = 'block';
            this.elements.freeSpinStats.textContent = `🎰 Freispiele: ${this.freeSpins} verbleibend | Aktuelle Gewinne: ${this.totalFreeSpinWinnings.toLocaleString('de-DE')} Credits`;
          } else {
            this.elements.freeSpinStats.style.display = 'none';
            this.elements.freeSpinStats.textContent = '';
          }
          this.elements.betInput.disabled = this.inFreeSpinMode;
        }

        updateStats(bet, payout) {
          this.stats.totalSpins++;
          this.stats.totalBet += bet;
          if (payout > 0) { this.stats.totalWins++; this.stats.totalWon += payout; }
          else { this.stats.totalLosses++; }
          this.saveGameState();
          this.refreshStatsDisplay();
        }

        /* ========= SOUNDS ========= */
        playJackpotSound() { this.sounds.jackpot.currentTime = 0; this.sounds.jackpot.play(); }
        playFalaSound()    { this.sounds.fala.currentTime    = 0; this.sounds.fala.play(); }

        /* ========= ACHIEVEMENTS / JACKPOT / EXTRA ========= */
        updateProgressiveJackpot() {
          this.elements.progressiveAmount.textContent = `${this.progressiveJackpot.toLocaleString('de-DE')} Credits`;
          this.saveGameState();
        }

        winProgressiveJackpot() {
          const amountPaid = this.progressiveJackpot;
          if (this.autoActive) this.stopAutoSpin();
          this.hideGambleOptions?.();
          this.createMoneyRain(140);
          this.playJackpotSound();
          this.balance += amountPaid;
          this.progressiveJackpot = 50000;
          this.updateProgressiveJackpot();
          this.updateDisplays();
          this.unlockAchievement?.('jackpotHunter');
          this.checkAchievements();
          this.elements.message.textContent = `💎 PROGRESSIVE JACKPOT! ${amountPaid.toLocaleString('de-DE')} Credits! Autospins gestoppt.`;
          return amountPaid;
        }

        /* ========= MYSTERY BOX ========= */
        triggerMysteryBox(bet) {
          // Doppel-Open verhindern
          if (this.mysteryBoxActive) return;
          this.mysteryBoxActive = true;

          // Preis-Pool
          const pool = [
            { type: 'credits',   value: bet * 2,           text: `x2 deines Einsatzes: ${(bet*2).toLocaleString('de-DE')} Credits` },
            { type: 'credits',   value: bet * 5,           text: `x5 deines Einsatzes: ${(bet*5).toLocaleString('de-DE')} Credits` },
            { type: 'credits',   value: 5000,              text: `5.000 Credits` },
            { type: 'credits',   value: 20000,             text: `20.000 Credits` },
            { type: 'freespins', value: 5,                 text: `5 Freispiele` },
            { type: 'mult',      value: { x: 2, spins: 5}, text: `Multiplikator x2 für 5 Spins` },
          ];

          const pick = pool[Math.floor(Math.random() * pool.length)];

          // Preis anwenden
          if (pick.type === 'credits') {
            this.balance += pick.value;
            this.updateDisplays();
          } else if (pick.type === 'freespins') {
            this.inFreeSpinMode = true;
            this.freeSpins += pick.value + 1;   // +1 sofortiger Freispin wie bei Büchern
            this.elements.betInput.disabled = true;
            this.updateFreeSpinUI();
          } else if (pick.type === 'mult') {
            this.activateMultiplier();
            this.currentMultiplier = pick.value.x;
            this.multiplierSpinsRemaining = pick.value.spins;
            this.updateMultiplierDisplay();
          }

          // UI befüllen + anzeigen
          this.mysteryBoxCount++;
          if (this.elements.mysteryPrize) this.elements.mysteryPrize.textContent = '🎁';
          if (this.elements.mysteryText)  this.elements.mysteryText.textContent  = `Du erhältst: ${pick.text}`;
          if (this.elements.mysteryBox)   this.elements.mysteryBox.style.display = 'block';

          // Feedback & Achievements
          this.playJackpotSound?.();
          this.updateHistory?.(`🎁 Mystery Box: ${pick.text}`, true);
          this.checkAchievements?.();
        }

        closeMysteryBox() {
          if (this.elements.mysteryBox) this.elements.mysteryBox.style.display = 'none';
          this.mysteryBoxActive = false;
        }


        createMoneyRain(count = 120) {
          const emojis = ['💸','💶','🪙','💵'];
          const durationMin = 3.5, durationMax = 7;
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              const el = document.createElement('div');
              el.className = 'money';
              el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
              el.style.left = Math.random() * 100 + 'vw';
              el.style.fontSize = (24 + Math.random() * 24) + 'px';
              el.style.animationDuration = (durationMin + Math.random() * (durationMax - durationMin)) + 's';
              el.style.transform = `translateY(-120vh) rotate(${(Math.random()*60-30)}deg)`;
              document.body.appendChild(el);
              setTimeout(() => el.remove(), (durationMax + 1) * 1000);
            }, i * 40);
          }
        }

        showLuckyWheel() {
          this.elements.luckyWheelContainer.style.display = 'flex';
          this.elements.wheelResult.textContent = '';
        }

        spinLuckyWheel() {
          if (this.wheelSpinning) return;
          this.wheelSpinning = true;
          const prizes = [
            { angle: 0,   prize: 5000,  text: '5.000 Credits!' },
            { angle: 45,  prize: 2000,  text: '2.000 Credits!' },
            { angle: 90,  prize: 10000, text: '10.000 Credits!' },
            { angle: 135, prize: 1000,  text: '1.000 Credits!' },
            { angle: 180, prize: 20000, text: '20.000 Credits!' },
            { angle: 225, prize: 3000,  text: '3.000 Credits!' },
            { angle: 270, prize: 50000, text: '50.000 Credits! MEGA!' },
            { angle: 315, prize: 7500,  text: '7.500 Credits!' }
          ];
          const pick = prizes[Math.floor(Math.random() * prizes.length)];
          const rot = 5 + Math.random() * 5;
          const final = rot * 360 + pick.angle;
          this.elements.luckyWheel.style.transform = `rotate(${final}deg)`;
          setTimeout(() => {
            this.balance += pick.prize;
            this.elements.wheelResult.textContent = `🎉 Gewonnen: ${pick.text}`;
            this.updateDisplays();
            this.playJackpotSound();
            this.wheelSpinning = false;
            if (pick.prize === 50000) this.checkAchievements();
            setTimeout(() => {
              this.elements.luckyWheelContainer.style.display = 'none';
              this.elements.luckyWheel.style.transform = 'rotate(0deg)';
            }, 3000);
          }, 4000);
        }

        checkAchievements() {
          let any = false;
          if (!this.achievements.firstWin.unlocked   && this.stats.totalWins > 0)          { this.unlockAchievement('firstWin');   any = true; }
          if (!this.achievements.bigWinner.unlocked  && this.lastWinAmount >= 10000)       { this.unlockAchievement('bigWinner');  any = true; }
          if (!this.achievements.luckyStreak.unlocked&& this.winStreak >= 5)               { this.unlockAchievement('luckyStreak');any = true; }
          if (!this.achievements.spinMaster.unlocked && this.stats.totalSpins >= 100)      { this.unlockAchievement('spinMaster'); any = true; }
          if (!this.achievements.mysterySeeker.unlocked && this.mysteryBoxCount >= 5)      { this.unlockAchievement('mysterySeeker'); any = true; }
          if (!this.achievements.millionaire.unlocked && this.balance >= 1000000)          { this.unlockAchievement('millionaire'); any = true; }
          if (any) this.renderAchievements();
        }

        unlockAchievement(key) {
          const a = this.achievements[key];
          if (!a.unlocked) {
            a.unlocked = true;
            this.balance += a.reward;
            this.updateDisplays();
            const msg = `🏆 Achievement freigeschaltet: ${a.title}! +${a.reward.toLocaleString('de-DE')} Credits`;
            this.elements.message.textContent = msg;
            this.updateHistory(msg, true);
            this.playJackpotSound();
          }
        }

        renderAchievements() {
          const html = Object.entries(this.achievements).map(([k, a]) => `
            <div class="achievement ${a.unlocked?'unlocked':''}" style="display:flex; align-items:center; justify-content:space-between; padding:8px; margin:4px 0; background: rgba(0,0,0,.25); border-radius:10px;">
              <div class="achievement-icon" style="font-size:1.6em; margin-right:10px;">${a.icon}</div>
              <div class="achievement-info" style="flex:1; text-align:left;">
                <div class="achievement-title" style="font-weight:bold; color: var(--gold);">${a.title}</div>
                <div class="achievement-desc" style="font-size: var(--font-sm); color:#ccc;">${a.desc}</div>
              </div>
              <div class="achievement-reward" style="color:#4CAF50; font-weight:bold;">${a.unlocked?'✓':`+${a.reward.toLocaleString('de-DE')}`}</div>
            </div>`).join('');
          this.elements.achievementsList.innerHTML = html;
        }

        updateHistory(text, isWin) {
          const entry = { text, isWin };
          this.historyEntries.unshift(entry);
          if (this.historyEntries.length > 5) this.historyEntries.pop();
          this.elements.historyList.innerHTML = this.historyEntries.map((e, i) =>
            `<li class="history-item ${e.isWin?'win':'loss'} ${i===0?'highlighted-entry':''}">${e.text}</li>`
          ).join('');
          const first = this.elements.historyList.querySelector('li.highlighted-entry');
          if (first) setTimeout(() => first.classList.remove('highlighted-entry'), 1000);
        }

        /* ========= RESET ========= */
        resetGame() {
          if (!confirm("🔄 Willst du das Spiel wirklich zurücksetzen?\n\n⚠️ Alle Fortschritte gehen verloren!")) return;

          // Leiter offen? Schließen und nichts auszahlen (wie Abbruch nach Verlust)
          if (this.ladderActive) this.closeLadder(false);

          this.balance = 10000;
          this.spinCount = 0;
          this.currentAutoSpin = 0;
          this.winStreak = 0;

          this.freeSpins = 0;
          this.totalFreeSpinWinnings = 0;
          this.inFreeSpinMode = false;
          this.probsAreBoosted = false;

          this.spinIsRunning = false;
          this.multiplierActive = false;
          this.currentMultiplier = 1;
          this.multiplierSpinsRemaining = 0;
          this.mysteryBoxCount = 0;

          this.stopAutoSpin();
          this.deactivateMultiplier();

          this.reels.forEach(r => r.innerHTML = '');

          this.elements.message.textContent = '✅ Guthaben zurückgesetzt! Viel Erfolg beim nächsten Spiel!';
          this.elements.betInput.value = 100;
          this.elements.betInput.disabled = false;

          this.updateDisplays();
          this.resetStats();
          this.updateLimitNotice();
          this.hideGambleOptions();
          this.updateFreeSpinUI();
          this.updateSpinButtonState();
          this.checkInitialBetLimitNotice();

          this.historyEntries = [];
          this.elements.historyList.innerHTML = '';

          Object.keys(this.achievements).forEach(k => this.achievements[k].unlocked = false);
          this.renderAchievements();

          setTimeout(() => this.showWelcomeMessage(), 2000);
        }

        resetStats() {
          this.stats = { totalSpins: 0, totalWins: 0, totalLosses: 0, totalBet: 0, totalWon: 0 };
          localStorage.removeItem('slotStats');
          this.refreshStatsDisplay();
        }

        /* ========= PASSWORT / ADMIN ========= */
        handlePasswordSubmit() {
          const pw = this.elements.pwInput.value;
          this.elements.passwordOverlay.style.display = 'none';
          if (pw === this.secretPassword) {
            const visible = this.elements.probabilitiesPanel.style.display !== 'none';
            this.elements.probabilitiesPanel.style.display = visible ? 'none' : 'block';
            alert('🔧 ADMIN MODUS ' + (visible ? 'DEAKTIVIERT' : 'AKTIVIERT') + '!');
          } else if (pw === this.easterEggCode) {
            this.triggerEasterEgg();
          } else {
            alert('❌ Falsches Passwort!');
          }
        }

        triggerEasterEgg() {
          alert('🎉 Sooooooo ein Ding ist das!!!!!!');
          this.balance += 100000;
          this.activateMultiplier();
          this.currentMultiplier = 5;
          this.multiplierSpinsRemaining = 20;
          this.updateMultiplierDisplay();
          this.updateDisplays();
          this.createMoneyRain(140);
          this.playJackpotSound();
        }

        /* ========= MULTIPLIER UI ========= */
        activateMultiplier() {
          this.multiplierActive = true;
          if (this.multiplierSpinsRemaining === 0) {
            this.multiplierSpinsRemaining = 10;
            this.currentMultiplier = 2;
          }
          this.updateMultiplierDisplay();
        }

        deactivateMultiplier() {
          this.multiplierActive = false;
          this.currentMultiplier = 1;
          this.multiplierSpinsRemaining = 0;
          this.updateMultiplierDisplay();
        }

        updateMultiplierDisplay() {
          if (this.multiplierActive) {
            if (this.elements.multiplierDisplay) {
              this.elements.multiplierDisplay.classList.add('active');
              this.elements.multiplierValue.textContent = `x${this.currentMultiplier} (${this.multiplierSpinsRemaining} Spins)`;
              this.elements.multiplierDisplay.style.display = 'block';
            }
            if (this.elements.multiplierBadge) {
              this.elements.multiplierBadge.style.display = 'inline-flex';
              this.elements.multiplierBadge.classList.add('active');
              this.elements.multiplierBadgeValue.textContent = `x${this.currentMultiplier} • ${this.multiplierSpinsRemaining} Spins`;
            }
          } else {
            if (this.elements.multiplierDisplay) {
              this.elements.multiplierDisplay.classList.remove('active');
              this.elements.multiplierDisplay.style.display = 'none';
            }
            if (this.elements.multiplierBadge) {
              this.elements.multiplierBadge.classList.remove('active');
              this.elements.multiplierBadge.style.display = 'none';
            }
          }
        }
      }

      /* ========= App-Start ========= */
      document.addEventListener('DOMContentLoaded', () => {
        console.log('🎰 Slotmaschine HAWKS wird initialisiert...');
        try {
          window.slotMachine = new SlotMachine();
          console.log('✅ Slotmaschine erfolgreich gestartet!');
        } catch (e) {
          console.error('❌ Fehler beim Starten der Slotmaschine:', e);
        }
      });
      window.addEventListener('error', (e) => console.error('🚨 Unerwarteter Fehler:', e.error));

      // Rechtsklick/Selection einschränken (außer Inputs)
      document.addEventListener('contextmenu', e => e.preventDefault());
      document.addEventListener('selectstart', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
