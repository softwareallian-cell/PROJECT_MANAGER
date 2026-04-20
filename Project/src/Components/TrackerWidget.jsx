import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { stopGlobalTracker, setTrackerPanelOpen, fetchTimeSessions } from "./Redux";
import "./TrackerWidget.css";

const API = "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`;
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrackerWidget() {
    const dispatch = useDispatch();
    const currentUser = useSelector((s) => s.registration.currentUser);
    const activeTracker = useSelector((s) => s.registration.activeTracker);
    const panelOpen = useSelector((s) => s.registration.trackerPanelOpen);
    const createdProjects = useSelector((s) => s.registration.createdProjects);
    const assignedProjects = useSelector((s) => s.registration.assignedProjects);

    // Find full project data from Redux
    const project = activeTracker 
        ? [...createdProjects, ...assignedProjects].find(p => p._id === activeTracker.projectId) 
        : null;

    const subtaskIndex = activeTracker?.subtaskIndex;
    const subtaskTitle = activeTracker?.subtaskTitle;

    // ── Widget visibility logic ──────────────────────────────────────────
    const togglePanel = () => dispatch(setTrackerPanelOpen(!panelOpen));

    // ── State machine: CONFIRM | ACTIVE | PAUSED | SUMMARY ────────
    const [screen, setScreen] = useState("CONFIRM");

    // ── Form ───────────────────────────────────────────────────────
    const [comment, setComment] = useState("Starting");

    // ── Timer ──────────────────────────────────────────────────────
    const [totalSeconds, setTotalSeconds] = useState(0);
    const tickRef = useRef(null);

    // ── Session ────────────────────────────────────────────────────
    const [sessionId, setSessionId] = useState(null);

    // ── Screenshot ─────────────────────────────────────────────────
    const streamRef = useRef(null);
    const screenshotTimerRef = useRef(null);
    const [latestThumbUrl, setLatestThumbUrl] = useState(null);
    const [screenshotCount, setScreenshotCount] = useState(0);

    // ─── Recovery Sync Logic ──────────────────────────────────────────
    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("tracker_session");
        if (saved && activeTracker) {
            const data = JSON.parse(saved);
            setSessionId(data.sessionId);
            setComment(data.comment || "Restored");
            setLatestThumbUrl(data.latestThumbUrl);
            setScreenshotCount(data.screenshotCount || 0);
            
            if (data.screen === "ACTIVE") {
                // Determine time elapsed since the last tick
                const elapsedSinceLastTick = data.lastTickTime ? Math.floor((Date.now() - data.lastTickTime) / 1000) : 0;
                setTotalSeconds(data.totalSeconds + elapsedSinceLastTick);
                setScreen("INTERRUPTED"); // Stream is lost, need re-grant
            } else {
                setTotalSeconds(data.totalSeconds);
                setScreen(data.screen);
            }
        }
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (!activeTracker || !sessionId) return;
        const data = {
            sessionId,
            screen,
            totalSeconds,
            comment,
            latestThumbUrl,
            screenshotCount,
            lastTickTime: Date.now()
        };
        localStorage.setItem("tracker_session", JSON.stringify(data));
    }, [sessionId, screen, totalSeconds, comment, latestThumbUrl, screenshotCount, activeTracker]);



    // ── Cleanup on unmount ─────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearInterval(tickRef.current);
            clearTimeout(screenshotTimerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    // ── Timer helpers ──────────────────────────────────────────────
    const startTick = () => {
        clearInterval(tickRef.current);
        tickRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    };

    const stopTick = () => clearInterval(tickRef.current);

    // ── Screenshot capture ─────────────────────────────────────────
    const captureFrame = useCallback(async (sid) => {
        if (!streamRef.current) return;
        try {
            const track = streamRef.current.getVideoTracks()[0];
            if (!track || track.readyState === "ended") return;

            const imageCapture = new ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvas.getContext("2d").drawImage(bitmap, 0, 0);

            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append("screenshot", blob, "screenshot.png");
                const res = await fetch(`${API}/api/timesessions/${sid}/screenshot`, {
                    method: "POST",
                    body: formData,
                });
                if (res.ok) {
                    const { gridfsId } = await res.json();
                    setLatestThumbUrl(`${API}/api/screenshots/${gridfsId}`);
                    setScreenshotCount((c) => c + 1);
                }
            }, "image/png");
        } catch (err) {
            console.warn("Screenshot capture error:", err.message);
        }
    }, []);

    const scheduleNextCapture = useCallback(
        (sid) => {
            const delay = randomBetween(3 * 60, 7 * 60) * 1000; // 3–7 min in ms
            screenshotTimerRef.current = setTimeout(async () => {
                await captureFrame(sid);
                scheduleNextCapture(sid); // re-schedule
            }, delay);
        },
        [captureFrame]
    );

    // If no active tracker or project not found, don't show anything
    if (!activeTracker || !project) return null;

    // ── Start session ──────────────────────────────────────────────
    const handleStart = async () => {
        try {
            // 1. Request screen stream — one-time OS picker
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            streamRef.current = stream;

            // 2. Create session in DB
            const res = await fetch(`${API}/api/timesessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project._id,
                    subtaskIndex,
                    subtaskTitle,
                    userId: currentUser._id,
                    comment,
                }),
            });
            const session = await res.json();
            setSessionId(session._id);

            // 3. Start timer + screenshot schedule
            startTick();
            scheduleNextCapture(session._id);
            setScreen("ACTIVE");
        } catch (err) {
            // User may have cancelled the OS picker — just ignore
            console.warn("Start tracker error:", err.message);
        }
    };

    // ── Pause ──────────────────────────────────────────────────────
    const handlePause = async () => {
        stopTick();
        clearTimeout(screenshotTimerRef.current);
        await fetch(`${API}/api/timesessions/${sessionId}/pause`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalSeconds }),
        });
        setScreen("PAUSED");
    };

    // ── Resume ─────────────────────────────────────────────────────
    const handleResume = () => {
        startTick();
        scheduleNextCapture(sessionId);
        setScreen("ACTIVE");
    };

    // ── Resume after Interruption (Re-grant Stream) ────────────────
    const handleResumeStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            streamRef.current = stream;
            
            startTick();
            scheduleNextCapture(sessionId);
            setScreen("ACTIVE");
        } catch (err) {
            console.warn("Resume stream error:", err.message);
        }
    };

    // ── Stop ───────────────────────────────────────────────────────
    const handleStop = async () => {
        stopTick();
        clearTimeout(screenshotTimerRef.current);

        // Release screen capture stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        await fetch(`${API}/api/timesessions/${sessionId}/stop`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalSeconds }),
        });

        setScreen("SUMMARY");
    };

    // ── Close entirely ─────────────────────────────────────────────
    const handleClose = () => {
        // Refresh time sessions for the project if we just saved one
        if (project?._id) {
            dispatch(fetchTimeSessions(project._id));
        }
        dispatch(stopGlobalTracker());
    };

    // ─── Render helpers ────────────────────────────────────────────────────────

    const isActiveSession = screen === "ACTIVE" || screen === "PAUSED" || screen === "INTERRUPTED";

    // ─── JSX ───────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Floating toggle button — always visible as long as activeTracker exists */}
            <button
                id="tracker-toggle-btn"
                className={`tracker-toggle-btn${!panelOpen && isActiveSession ? " pulse" : ""}`}
                onClick={togglePanel}
                title={panelOpen ? "Hide Tracker" : "Show Tracker"}
            >
                ⏱
            </button>

            {/* Main panel */}
            {panelOpen && (
                <div className="tracker-panel" role="dialog" aria-label="Time Tracker">
                    {/* ── Header ── */}
                    <div className="tracker-header">
                        <span className="tracker-header-title">
                            Time Tracker
                            {screen === "ACTIVE" && (
                                <span className="tracker-status-badge active">● Live</span>
                            )}
                            {screen === "PAUSED" && (
                                <span className="tracker-status-badge paused">⏸ Paused</span>
                            )}
                            {screen === "INTERRUPTED" && (
                                <span className="tracker-status-badge paused" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⚠️ Stream Lost</span>
                            )}
                        </span>
                        <button
                            id="tracker-close-panel-btn"
                            className="tracker-close-btn"
                            onClick={() => {
                                if (screen === "CONFIRM" || screen === "SUMMARY") handleClose();
                                else togglePanel();
                            }}
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="tracker-body">

                        {/* ════════ CONFIRM SCREEN ════════ */}
                        {screen === "CONFIRM" && (
                            <>
                                <div className="tracker-meta">📁 {project.Title}</div>
                                {project.sprint && (
                                    <div className="tracker-meta">Sprint {project.sprint}</div>
                                )}
                                <div className="tracker-task-title">{subtaskTitle}</div>
                                <input
                                    id="tracker-comment-input"
                                    className="tracker-comment-input"
                                    placeholder="Session comment (optional)..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                                <div className="tracker-btn-row">
                                    <button id="tracker-cancel-btn" className="tracker-btn tracker-btn-ghost" onClick={handleClose}>
                                        Cancel
                                    </button>
                                    <button id="tracker-start-btn" className="tracker-btn tracker-btn-primary" onClick={handleStart}>
                                        ▶ Start
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ════════ ACTIVE SCREEN ════════ */}
                        {(screen === "ACTIVE" || screen === "PAUSED" || screen === "INTERRUPTED") && (
                            <>
                                <div className="tracker-meta">📁 {project.Title}</div>
                                <div className="tracker-task-title">{subtaskTitle}</div>
                                <div className="tracker-timer">{formatTime(totalSeconds)}</div>

                                {/* Screenshot thumbnail */}
                                <div className="tracker-screenshot-label">Latest Capture</div>
                                {latestThumbUrl ? (
                                    <img
                                        className="tracker-screenshot-thumb"
                                        src={latestThumbUrl}
                                        alt="Latest screenshot"
                                    />
                                ) : (
                                    <div className="tracker-screenshot-placeholder">
                                        📷 Capture pending…
                                    </div>
                                )}

                                <div className="tracker-btn-row">
                                    {screen === "INTERRUPTED" ? (
                                        <button id="tracker-resume-stream-btn" className="tracker-btn tracker-btn-primary" onClick={handleResumeStream}>
                                             📡 Resume Capture
                                        </button>
                                    ) : screen === "ACTIVE" ? (
                                        <button id="tracker-pause-btn" className="tracker-btn tracker-btn-ghost" onClick={handlePause}>
                                            ⏸ Pause
                                        </button>
                                    ) : (
                                        <button id="tracker-resume-btn" className="tracker-btn tracker-btn-ghost" onClick={handleResume}>
                                            ▶ Resume
                                        </button>
                                    )}
                                    <button id="tracker-stop-btn" className="tracker-btn tracker-btn-danger" onClick={handleStop}>
                                        ■ Stop &amp; Save
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ════════ SUMMARY SCREEN ════════ */}
                        {screen === "SUMMARY" && (
                            <div className="tracker-summary">
                                <div className="tracker-summary-icon">✅</div>
                                <div className="tracker-summary-title">Session Saved</div>
                                <div className="tracker-summary-total">{formatTime(totalSeconds)}</div>
                                <div className="tracker-summary-stat">
                                    Screenshots taken: {screenshotCount}
                                </div>
                                <div className="tracker-summary-stat" style={{ marginTop: "4px", color: "#555", fontSize: "12px" }}>
                                    {subtaskTitle}
                                </div>
                                <div style={{ marginTop: "18px" }}>
                                    <button id="tracker-done-btn" className="tracker-btn tracker-btn-primary" onClick={handleClose}>
                                        Close Widget
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
}
