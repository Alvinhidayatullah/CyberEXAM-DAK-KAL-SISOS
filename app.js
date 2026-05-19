// Music Playlist
const musicPlaylist = [
    "https://c.top4top.io/m_3791la5iu1.mp3",
    "https://d.top4top.io/m_3791wgjxn2.mp3",
    "https://e.top4top.io/m_3791mf0hv3.mp3",
    "https://k.top4top.io/m_3791lnhyo1.mp3",
    "https://l.top4top.io/m_37919ybf22.mp3",
    "https://b.top4top.io/m_3791kjno03.mp3",
    "https://c.top4top.io/m_3791p52bw4.mp3",
    "https://f.top4top.io/m_3791a0zge1.mp3",
    "https://g.top4top.io/m_3791mf4c32.mp3",
    "https://h.top4top.io/m_379112fuk3.mp3"
];

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function cleanPrefix(text) {
    if (!text) return '';
    return text.replace(/^[A-D]\.\s*/, '');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Main App Component
function App() {
    const [screen, setScreen] = React.useState('start');
    const [questions, setQuestions] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState(120 * 60);
    const [isMuted, setIsMuted] = React.useState(false);
    const [showResult, setShowResult] = React.useState(false);
    const [tempMessage, setTempMessage] = React.useState(null);
    
    const audioRef = React.useRef(null);
    const timerRef = React.useRef(null);
    const currentPlaylistRef = React.useRef([]);
    const currentTrackIndexRef = React.useRef(0);
    
    // Helper functions
    const shuffleOptions = (question) => {
        const options = [...question.options];
        const correctTextValue = question.correctText;
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        let newCorrectLetter = "";
        for (let i = 0; i < options.length; i++) {
            if (options[i] === correctTextValue || options[i].includes(correctTextValue)) {
                newCorrectLetter = String.fromCharCode(65 + i);
                break;
            }
        }
        return { shuffledOptions: options, newAnswer: newCorrectLetter };
    };
    
    const shuffleArraySoal = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };
    
    const calculatePercentageScore = React.useCallback(() => {
        if (questions.length === 0) return 0;
        let correct = 0;
        for (let i = 0; i < questions.length; i++) {
            if (questions[i]._userAnswer && questions[i]._userAnswer === questions[i]._shuffledData.newAnswer) {
                correct++;
            }
        }
        const rawScore = (correct / questions.length) * 100;
        return Math.round(rawScore * 10) / 10;
    }, [questions]);
    
    const showTempMessage = (msg, color) => {
        setTempMessage({ msg, color });
        setTimeout(() => setTempMessage(null), 1800);
    };
    
    const finalizeExam = React.useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setScreen('thankyou');
    }, []);
    
    // Music functions
    const initNewPlaylist = React.useCallback(() => {
        currentPlaylistRef.current = shuffleArray([...musicPlaylist]);
        currentTrackIndexRef.current = 0;
    }, []);
    
    const playCurrentTrack = React.useCallback(() => {
        if (!audioRef.current || currentPlaylistRef.current.length === 0) return;
        const trackSrc = currentPlaylistRef.current[currentTrackIndexRef.current];
        audioRef.current.src = trackSrc;
        if (!isMuted) {
            audioRef.current.play().catch(err => console.log("Play error:", err));
        }
    }, [isMuted]);
    
    const playNextTrack = React.useCallback(() => {
        if (!audioRef.current) return;
        currentTrackIndexRef.current++;
        if (currentTrackIndexRef.current >= currentPlaylistRef.current.length) {
            initNewPlaylist();
        }
        playCurrentTrack();
    }, [initNewPlaylist, playCurrentTrack]);
    
    const toggleMute = React.useCallback(() => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.volume = 0.4;
                audioRef.current.play().catch(e => console.log("Playback error"));
                setIsMuted(false);
            } else {
                audioRef.current.pause();
                setIsMuted(true);
            }
        }
    }, [isMuted]);
    
    // Timer effect
    React.useEffect(() => {
        if (screen === 'exam' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                        finalizeExam();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
    }, [screen, timeLeft, finalizeExam]);
    
    // Start exam
    const startExam = React.useCallback(() => {
        if (typeof MASTER_QUESTIONS === 'undefined' || MASTER_QUESTIONS.length === 0) {
            Swal.fire({
                title: 'ERROR!',
                text: 'Data soal tidak ditemukan. Periksa file soal.js',
                icon: 'error',
                background: '#0a0f1f',
                color: '#ff4444'
            });
            return;
        }
        
        const shuffled = shuffleArraySoal([...MASTER_QUESTIONS]);
        const processedQuestions = shuffled.map(q => ({
            ...q,
            _shuffledData: shuffleOptions(q),
            _userAnswer: null
        }));
        
        setQuestions(processedQuestions);
        setCurrentIndex(0);
        setTimeLeft(120 * 60);
        setScreen('exam');
    }, []);
    
    // Handle answer
    const handleAnswer = React.useCallback((letter) => {
        setQuestions(prev => {
            const updated = [...prev];
            updated[currentIndex] = {
                ...updated[currentIndex],
                _userAnswer: letter
            };
            return updated;
        });
    }, [currentIndex]);
    
    // Navigation
    const goPrev = React.useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            showTempMessage("🚀 Ini soal pertama", "#f0f");
        }
    }, [currentIndex]);
    
    const goNext = React.useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            showTempMessage("📌 Soal terakhir, klik SELESAI", "#0ff");
        }
    }, [currentIndex, questions.length]);
    
    const finishExam = React.useCallback(async () => {
        const result = await Swal.fire({
            title: '⚠️ SELESAI UJIAN?',
            text: "Semua jawaban akan dinilai dan sesi diakhiri. Anda yakin?",
            icon: 'question',
            background: '#0a0f1f',
            color: '#0ff',
            confirmButtonColor: '#f0f',
            cancelButtonColor: '#0ff',
            confirmButtonText: 'YA, SELESAI!',
            cancelButtonText: 'BATAL',
            showCancelButton: true,
            backdrop: 'rgba(0,0,0,0.8)'
        });
        if (result.isConfirmed) {
            finalizeExam();
        }
    }, [finalizeExam]);
    
    const restartExam = React.useCallback(() => {
        setScreen('start');
        setQuestions([]);
        setCurrentIndex(0);
        setShowResult(false);
        setTimeLeft(120 * 60);
    }, []);
    
    // Init audio
    React.useEffect(() => {
        const audio = new Audio();
        audio.volume = 0.4;
        audio.loop = false;
        audio.addEventListener('ended', playNextTrack);
        audio.addEventListener('error', playNextTrack);
        audioRef.current = audio;
        initNewPlaylist();
        
        setTimeout(() => {
            if (audioRef.current && !isMuted) {
                playCurrentTrack();
            }
        }, 100);
        
        const tryAutoplay = () => {
            if (audioRef.current && !isMuted) {
                audioRef.current.play().catch(e => console.log("Still blocked"));
            }
            document.removeEventListener('click', tryAutoplay);
            document.removeEventListener('touchstart', tryAutoplay);
        };
        document.addEventListener('click', tryAutoplay);
        document.addEventListener('touchstart', tryAutoplay);
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('ended', playNextTrack);
                audioRef.current.removeEventListener('error', playNextTrack);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);
    
    const answeredCount = questions.filter(q => q._userAnswer !== null).length;
    const percentageScore = calculatePercentageScore();
    
    // Format time
    const formatTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const s = sec % 60;
        return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    // Render components
    const renderMuteButton = () => {
        return React.createElement('button', {
            className: 'mute-button',
            onClick: toggleMute,
            key: 'mute-btn'
        }, isMuted ? '🔇 MUSIC OFF' : '🔊 MUSIC ON');
    };
    
    const renderTempMessage = () => {
        if (!tempMessage) return null;
        return React.createElement('div', {
            style: {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#000000cc',
                border: `1px solid ${tempMessage.color}`,
                color: tempMessage.color,
                padding: '8px 18px',
                borderRadius: '60px',
                fontSize: '0.8rem',
                zIndex: 999,
                fontFamily: 'monospace',
                fontWeight: 'bold'
            },
            key: 'temp-msg'
        }, tempMessage.msg);
    };
    
    const renderStartScreen = () => {
        return React.createElement('div', { className: 'cyber-card start-screen', key: 'start' },
            React.createElement('div', { className: 'glitch' }, 'CYBER TRAINING'),
            React.createElement('div', { className: 'badge-container' },
                React.createElement('span', { className: 'badge-cyber' }, '⚡ DAK'),
                React.createElement('span', { className: 'badge-cyber' }, '⚡ SISOS'),
                React.createElement('span', { className: 'badge-cyber' }, '⚡ KAL')
            ),
            React.createElement('p', { style: { color: '#9bb4ff' } }, 
                `${MASTER_QUESTIONS ? MASTER_QUESTIONS.length : 0} Soal Keamanan Siber | 120 Menit`
            ),
            React.createElement('p', { style: { color: '#0ff9', fontSize: '0.8rem' } }, '⟡ Waktu Berjalan Setelah Mulai ⟡'),
            React.createElement('button', { className: 'btn-cyber', onClick: startExam }, '⟢ MULAI UJIAN ⟣'),
            React.createElement('div', { className: 'footer-note' }, '© Cyber Training 2026 | Vinnzz')
        );
    };
    
    const renderExamPanel = () => {
        if (questions.length === 0) return null;
        const q = questions[currentIndex];
        const shuffledData = q._shuffledData;
        const selectedVal = q._userAnswer;
        const category = ["DAK", "KAL", "SISOS"][currentIndex % 3];
        
        const optionsHtml = shuffledData.shuffledOptions.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const cleanOpt = cleanPrefix(opt);
            const checkedAttr = selectedVal === letter;
            
            return React.createElement('label', { 
                key: idx, 
                className: 'opt-item',
                style: { cursor: 'pointer' }
            },
                React.createElement('input', {
                    type: 'radio',
                    name: 'currentQuestion',
                    value: letter,
                    checked: checkedAttr,
                    onChange: () => handleAnswer(letter),
                    className: 'opt-radio'
                }),
                React.createElement('span', { className: 'opt-text' }, `${letter}. ${escapeHtml(cleanOpt)}`)
            );
        });
        
        return React.createElement('div', { className: 'cyber-card', key: 'exam' },
            React.createElement('div', { className: 'status-bar' },
                React.createElement('div', { className: 'timer-neon' }, formatTime(timeLeft)),
                React.createElement('div', { className: 'q-counter' }, 
                    `Soal ${currentIndex + 1} / ${questions.length}  |  ✓ ${answeredCount} terjawab`
                )
            ),
            React.createElement('div', { className: 'question-area' },
                React.createElement('div', { className: 'q-num' }, `[${category}]  Soal ${currentIndex + 1} / ${questions.length}`),
                React.createElement('div', { className: 'question-text' }, escapeHtml(q.text)),
                React.createElement('div', { className: 'options-grid' }, optionsHtml)
            ),
            React.createElement('div', { className: 'nav-buttons' },
                React.createElement('button', { className: 'nav-btn', onClick: goPrev }, '◀ SEBELUM'),
                React.createElement('button', { className: 'nav-btn primary', onClick: goNext }, 'BERIKUT ▶'),
                React.createElement('button', { className: 'nav-btn submit-final', onClick: finishExam }, '✔ SELESAI')
            ),
            React.createElement('div', { className: 'footer-note' }, '# Jawaban Akan Tersimpan Secara Otomatis')
        );
    };
    
    const renderThankyouScreen = () => {
        let message = "";
        if (percentageScore === 100) message = "🏆 SEMPURNA! Anda Hebat! 🏆";
        else if (percentageScore >= 85) message = "🏅 LUAR BIASA! Anda menguasai materi! 🏅";
        else if (percentageScore >= 70) message = "🔥 SANGAT BAIK! Pertahankan! 🔥";
        else if (percentageScore >= 60) message = "✨ CUKUP BAIK, tingkatkan lagi! ✨";
        else if (percentageScore >= 50) message = "📚 Belajar lagi, Anda pasti bisa! 📚";
        else message = "💪 Jangan menyerah! Pelajari ulang dan coba lagi! 💪";
        
        return React.createElement('div', { className: 'cyber-card thankyou-screen', key: 'thankyou' },
            React.createElement('div', { className: 'glitch', style: { fontSize: 'clamp(1.3rem,5vw,2rem)' } }, '⚡ TERIMA KASIH ⚡'),
            React.createElement('p', { style: { color: '#b9f2ff' } }, 'Telah Mengikuti Pelatihan Ujian Siber'),
            React.createElement('div', { className: 'score-glow' }, `${percentageScore} / 100`),
            React.createElement('div', { className: 'message-motivation' }, 
                `✨ Nilai Anda: ${percentageScore} dari 100 ✨\n${message}`
            ),
            React.createElement('button', { className: 'btn-cyber', style: { marginTop: '20px' }, onClick: () => setShowResult(true) }, '📋 LIHAT KUNCI JAWABAN'),
            React.createElement('button', { className: 'btn-cyber', style: { marginTop: '12px' }, onClick: restartExam }, '⟳ KERJAKAN ULANG'),
            React.createElement('div', { className: 'footer-note' }, '© Cyber Training 2026')
        );
    };
    
    const renderResultModal = () => {
        if (!showResult) return null;
        
        const resultItems = questions.map((q, i) => {
            const shuffledData = q._shuffledData;
            const userAnswerLetter = q._userAnswer;
            const correctLetter = shuffledData.newAnswer;
            const isCorrect = userAnswerLetter === correctLetter;
            
            let userAnswerDisplay = "Tidak dijawab";
            if (userAnswerLetter) {
                const idx = userAnswerLetter.charCodeAt(0) - 65;
                const rawAnswerText = shuffledData.shuffledOptions[idx] || "Tidak diketahui";
                const cleanAnswerText = cleanPrefix(rawAnswerText);
                userAnswerDisplay = `${userAnswerLetter}. ${cleanAnswerText}`;
            }
            
            const correctIdx = correctLetter.charCodeAt(0) - 65;
            const rawCorrectText = shuffledData.shuffledOptions[correctIdx];
            const cleanCorrectText = cleanPrefix(rawCorrectText);
            const correctAnswerDisplay = `${correctLetter}. ${cleanCorrectText}`;
            
            return React.createElement('div', { 
                key: i, 
                className: `result-item ${isCorrect ? 'correct' : 'wrong'}` 
            },
                React.createElement('div', { className: 'result-question' }, 
                    React.createElement('strong', null, `Soal ${i + 1}:`), ` ${escapeHtml(q.text)}`
                ),
                React.createElement('div', { className: 'result-answer' }, 
                    '📌 ', React.createElement('span', null, 'Jawaban Anda:'), ` ${escapeHtml(userAnswerDisplay)}`
                ),
                React.createElement('div', { className: 'result-answer' }, 
                    '✅ ', React.createElement('span', null, 'Jawaban Benar:'), ` ${escapeHtml(correctAnswerDisplay)}`
                )
            );
        });
        
        return React.createElement('div', { 
            className: `result-modal ${showResult ? 'show' : ''}`,
            style: { visibility: showResult ? 'visible' : 'hidden', opacity: showResult ? 1 : 0 },
            key: 'modal'
        },
            React.createElement('div', { className: 'result-card' },
                React.createElement('div', { className: 'result-header' },
                    React.createElement('h3', null, '📋 KUNCI JAWABAN & HASIL ANDA'),
                    React.createElement('div', { className: 'result-score' }, `✨ SKOR: ${percentageScore} / 100 ✨`)
                ),
                React.createElement('div', { className: 'result-list-container' },
                    React.createElement('div', null, resultItems)
                ),
                React.createElement('button', { className: 'close-result', onClick: () => setShowResult(false) }, 'TUTUP')
            )
        );
    };
    
    let mainContent = null;
    if (screen === 'start') {
        mainContent = renderStartScreen();
    } else if (screen === 'exam') {
        mainContent = renderExamPanel();
    } else if (screen === 'thankyou') {
        mainContent = renderThankyouScreen();
    }
    
    return React.createElement('div', { className: 'app-container', style: { width: '100%', maxWidth: '850px', margin: '0 auto' } },
        renderMuteButton(),
        mainContent,
        renderTempMessage(),
        renderResultModal()
    );
}

// Mount app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
