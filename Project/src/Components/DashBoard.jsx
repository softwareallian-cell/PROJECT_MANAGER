import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, Folder, Clock } from "lucide-react";
import "./DashBoard.css"
import GanttView from "./GanttView";
import { fetchCreatedProjects, fetchAssignedProjects } from "../redux/slices/projectSlice";

const STATUS_CLASSES = {
    backlog: 'status-backlog',
    todo: 'status-todo',
    inprogress: 'status-inprogress',
    inreview: 'status-inreview',
    onhold: 'status-onhold',
    done: 'status-done',
    complete: 'status-complete'
};

const PRIORITY_CLASSES = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high'
};

// ── Pure SVG Donut Chart ──────────────────────────────────────
function DonutChart({ data, size = 180, thickness = 36, title, total }) {
    const [hovered, setHovered] = useState(null);

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const cx = size / 2;
    const cy = size / 2;

    const nonZero = data.filter(d => d.value > 0);
    const sum = nonZero.reduce((acc, d) => acc + d.value, 0);

    if (sum === 0) {
        return (
            <div className="chart-box empty-chart">
                <div className="chart-title">{title}</div>
                <svg width={size} height={size}>
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth={thickness} />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text-secondary)" fontSize="13">No data</text>
                </svg>
            </div>
        );
    }

    let cumulative = 0;
    const slices = nonZero.map(d => {
        const pct = d.value / sum;
        const dashLength = pct * circumference;
        const offset = circumference - cumulative * circumference;
        cumulative += pct;
        return { ...d, dashLength, offset, pct };
    });

    return (
        <div className="chart-wrapper">
            <div className="chart-title">{title}</div>
            <div className="donut-container">
                <svg width={size} height={size} className="donut-svg">
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth={thickness} />
                    {slices.map((s, i) => (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={hovered === i ? thickness + 6 : thickness}
                            strokeDasharray={`${s.dashLength} ${circumference - s.dashLength}`}
                            strokeDashoffset={s.offset}
                            className={`donut-slice ${hovered === i ? 'hovered' : ''}`}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    ))}
                </svg>
                <div className="donut-center-overlay">
                    {hovered !== null ? (
                        <>
                            <div className="donut-center-val highlighted" style={{ color: slices[hovered]?.color }}>{slices[hovered]?.value}</div>
                            <div className="donut-center-label">{slices[hovered]?.label}</div>
                        </>
                    ) : (
                        <>
                            <div className="donut-center-val">{total ?? sum}</div>
                            <div className="donut-center-label">total</div>
                        </>
                    )}
                </div>
            </div>

            <div className="chart-legend">
                {slices.map((s, i) => (
                    <div key={i} className={`legend-item ${hovered === i ? 'active' : ''}`}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}>
                        <div className="legend-dot" style={{ background: s.color }} />
                        <span className="label-text">{s.label}</span>
                        <span className="legend-pct">
                            {s.value} <small>({Math.round(s.pct * 100)}%)</small>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Analytics Tab ─────────────────────────────────────────────
function AnalyticsTab({ createdProjects, assignedProjects }) {
    const allProjects = [...createdProjects, ...assignedProjects];
    const unique = [...new Map(allProjects.map(p => [p._id, p])).values()];

    const statusData = [
        { label: 'Backlog', value: unique.filter(p => p.status === 'backlog').length, color: 'var(--text-secondary)' },
        { label: 'To Do', value: unique.filter(p => p.status === 'todo').length, color: '#4a9eff' },
        { label: 'In Progress', value: unique.filter(p => p.status === 'inprogress').length, color: 'var(--accent-amber)' },
        { label: 'In Review', value: unique.filter(p => p.status === 'inreview').length, color: '#a855f7' },
        { label: 'On Hold', value: unique.filter(p => p.status === 'onhold').length, color: '#f59e0b' },
        { label: 'Done', value: unique.filter(p => p.status === 'done').length, color: '#10b981' },
        { label: 'Complete', value: unique.filter(p => p.status === 'complete').length, color: '#22c55e' }
    ];

    const priorityData = [
        { label: 'Low', value: unique.filter(p => p.priority === 'low').length, color: '#10b981' },
        { label: 'Medium', value: unique.filter(p => p.priority === 'medium').length, color: 'var(--accent-amber)' },
        { label: 'High', value: unique.filter(p => p.priority === 'high').length, color: 'var(--danger)' }
    ];

    const workloadMap = {};
    createdProjects.forEach(p => {
        (p.assignedTo || []).forEach(uid => {
            const key = String(uid).slice(-6);
            workloadMap[key] = (workloadMap[key] || 0) + 1;
        });
    });

    const memberColors = ['#4a9eff', '#a855f7', '#f2aa4d', '#22c55e', '#ef4444', '#2dd4bf', '#84cc16'];
    const workloadData = Object.entries(workloadMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([uid, count], i) => ({
            label: `Member …${uid}`,
            value: count,
            color: memberColors[i % memberColors.length]
        }));

    const totalAssigned = workloadData.reduce((a, b) => a + b.value, 0);

    const today = new Date().toISOString().substring(0, 10);
    const overdue = unique.filter(p => p.date < today && !['done', 'complete'].includes(p.status)).length;
    const completed = unique.filter(p => ['done', 'complete'].includes(p.status)).length;
    const inProgress = unique.filter(p => p.status === 'inprogress').length;
    const completionRate = unique.length ? Math.round((completed / unique.length) * 100) : 0;

    const statCards = [
        { label: 'Total Projects', value: unique.length, class: 'total' },
        { label: 'Completed', value: completed, class: 'completed' },
        { label: 'In Progress', value: inProgress, class: 'progress' },
        { label: 'Overdue', value: overdue, class: 'danger' },
        { label: 'Completion Rate', value: `${completionRate}%`, class: 'rate' },
    ];

    return (
        <div className="analytics-tab-content">
            <div className="analytics-grid">
                {statCards.map(s => (
                    <div key={s.label} className={`analytics-card stat-variant-${s.class}`}>
                        <div className="analytics-val">{s.value}</div>
                        <div className="analytics-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="charts-container">
                <DonutChart
                    data={statusData}
                    title="Distribution by Status"
                    total={unique.length}
                />
                <DonutChart
                    data={priorityData}
                    title="Volume by Priority"
                    total={unique.length}
                />
                {workloadData.length > 0 ? (
                    <DonutChart
                        data={workloadData}
                        title="Workload per Member"
                        total={totalAssigned}
                    />
                ) : (
                    <div className="chart-box empty-state">
                        <div className="chart-title">Workload per Member</div>
                        <div className="empty-chart-text">No active assignments</div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main DashBoard ────────────────────────────────────────────
function DashBoard() {
    const navigate = useNavigate();
    const CURRENTUSER_ID = JSON.parse(localStorage.getItem("CURRENTUSER"))[0]._id;
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        dispatch(fetchCreatedProjects(CURRENTUSER_ID));
        dispatch(fetchAssignedProjects(CURRENTUSER_ID));
    }, [dispatch, CURRENTUSER_ID]);

    const createdProjects = useSelector((state) => state.projects.createdProjects);
    const assignedProjects = useSelector((state) => state.projects.assignedProjects);
    const notifications = useSelector((state) => state.auth.notifications);

    const unreadCount = notifications.filter(n => !n.read).length;
    const today = new Date().toISOString().substring(0, 10);

    const total = createdProjects.length;
    const active = createdProjects.filter(p => p.status === 'inprogress').length;
    const completed = createdProjects.filter(p => p.status === 'complete' || p.status === 'done').length;
    const overdue = createdProjects.filter(p => p.date < today && p.status !== 'complete' && p.status !== 'done').length;
    const inReview = createdProjects.filter(p => p.status === 'inreview').length;

    const pctVal = (count) => total ? (count / total) * 100 : 0;

    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Project Control Center</h1>
                {unreadCount > 0 && (
                    <div className="notice-banner">
                        <span className="icon"><Bell size={18} /></span>
                        <span>You have <strong>{unreadCount}</strong> pending update{unreadCount > 1 ? 's' : ''}</span>
                    </div>
                )}
            </header>

            <nav className="dashboard-tabs">
                <button 
                    className={`dashboard-tab${activeTab === "overview" ? " active" : ""}`} 
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button 
                    className={`dashboard-tab${activeTab === "gantt" ? " active" : ""}`} 
                    onClick={() => setActiveTab("gantt")}
                >
                    Gantt View
                </button>
                <button 
                    className={`dashboard-tab${activeTab === "analytics" ? " active" : ""}`} 
                    onClick={() => setActiveTab("analytics")}
                >
                    Live Analytics
                </button>
            </nav>

            <main className="dashboard-main-content">
                {activeTab === "overview" && (
                    <div className="overview-pane">
                        <div className="summary-stat-group">
                            <div className="main-stat">
                                <span className="val">{total}</span>
                                <span className="lbl">Total Active Projects</span>
                            </div>
                            <div className="assigned-pill">
                                <b>{assignedProjects.length}</b> projects assigned to you
                            </div>
                        </div>

                        <div className="progress-section">
                            <div className="progress-item">
                                <div className="p-header">
                                    <span>In Progress</span>
                                    <span className="count">{active}</span>
                                </div>
                                <div className="p-track">
                                    <div className="p-fill in-progress" style={{ width: `${pctVal(active)}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="p-header">
                                    <span>In Review</span>
                                    <span className="count">{inReview}</span>
                                </div>
                                <div className="p-track">
                                    <div className="p-fill in-review" style={{ width: `${pctVal(inReview)}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="p-header">
                                    <span>Completed</span>
                                    <span className="count">{completed}</span>
                                </div>
                                <div className="p-track">
                                    <div className="p-fill completed" style={{ width: `${pctVal(completed)}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="p-header danger">
                                    <span>Overdue</span>
                                    <span className="count">{overdue}</span>
                                </div>
                                <div className="p-track">
                                    <div className="p-fill overdue" style={{ width: `${pctVal(overdue)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "gantt" && <GanttView />}

                {activeTab === "analytics" && (
                    <AnalyticsTab
                        createdProjects={createdProjects}
                        assignedProjects={assignedProjects}
                    />
                )}
            </main>

            <footer className="dashboard-footer">
                <button className="dash-action-btn primary" onClick={() => navigate("/projects")}>
                    <Folder size={18} /> Project Directory
                </button>
                <button className="dash-action-btn" onClick={() => navigate("/timesheet")}>
                    <Clock size={18} /> Global Timesheet
                </button>
            </footer>
        </div>
    );
}

export default DashBoard;