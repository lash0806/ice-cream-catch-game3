// --- プレイヤー位置定数 ---
const PLAYER_BOTTOM_PC = 'calc(5vh - 40px)';
const PLAYER_BOTTOM_SMARTPHONE = 'calc(4vh - 35px)';

// プレイヤー位置を一元的に設定する関数
function setPlayerBottom() {
    if (window.innerWidth <= 600) {
        player.style.bottom = PLAYER_BOTTOM_SMARTPHONE;
    } else {
        player.style.bottom = PLAYER_BOTTOM_PC;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const scoreDisplay = document.getElementById('score-display');
    const timeDisplay = document.getElementById('time-display');
    const timeGauge = document.getElementById('time-gauge');
    // const levelDisplay = document.getElementById('level-display'); // 存在しないためコメントアウト
const levelDisplay = { innerText: '' }; // ダミーオブジェクトでエラー回避
    const level1ScoreDisplay = document.getElementById('level1-score-display');
    const level2ScoreDisplay = document.getElementById('level2-score-display');
    const level3ScoreDisplay = document.getElementById('level3-score-display');
    // const totalScoreDisplay = document.getElementById('total-score-display'); // 存在しないためコメントアウト
    const finalScoreText = document.getElementById('final-score-text');
const totalScoreDisplay = { innerText: '' }; // ダミーオブジェクトでエラー回避
    
    // Audio elements
    const bgm = document.getElementById('bgm');
    const sfxCatch = document.getElementById('sfx-catch');
    const sfxBomb = document.getElementById('sfx-bomb');
    const sfxPowerup = document.getElementById('sfx-powerup');
    const sfxClock = document.getElementById('sfx-clock');
    const sfxGoldenIce = document.getElementById('sfx-golden-ice');
    const sfxLevelEnd = document.getElementById('sfx-level-end');
    const sfxBonus = document.getElementById('sfx-bonus');
    const sfxMst = document.getElementById('sfx-mst');

    bgm.volume = 1.0;
    [sfxCatch, sfxPowerup, sfxClock, sfxGoldenIce, sfxLevelEnd, sfxBonus, sfxBomb, sfxMst].forEach(sfx => {
        if (sfx) sfx.volume = 1.0;
    });

    // --- iOS系ブラウザでaudioアンロック ---
    function unlockAudio() {
        [bgm, sfxCatch, sfxBomb, sfxPowerup, sfxClock, sfxGoldenIce, sfxLevelEnd, sfxBonus, sfxMst].forEach(audio => {
            if (audio) {
                try {
                    audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
                } catch (e) {}
            }
        });
        window.removeEventListener('touchstart', unlockAudio, true);
        window.removeEventListener('click', unlockAudio, true);
    }
    window.addEventListener('touchstart', unlockAudio, true);
    window.addEventListener('click', unlockAudio, true);

    const startScreen = document.getElementById('start-screen');
    const levelEndScreen = document.getElementById('level-end-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const rankingScreen = document.getElementById('ranking-screen');

    // 開始画面の背景を設定
    startScreen.style.backgroundImage = "url('start.jpg')";

    const startButton = document.getElementById('start-button');
    const nextLevelButton = document.getElementById('next-level-button');
    const restartButton = document.getElementById('restart-button');
    const submitScoreButton = document.getElementById('submit-score-button');
    const showRankingButton = document.getElementById('show-ranking-button');
    const closeRankingButton = document.getElementById('close-ranking-button');
    const nicknameInput = document.getElementById('nickname-input');
    const rankingMessage = document.getElementById('ranking-message');
    const rankingList = document.getElementById('ranking-list');
    
    // 新しいランキングボタン
    const rankingButtonStart = document.getElementById('ranking-button-start');
    const rankingButtonLevel = document.getElementById('ranking-button-level');

    const levelEndTitle = document.getElementById('level-end-title');
    const levelScoreDisplay = document.getElementById('level-score');
    const finalScoreDisplay = document.getElementById('final-score');

    // --- ゲームの状態管理 ---
    let score = 0;
    let levelScores = [0, 0, 0]; // 各レベルのスコアを保存
    let totalScore = 0;
    let level = 1;
    let timeLeft = 60;
    let gameSpeed = 0;
    let powerupLevel = 0; // パワーアップレベル
    let powerupTimer = null;
    let powerupEndTime = 0;
    let gameInterval, timerInterval, itemInterval;
    let bonusCardSpawnedForLevel = false;
    let availableCards = [1, 2, 3];
    let bonusScore = 0; // ボーナススコアを別で管理
    let isStunned = false;
    let isInverted = false;
    let stunTimer = null;
    let invertTimer = null;

    // ランキング設定 - 実際のGoogle Apps ScriptのURLに置き換えてください
    const RANKING_API_URL = 'https://script.google.com/macros/s/AKfycbw3oRDp_3DuQaMhXoEQQsaD9spsjFZj2Peg8iSyRo8xG4rhGrOEBM_dFiwJlOl0kupC/exec';

    // --- レベル設定 ---
    const levels = {
        1: { baseSpeed: 6.0, spawnRate: 800, acceleration: 0.007, bg: 'bg-level-1.jpg', music: 'bgm-level-1' },
        2: { baseSpeed: 7.5, spawnRate: 650, acceleration: 0.010, bg: 'bg-level-2.jpg', music: 'bgm-level-2' },
        3: { baseSpeed: 9.0, spawnRate: 500, acceleration: 0.014, bg: 'bg-level-3.jpg', music: 'bgm-level-3' }
    };
    const MAX_LEVEL = Object.keys(levels).length;

    // --- アイテム設定 ---
    const items = [
        { type: 'ice-cream', emoji: '🍦', score: 10, sfx: sfxCatch, soundName: 'catch', probability: 0.50 },
        { type: 'golden-ice', emoji: '🌟', score: 50, sfx: sfxGoldenIce, soundName: 'golden', probability: 0.08 },
        { type: 'clock', emoji: '⏰', time: 5, sfx: sfxClock, soundName: 'clock', probability: 0.08 },
        { type: 'bomb', score: -20, sfx: sfxBomb, soundName: 'bomb', probability: 0.10, image: 'Eggplant.png' }, /* 基本確率を下げ、動的に増やす */
        { type: 'hamster', powerup: true, score: 100, sfx: sfxPowerup, soundName: 'powerup', probability: 0.04, image: 'hamster.png' },
        { type: 'bonus-card', score: 1000, sfx: sfxBonus, soundName: 'bonus', probability: 0, image: '' }, // imageは動的に設定
        { type: 'monster-stun', score: -50, sfx: sfxMst, soundName: 'mst', probability: 0.10, image: 'mst-1.png', duration: 3000 }, // 3秒間スタン
        { type: 'monster-invert', score: -50, sfx: sfxMst, soundName: 'mst', probability: 0.10, image: 'mst-2.png', duration: 5000 } // 5秒間左右反転
    ];

    // --- プレイヤーの移動 ---
    let playerX = gameContainer.offsetWidth / 2 - player.offsetWidth / 2;
    player.style.left = `${playerX}px`;

    function movePlayer(x) {
        if (isStunned) return; // スタン中は移動不可

        const minX = 0;
        const maxX = gameContainer.offsetWidth - player.offsetWidth;
        let targetX = x;

        if (isInverted) {
            // 左右反転ロジック
            const currentRelativeX = playerX - minX;
            const maxRelativeX = maxX - minX;
            targetX = maxX - (x - minX) - player.offsetWidth; // 反転後の位置を計算
        }

        playerX = Math.max(minX, Math.min(targetX, maxX));
        player.style.left = `${playerX}px`;
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { movePlayer(playerX - 20); }
        else if (e.key === 'ArrowRight') { movePlayer(playerX + 20); }
    });

    gameContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const containerRect = gameContainer.getBoundingClientRect();
        movePlayer(touchX - containerRect.left - player.offsetWidth / 2);
    }, { passive: false });
    
    gameContainer.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) {
            const containerRect = gameContainer.getBoundingClientRect();
            movePlayer(e.clientX - containerRect.left - player.offsetWidth / 2);
        }
    });

    // --- サウンド再生 ---
    function playSound(audioElement, soundName) {
        if (!audioElement) return;
        audioElement.innerHTML = '';
        audioElement.appendChild(Object.assign(document.createElement('source'), { src: `${soundName}.ogg`, type: 'audio/ogg' }));
        audioElement.appendChild(Object.assign(document.createElement('source'), { src: `${soundName}.mp3`, type: 'audio/mpeg' }));
        audioElement.load();
        audioElement.play().catch(e => {});
    }

    function playMusicForLevel(levelNum) {
        const musicBaseName = levels[levelNum].music;
        playSound(bgm, musicBaseName);
    }

    // --- ゲームのメインロジック ---
    function createItem() {
        if (!bonusCardSpawnedForLevel && timeLeft < 45 && timeLeft > 15 && Math.random() < 0.5) {
            spawnBonusCard();
            return;
        }

        const timeElapsed = 60 - timeLeft;
        const bombProbabilityIncrease = (timeElapsed / 60) * 0.20; // 60秒で最大0.20増加

        // モンスターの出現確率増加ロジック
        const monsterTimeProbabilityIncrease = (timeElapsed / 60) * 0.05; // 時間経過で最大0.05増加
        const monsterLevelProbabilityIncrease = (level - 1) * 0.05; // レベルごとに0.05増加

        const dynamicItems = items.map(item => {
            if (item.type === 'bomb') {
                return { ...item, probability: item.probability + bombProbabilityIncrease };
            } else if (item.type === 'monster-stun' || item.type === 'monster-invert') {
                return { ...item, probability: item.probability + monsterTimeProbabilityIncrease + monsterLevelProbabilityIncrease };
            }
            return item;
        });

        const rand = Math.random();
        let cumulativeProbability = 0;
        const selectedItem = dynamicItems.find(item => {
            if (item.type === 'bonus-card') return false;
            cumulativeProbability += item.probability;
            return rand <= cumulativeProbability;
        });

        if (!selectedItem) return;

        spawnItemElement(selectedItem);
    }

    function spawnItemElement(itemData, cardId = null) {
        const itemElement = document.createElement('div');
        itemElement.classList.add('item', itemData.type);
        itemElement.dataset.type = itemData.type;
        itemElement.style.left = `${Math.random() * (gameContainer.offsetWidth - 60)}px`;
        itemElement.style.top = '-60px';

        if (cardId) {
            const img = document.createElement('img');
            img.src = `card-${cardId}.png`;
            itemElement.appendChild(img);
        } else if (itemData.image) {
            const img = document.createElement('img');
            img.src = itemData.image;
            itemElement.appendChild(img);
        } else if (itemData.emoji) {
            itemElement.innerText = itemData.emoji;
        }

        let movesHorizontally = false;
        let horizontalSpeed = 0;

        if (itemData.type === 'golden-ice' || itemData.type === 'hamster') {
            movesHorizontally = true;
            horizontalSpeed = 12;
        } else if (itemData.type === 'ice-cream' && level >= 2) {
            movesHorizontally = true;
            horizontalSpeed = 5;
        } else if (itemData.type === 'bomb' && level >= 3) {
            movesHorizontally = true;
            horizontalSpeed = 7;
        } else if (itemData.type === 'monster-stun' || itemData.type === 'monster-invert') {
            movesHorizontally = true;
            horizontalSpeed = 8; // モンスターの横移動速度
        }

        if (movesHorizontally) {
            itemElement.dataset.horizontalSpeed = horizontalSpeed * (Math.random() * 0.5 + 0.75);
            itemElement.dataset.direction = Math.random() < 0.5 ? '1' : '-1';
        }
        
        if (itemData.type === 'bonus-card') {
            itemElement.classList.add('bonus-card');
            itemElement.style.top = '-80px';
            itemElement.style.left = `${gameContainer.offsetWidth / 2 - 40}px`;
            itemElement.dataset.startTime = Date.now();
            itemElement.dataset.startX = parseFloat(itemElement.style.left);
            itemElement.dataset.amplitude = (Math.random() * 200 + 150) * (Math.random() < 0.5 ? 1 : -1);
            itemElement.dataset.frequency = Math.random() * 0.002 + 0.001;
        }

        gameContainer.appendChild(itemElement);
    }

    function spawnBonusCard() {
        if (availableCards.length === 0) return;
        bonusCardSpawnedForLevel = true;

        const cardIndex = Math.floor(Math.random() * availableCards.length);
        const cardId = availableCards.splice(cardIndex, 1)[0];
        const cardItemData = items.find(i => i.type === 'bonus-card');

        spawnItemElement(cardItemData, cardId);
    }

    function gameLoop() {
        // 時間経過による速度増加
        const timeElapsed = 60 - timeLeft;
        const timeSpeedIncrease = timeElapsed * levels[level].acceleration;

        // スコアに基づく速度計算（ボーナススコアは除く）
        const regularScore = score - bonusScore;
        const scoreSpeedIncrease = Math.floor(regularScore / 20) * 0.1; // 加速を少し緩やかに
        gameSpeed = levels[level].baseSpeed + timeSpeedIncrease + scoreSpeedIncrease;

        const allItems = document.querySelectorAll('.item');
        const playerRect = player.getBoundingClientRect();
        const containerWidth = gameContainer.offsetWidth;

        allItems.forEach(item => {
            let top = parseInt(item.style.top);

            let currentSpeed = gameSpeed;

            if (item.classList.contains('bonus-card')) {
                const startTime = parseFloat(item.dataset.startTime);
                const timeElapsed = Date.now() - startTime;
                const startX = parseFloat(item.dataset.startX);
                const amplitude = parseFloat(item.dataset.amplitude);
                const frequency = parseFloat(item.dataset.frequency);

                top += currentSpeed * 1.5;
                let left = startX + amplitude * Math.sin(timeElapsed * frequency);

                item.style.left = `${left}px`;

            } else {
                top += gameSpeed;
                if (item.dataset.horizontalSpeed) {
                    let left = parseFloat(item.style.left);
                    let speed = parseFloat(item.dataset.horizontalSpeed);
                    let direction = parseInt(item.dataset.direction);

                    left += speed * direction;

                    if (left <= 0) { left = 0; direction = 1; }
                    else if (left >= containerWidth - item.offsetWidth) { left = containerWidth - item.offsetWidth; direction = -1; }
                    
                    item.style.left = `${left}px`;
                    item.dataset.direction = direction;
                }
            }
            item.style.top = `${top}px`;

            const itemRect = item.getBoundingClientRect();
            if (playerRect.left < itemRect.right && playerRect.right > itemRect.left && playerRect.top < itemRect.bottom && playerRect.bottom > itemRect.top) {
                handleItemCatch(item);
                item.remove();
            }

            if (top > gameContainer.offsetHeight) {
                item.remove();
            }
        });
    }

    function handleItemCatch(item) {
        const type = item.dataset.type;
        const itemData = items.find(i => i.type === type);
        if (!itemData) return;

        if (itemData.sfx && itemData.soundName) {
            playSound(itemData.sfx, itemData.soundName);
        }

        if (type === 'bonus-card') {
            bonusScore += itemData.score; // ボーナススコアを加算
            triggerFlashEffect();
        }

        if (itemData.score) { score += itemData.score; }
        if (itemData.time) { 
            timeLeft += itemData.time;
            if (timeLeft > 60) timeLeft = 60; // 上限を60秒に
        }
        if (itemData.powerup && powerupLevel < 2) { // 最大2回までパワーアップ
            powerupLevel++;
            player.style.transform = `scale(${1 + powerupLevel * 0.5})`; // サイズアップを大きく
            player.style.bottom = `${15 + 20 * powerupLevel}px`; // サイズに合わせて位置を調整

            // 既存のタイマーをクリア
            if (powerupTimer) clearTimeout(powerupTimer);

            // パワーアップ終了時間を更新（現在時刻 + 5秒 * パワーアップレベル）
            powerupEndTime = Date.now() + (5000 * powerupLevel);

            // 新しいタイマーを設定
            powerupTimer = setTimeout(() => {
                powerupLevel = 0;
                player.style.transform = 'scale(1)';
                player.style.bottom = '15px'; // 位置を元に戻す
            }, powerupEndTime - Date.now());
        }
        
        if (type === 'monster-stun') {
            isStunned = true;
            updatePlayerAppearance();
            if (stunTimer) clearTimeout(stunTimer);
            stunTimer = setTimeout(() => {
                isStunned = false;
                updatePlayerAppearance();
            }, itemData.duration);
        }

        if (type === 'monster-invert') {
            isInverted = true;
            updatePlayerAppearance();
            if (invertTimer) clearTimeout(invertTimer);
            invertTimer = setTimeout(() => {
                isInverted = false;
                updatePlayerAppearance();
            }, itemData.duration);
        }

        if (score < 0) score = 0;

        // スコア表示の更新
        scoreDisplay.innerText = score;
        timeDisplay.innerText = timeLeft;
        levelScores[level - 1] = score;
        totalScore = levelScores.reduce((a, b) => a + b, 0);

        level1ScoreDisplay.innerText = levelScores[0];
        level2ScoreDisplay.innerText = levelScores[1];
        level3ScoreDisplay.innerText = levelScores[2];
        totalScoreDisplay.innerText = totalScore;
    }

    function triggerFlashEffect() {
        const flash = document.createElement('div');
        flash.classList.add('flash-effect');
        gameContainer.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    }

    function updatePlayerAppearance() {
        if (isStunned || isInverted) {
            player.style.backgroundImage = 'url(\'player-mono.png\')';
        } else {
            player.style.backgroundImage = 'url(\'player.png\')';
        }
    }

    function updateTimer() {
        timeLeft--;
        timeDisplay.innerText = timeLeft;
        
        // タイムゲージの更新
        const gaugeWidth = (timeLeft / 60) * 100;
        timeGauge.style.width = `${gaugeWidth}%`;

        if (timeLeft <= 0) {
            endLevel();
        }
    }

    function startLevel() {
        score = 0;
        bonusScore = 0; // レベル開始時にリセット
        timeLeft = 60;
        levelDisplay.innerText = level;
        scoreDisplay.innerText = score;
        timeDisplay.innerText = timeLeft;
        timeGauge.style.width = '100%'; // ゲージをリセット
        gameSpeed = levels[level].baseSpeed;
        player.style.transform = 'scale(1)'; // プレイヤーのサイズをリセット
        // スマホ・PCでプレイヤーの位置を動的に調整
        setPlayerBottom();
        powerupLevel = 0; // パワーアップレベルをリセット
        if (powerupTimer) clearTimeout(powerupTimer); // タイマーをリセット
        powerupEndTime = 0;
        bonusCardSpawnedForLevel = false;
        isStunned = false;
        isInverted = false;
        if (stunTimer) clearTimeout(stunTimer);
        if (invertTimer) clearTimeout(invertTimer);
        updatePlayerAppearance();

        // レベルに応じてメインアイテムの内容を変更
        const mainItem = items.find(i => i.type === 'ice-cream');
        if (mainItem) {
            if (level === 1) {
                mainItem.image = 'soft cream.png'; // ソフトクリーム
                mainItem.score = 10;
                delete mainItem.emoji;
            } else if (level === 2) {
                mainItem.image = 'candy.png'; // アイスキャンデー
                mainItem.score = 15;
                delete mainItem.emoji;
            } else if (level === 3) {
                mainItem.image = 'ice 2.png'; // パフェ
                mainItem.score = 20;
                delete mainItem.emoji;
            }
        }

        gameContainer.style.backgroundImage = `url('${levels[level].bg}')`;
        document.querySelectorAll('.item').forEach(i => i.remove());

        gameInterval = setInterval(gameLoop, 50);
        timerInterval = setInterval(updateTimer, 1000);
        itemInterval = setInterval(createItem, levels[level].spawnRate);
    }

    function endLevel() {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        clearInterval(itemInterval);
        bgm.pause();
        
        playSound(sfxLevelEnd, 'clear');

        levelScores[level - 1] = score; // 最終レベルのスコアを確定
        totalScore = levelScores.reduce((a, b) => a + b, 0);

        if (level < MAX_LEVEL) {
            levelScoreDisplay.innerText = score;
            levelEndScreen.style.backgroundImage = `url('level-${level}.jpg')`;
            levelEndScreen.style.display = 'flex';
        } else {
            finalScoreText.innerText = `合計スコア : ${totalScore}点`;
            gameOverScreen.style.backgroundImage = `url('final-result.jpg')`;
            
            // ゲームオーバー画面表示時にランキングメッセージをクリア
            rankingMessage.textContent = '';
            rankingMessage.style.color = '';
            
            gameOverScreen.style.display = 'flex';
        }

        // 全てのスコア表示を更新
        level1ScoreDisplay.innerText = levelScores[0];
        level2ScoreDisplay.innerText = levelScores[1];
        level3ScoreDisplay.innerText = levelScores[2];
        totalScoreDisplay.innerText = totalScore;
    }

    // --- ボタンのイベントリスナー ---
    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        playMusicForLevel(level);
        startLevel();
    });

    nextLevelButton.addEventListener('click', () => {
        level++;
        levelEndScreen.style.display = 'none';
        playMusicForLevel(level);
        startLevel();
    });

    restartButton.addEventListener('click', () => {
        level = 1;
        levelScores = [0, 0, 0];
        totalScore = 0;
        availableCards = [1, 2, 3];
        gameOverScreen.style.display = 'none';

        // ゲームオーバー画面のタイトルと背景をリセット
        const gameOverTitle = document.getElementById('game-over-title');
        if(gameOverTitle) gameOverTitle.innerText = 'ゲームオーバー';
        gameOverScreen.style.backgroundImage = '';

        // スコア送信UI要素のリセット
        submitScoreButton.style.display = '';
        nicknameInput.style.display = '';
        document.querySelector('#ranking-section h3').style.display = '';
        rankingMessage.textContent = '';
        rankingMessage.style.color = '';
        nicknameInput.value = '';
        submitScoreButton.disabled = false;
        submitScoreButton.textContent = 'スコアを登録';

        playMusicForLevel(level);
        startLevel();

        // スコア表示をリセット
        level1ScoreDisplay.innerText = 0;
        level2ScoreDisplay.innerText = 0;
        level3ScoreDisplay.innerText = 0;
        totalScoreDisplay.innerText = 0;
    });

    // --- ランキング機能 ---
    
    // スコア送信
    submitScoreButton.addEventListener('click', async () => {
        const nickname = nicknameInput.value.trim();
        
        if (!nickname) {
            rankingMessage.textContent = 'ニックネームを入力してください';
            rankingMessage.style.color = 'red';
            return;
        }
        
        submitScoreButton.disabled = true;
        submitScoreButton.textContent = '送信中...';
        rankingMessage.textContent = '';
        
        try {
            console.log('送信データ:', { nickname, totalScore });
            console.log('送信先URL:', RANKING_API_URL);
            
            // スクリプトタグを使った通信（CORS回避）
            const submitData = (nickname, score) => {
                return new Promise((resolve, reject) => {
                    const callbackName = 'submitCallback_' + Date.now();
                    window[callbackName] = function(result) {
                        resolve(result);
                        delete window[callbackName];
                        document.head.removeChild(script);
                    };
                    
                    const script = document.createElement('script');
                    const params = new URLSearchParams({
                        action: 'submit',
                        nickname: nickname,
                        score: score,
                        callback: callbackName
                    });
                    script.src = `${RANKING_API_URL}?${params}`;
                    script.onerror = () => {
                        reject(new Error('通信に失敗しました'));
                        delete window[callbackName];
                        document.head.removeChild(script);
                    };
                    document.head.appendChild(script);
                });
            };
            
            const result = await submitData(nickname, totalScore);
            console.log('レスポンス結果:', result);
            console.log('result.message:', result.message);
            console.log('result.success:', result.success);
            console.log('typeof result.success:', typeof result.success);
            console.log('result.success === true:', result.success === true);
            
            if (result.success) {
                console.log('Setting message to:', result.message);
                rankingMessage.textContent = result.message;
                // メッセージの内容により色を変更
                if (result.message.includes('更新されませんでした')) {
                    rankingMessage.style.color = 'orange';
                    console.log('Setting color to orange');
                } else {
                    rankingMessage.style.color = 'green';
                    console.log('Setting color to green');
                }
                nicknameInput.value = '';
                submitScoreButton.style.display = 'none';
                nicknameInput.style.display = 'none';
                document.querySelector('#ranking-section h3').style.display = 'none';
            } else {
                rankingMessage.textContent = result.error || '登録に失敗しました';
                rankingMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('通信エラー詳細:', error);
            rankingMessage.textContent = `通信エラー: ${error.message}`;
            rankingMessage.style.color = 'red';
        }
        
        submitScoreButton.disabled = false;
        submitScoreButton.textContent = 'スコアを登録';
    });
    
    // ランキング表示関数（共通）
    async function showRanking(button) {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = '読み込み中...';
        
        try {
            // スクリプトタグを使った通信（CORS回避）
            const fetchRanking = () => {
                return new Promise((resolve, reject) => {
                    const callbackName = 'rankingCallback_' + Date.now();
                    window[callbackName] = function(result) {
                        resolve(result);
                        delete window[callbackName];
                        document.head.removeChild(script);
                    };
                    
                    const script = document.createElement('script');
                    script.src = `${RANKING_API_URL}?callback=${callbackName}`;
                    script.onerror = () => {
                        reject(new Error('通信に失敗しました'));
                        delete window[callbackName];
                        document.head.removeChild(script);
                    };
                    document.head.appendChild(script);
                });
            };
            
            const result = await fetchRanking();
            
            if (result.success) {
                displayRanking(result.rankings);
                rankingScreen.style.display = 'flex';
            } else {
                alert('ランキングの取得に失敗しました');
            }
        } catch (error) {
            alert('通信エラーが発生しました');
        }
        
        button.disabled = false;
        button.textContent = originalText;
    }

    // 各ランキングボタンのイベントリスナー
    showRankingButton.addEventListener('click', () => showRanking(showRankingButton));
    rankingButtonStart.addEventListener('click', () => showRanking(rankingButtonStart));
    rankingButtonLevel.addEventListener('click', () => showRanking(rankingButtonLevel));
    
    // ランキング画面を閉じる
    closeRankingButton.addEventListener('click', () => {
        rankingScreen.style.display = 'none';
    });
    
    // ランキング表示用関数
    function displayRanking(rankings) {
        rankingList.innerHTML = '';
        
        if (rankings.length === 0) {
            rankingList.innerHTML = '<p>まだランキングデータがありません</p>';
            return;
        }
        
        rankings.forEach((entry, index) => {
            const rankDiv = document.createElement('div');
            rankDiv.style.cssText = 'margin: 8px 0; padding: 12px; background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1)); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #007bff;';
            
            let rankText = '';
            let rankColor = '#333';
            if (index === 0) {
                rankText = '🥇';
                rankColor = '#FFD700';
                rankDiv.style.borderLeftColor = '#FFD700';
            } else if (index === 1) {
                rankText = '🥈';
                rankColor = '#C0C0C0';
                rankDiv.style.borderLeftColor = '#C0C0C0';
            } else if (index === 2) {
                rankText = '🥉';
                rankColor = '#CD7F32';
                rankDiv.style.borderLeftColor = '#CD7F32';
            } else {
                rankText = `${index + 1}位`;
            }
            
            rankDiv.innerHTML = `
                <span style="font-weight: bold; color: ${rankColor}; font-size: 16px;">${rankText} ${entry.nickname}</span>
                <span style="font-weight: bold; color: #333; font-size: 16px;">${entry.score.toLocaleString()}点</span>
            `;
            
            rankingList.appendChild(rankDiv);
        });
    }
});
