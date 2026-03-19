import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./DashBoard.css"
import GanttView from "./GanttView";
import { fetchCreatedProjects, fetchAssignedProjects } from "./Redux";

const STATUS_COLORS = {
    backlog: 'gray',
    todo: '#4a9eff',
    inprogress: '#f2aa4d',
    inreview: '#a855f7',
    onhold: 'orange',
    done: 'teal',
    complete: 'lime'
};

const STATUS_LABELS = {
    backlog: 'Backlog',
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    onhold: 'On Hold',
    done: 'Done',
    complete: 'Complete'
};

const PRIORITY_COLORS = {
    low: '#22c55e',
    medium: '#f2aa4d',
    high: '#ef4444'
};

// ── Pure SVG Donut Chart ──────────────────────────────────────
function DonutChart({ data, size = 180, thickness = 36, title, total }) {
    const [hovered, setHovered] = useState(null);

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const cx = size / 2;
    const cy = size / 2;

    // Filter out zero values
    const nonZero = data.filter(d => d.value > 0);
    const sum = nonZero.reduce((acc, d) => acc + d.value, 0);

    if (sum === 0) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
                <svg width={size} height={size}>
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1e1e3a" strokeWidth={thickness} />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#333" fontSize="13">No data</text>
                </svg>
            </div>
        );
    }

    // Build slices
    let cumulative = 0;
    const slices = nonZero.map(d => {
        const pct = d.value / sum;
        const dashLength = pct * circumference;
        const offset = circumference - cumulative * circumference;
        cumulative += pct;
        return { ...d, dashLength, offset, pct };
    });

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background track */}
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1a1a2e" strokeWidth={thickness} />
                    {/* Slices */}
                    {slices.map((s, i) => (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={hovered === i ? thickness + 6 : thickness}
                            strokeDasharray={`${s.dashLength} ${circumference - s.dashLength}`}
                            strokeDashoffset={s.offset}
                            strokeLinecap="butt"
                            style={{ cursor: 'pointer', transition: 'stroke-width 0.15s' }}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    ))}
                </svg>
                {/* Center label */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none'
                }}>
                    {hovered !== null ? (
                        <>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: slices[hovered]?.color }}>{slices[hovered]?.value}</div>
                            <div style={{ fontSize: '10px', color: '#888', maxWidth: '60px', lineHeight: 1.2 }}>{slices[hovered]?.label}</div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f0' }}>{total ?? sum}</div>
                            <div style={{ fontSize: '11px', color: '#555' }}>total</div>
                        </>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start', paddingLeft: '10px' }}>
                {slices.map((s, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px',
                        color: hovered === i ? s.color : '#888',
                        cursor: 'pointer', transition: 'color 0.15s'
                    }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span>{s.label}</span>
                        <span style={{ color: '#555', marginLeft: 'auto' }}>
                            {s.value} ({Math.round(s.pct * 100)}%)
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

    // Chart 1 — by status
    const statusData = Object.entries(STATUS_COLORS).map(([key, color]) => ({
        label: STATUS_LABELS[key],
        value: unique.filter(p => p.status === key).length,
        color
    }));

    // Chart 2 — by priority
    const priorityData = Object.entries(PRIORITY_COLORS).map(([key, color]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: unique.filter(p => p.priority === key).length,
        color
    }));

    // Chart 3 — workload per member (assignedTo counts)
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
            label: `…${uid}`,
            value: count,
            color: memberColors[i % memberColors.length]
        }));

    const totalAssigned = workloadData.reduce((a, b) => a + b.value, 0);

    // Stats summary row
    const today = new Date().toISOString().substring(0, 10);
    const overdue = unique.filter(p => p.date < today && !['done', 'complete'].includes(p.status)).length;
    const completed = unique.filter(p => ['done', 'complete'].includes(p.status)).length;
    const inProgress = unique.filter(p => p.status === 'inprogress').length;
    const completionRate = unique.length ? Math.round((completed / unique.length) * 100) : 0;

    const statCards = [
        { label: 'Total Projects', value: unique.length, color: '#4a9eff' },
        { label: 'Completed', value: completed, color: 'teal' },
        { label: 'In Progress', value: inProgress, color: '#f2aa4d' },
        { label: 'Overdue', value: overdue, color: '#ef4444' },
        { label: 'Completion Rate', value: `${completionRate}%`, color: '#84cc16' },
    ];

    return (
        <div style={{ padding: '10px 0' }}>
            {/* Summary stat cards */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                {statCards.map(s => (
                    <div key={s.label} style={{
                        background: '#1a1a2e',
                        border: `1px solid ${s.color}33`,
                        borderRadius: '10px',
                        padding: '16px 20px',
                        minWidth: '130px',
                        flex: '1'
                    }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Donut charts row */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'space-around' }}>
                <div style={{ background: '#1a1a2e', border: '1px solid #222240', borderRadius: '12px', padding: '24px' }}>
                    <DonutChart
                        data={statusData}
                        title="Projects by Status"
                        total={unique.length}
                        size={180}
                        thickness={36}
                    />
                </div>

                <div style={{ background: '#1a1a2e', border: '1px solid #222240', borderRadius: '12px', padding: '24px' }}>
                    <DonutChart
                        data={priorityData}
                        title="Projects by Priority"
                        total={unique.length}
                        size={180}
                        thickness={36}
                    />
                </div>

                <div style={{ background: '#1a1a2e', border: '1px solid #222240', borderRadius: '12px', padding: '24px' }}>
                    {workloadData.length > 0 ? (
                        <DonutChart
                            data={workloadData}
                            title="Workload per Member"
                            total={totalAssigned}
                            size={180}
                            thickness={36}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', minWidth: '200px' }}>
                            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workload per Member</div>
                            <div style={{ color: '#333', fontSize: '13px', padding: '40px 0' }}>No members assigned yet</div>
                        </div>
                    )}
                </div>
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
    }, []);

    const createdProjects = useSelector((state) => state.registration.createdProjects);
    const assignedProjects = useSelector((state) => state.registration.assignedProjects);
    const notifications = useSelector((state) => state.registration.notifications);

    const unreadCount = notifications.filter(n => !n.read).length;
    const today = new Date().toISOString().substring(0, 10);

    const total = createdProjects.length;
    const active = createdProjects.filter(p => p.status === 'inprogress').length;
    const completed = createdProjects.filter(p => p.status === 'complete').length;
    const overdue = createdProjects.filter(p => p.date < today && p.status !== 'complete' && p.status !== 'done').length;
    const inReview = createdProjects.filter(p => p.status === 'inreview').length;

    const pct = (count) => total ? `${Math.round((count / total) * 100)}%` : '0%';

    const tabStyle = (tab) => ({
        padding: '8px 20px',
        cursor: 'pointer',
        border: 'none',
        borderBottom: activeTab === tab ? '2px solid var(--accent-amber)' : '2px solid transparent',
        background: 'transparent',
        color: activeTab === tab ? 'var(--accent-amber)' : 'inherit',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        fontSize: '14px'
    });

    return (
        <div className="dashboard-wrapper">
            <div style={{ width: '100%' }}>
                <h1 style={{ color: '#f2aa4d' }}>DASHBOARD VIEW</h1>

                {/* Notification banner */}
                {unreadCount > 0 && (
                    <div style={{
                        background: '#a855f7',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        🔔 You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                    </div>
                )}

                {/* Tab bar */}
                <div style={{ borderBottom: '1px solid #333', display: 'flex', gap: '4px', marginBottom: '24px' }}>
                    <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>
                        Overview
                    </button>
                    <button style={tabStyle("gantt")} onClick={() => setActiveTab("gantt")}>
                        Gantt Chart
                    </button>
                    <button style={tabStyle("analytics")} onClick={() => setActiveTab("analytics")}>
                        📊 Analytics
                    </button>
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === "overview" && (
                    <div className="stat-card">
                        <h2>Total Projects: {total}</h2>

                        <h2>In Progress: {active}</h2>
                        <div className="bar-track">
                            <div className="bar-fill" style={{ background: STATUS_COLORS.inprogress, width: pct(active) }}></div>
                        </div>

                        <h2>In Review: {inReview}</h2>
                        <div className="bar-track">
                            <div className="bar-fill" style={{ background: STATUS_COLORS.inreview, width: pct(inReview) }}></div>
                        </div>

                        <h2>Completed: {completed}</h2>
                        <div className="bar-track">
                            <div className="bar-fill" style={{ background: STATUS_COLORS.complete, width: pct(completed) }}></div>
                        </div>

                        <h2><i style={{ color: 'red' }}>Overdue:</i> {overdue}</h2>
                        <div className="bar-track">
                            <div className="bar-fill" style={{ background: 'red', width: pct(overdue) }}></div>
                        </div>

                        <h2>Assigned to Me: {assignedProjects.length}</h2>
                    </div>
                )}

                {/* ── Gantt Tab ── */}
                {activeTab === "gantt" && (
                    <GanttView />
                )}

                {/* ── Analytics Tab ── */}
                {activeTab === "analytics" && (
                    <AnalyticsTab
                        createdProjects={createdProjects}
                        assignedProjects={assignedProjects}
                    />
                )}

                <button className="back-btn" onClick={() => navigate("/projects")} style={{ marginTop: '20px' }}>
                    View All Projects
                </button>
            </div>
        </div>
    );
}

export default DashBoard;