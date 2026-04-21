import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { X, Edit3, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAllTimeSessions } from "./Redux";
import "./TimeSheet.css";

const API = "http://localhost:5000";

const HOURS = Array.from({ length: 24 }, (_, i) => ({
    val: i,
    label: `${String(i % 12 || 12).padStart(2, "0")}:00 ${i < 12 ? "AM" : "PM"}`
}));

// --- HEPLERS ---
function formatHour(h) {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
}

// ── Hover Card Component ──────────────────────────────────────
function HoverCard({ shot, position }) {
    if (!shot) return null;
    return (
        <div className="hover-card" style={{ top: position.y, left: position.x }}>
            <div className="hover-card-content">
                <div className="hover-card-header">
                    <div className="hover-card-title">{shot.subtaskTitle}</div>
                </div>
                <div className="hover-card-body">
                    <div className="hover-card-meta">
                        <span className="capture-time">Continuation • {new Date(shot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <img src={`${API}/api/screenshots/${shot.gridfsId}`} alt="Preview" className="hover-preview-img" />
                </div>
            </div>
        </div>
    );
}

// ── Full Preview Modal ───────────────────────────────────────
function FullPreviewPortal({ shot, onClose, currentUser }) {
    if (!shot) return null;
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="portal-overlay" onClick={onClose}>
            <div className="portal-content" onClick={e => e.stopPropagation()}>
                <div className="portal-header">
                    <h2>Screenshot Preview</h2>
                    <button className="portal-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="portal-body">
                    <div className="portal-main-section">
                        <h3 className="portal-subtask-title">{shot.subtaskTitle}</h3>

                        <div className="portal-meta-row">
                            <span className="timestamp">{new Date(shot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        </div>

                        <div className="portal-comment-box">
                            {shot.comment || "Continuation"}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <img src={`${API}/api/screenshots/${shot.gridfsId}`} alt="Detail" className="portal-big-img" />
                            {isAdmin && (
                                <button className="admin-edit-btn" onClick={() => alert("Admin Edit Mode Engaged")}>
                                    <Edit3 size={14} /> Edit Entry
                                </button>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export default function TimeSheet() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const currentUser = useSelector((s) => s.registration.currentUser);
    const allSessions = useSelector((s) => s.registration.allTimeSessions);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedShot, setSelectedShot] = useState(null);
    const [hoveredShot, setHoveredShot] = useState(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (currentUser?._id) {
            dispatch(fetchAllTimeSessions(currentUser._id));
        }
    }, [currentUser?._id, dispatch]);

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
        setSelectedShot(null);
    };

    const dailySessions = useMemo(() => {
        const dStr = selectedDate.toDateString();
        return allSessions.filter(s => new Date(s.startedAt).toDateString() === dStr);
    }, [allSessions, selectedDate]);

    const hourlyData = useMemo(() => {
        const buckets = HOURS.map(h => ({ ...h, screenshots: [] }));
        dailySessions.forEach(session => {
            (session.screenshots || []).forEach(shot => {
                const hour = new Date(shot.capturedAt).getHours();
                const bucket = buckets.find(b => b.val === hour);
                if (bucket) {
                    bucket.screenshots.push({
                        ...shot,
                        subtaskTitle: session.subtaskTitle,
                        projectId: session.projectId,
                        comment: session.comment
                    });
                }
            });
        });
        return buckets;
    }, [dailySessions]);

    // Timeline Bar calculations (SS1)
    const timelineSlots = Array.from({ length: 24 }, (_, i) => {
        const hasWork = hourlyData.find(h => h.val === i)?.screenshots.length > 0;
        return { hour: i, hasWork };
    });

    const handleMouseEnter = (e, shot) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredShot(shot);
        setHoverPos({ x: rect.left, y: rect.top - 10 }); // Show card above
    };

    const handleMouseLeave = () => setHoveredShot(null);

    return (
        <div className="timesheet-wrapper">
            <header className="timesheet-header">
                <button className="timesheet-back-btn" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </header>

            <div className="timesheet-main-layout">
                {/* Visual Timeline Bar (SS1 style) */}
                <div className="timesheet-top-bar">
                    <div className="date-picker-row">
                        <div className="date-nav">
                             <button onClick={() => changeDate(-1)}><ChevronLeft size={18} /></button>
                            <span>{selectedDate.toLocaleDateString('en-GB')}</span>
                             <button onClick={() => changeDate(1)}><ChevronRight size={18} /></button>
                        </div>

                    </div>

                    <div className="activity-range-bar">
                        <div className="hours-labels">
                            {HOURS.filter((_, i) => i % 1 === 0).map(h => (
                                <span key={h.val}>{formatHour(h.val)}</span>
                            ))}
                        </div>
                        <div className="range-track">
                            {timelineSlots.map(slot => (
                                <div
                                    key={slot.hour}
                                    className={`range-segment ${slot.hasWork ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="timeline-grid-view">
                    {hourlyData.map((hour) => (
                        <div key={hour.val} className={`hour-row ${hour.screenshots.length > 0 ? 'has-data' : ''}`}>
                            <div className="hour-row-header">
                                <div className="hour-title">
                                    {formatHour(hour.val)} - {formatHour((hour.val + 1) % 24)}
                                </div>
                            </div>

                            {hour.screenshots.length > 0 && (
                                <div className="screenshot-row">
                                    {hour.screenshots.map((shot, idx) => (
                                        <div
                                            key={idx}
                                            className="shot-card"
                                            onMouseEnter={(e) => handleMouseEnter(e, shot)}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => setSelectedShot(shot)}
                                        >
                                            <img src={`${API}/api/screenshots/${shot.gridfsId}`} alt="Shot" />
                                            <div className="shot-card-meta">
                                                <span className="shot-time">{new Date(shot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Hover Detail Card */}
            {hoveredShot && <HoverCard shot={hoveredShot} position={hoverPos} />}

            {/* Full Preview Portal */}
            {selectedShot && (
                <FullPreviewPortal
                    shot={selectedShot}
                    currentUser={currentUser}
                    onClose={() => setSelectedShot(null)}
                />
            )}
        </div>
    );
}
