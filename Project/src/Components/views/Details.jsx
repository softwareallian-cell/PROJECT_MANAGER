import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Play, Calendar, Paperclip, FileText, Image, X, AlertCircle, Plus, Inbox, Ghost, Activity } from "lucide-react";
import "./Details.css";
import { useDispatch, useSelector } from "react-redux";
import { updateProjectDetails, fetchTimeSessions } from "../../redux/slices/projectSlice";
import { startGlobalTracker } from "../../redux/slices/uiSlice";
import { BASE_URL } from "../../redux/constants";

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

function Details() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const createdProjects = useSelector((state) => state.projects.createdProjects);
    const assignedProjects = useSelector((state) => state.projects.assignedProjects);
    const allProjects = [...createdProjects, ...assignedProjects];
    const project = allProjects.find((p) => p._id === id);

    const [activeTab, setActiveTab] = useState("subtasks");
    const [newSubtask, setNewSubtask] = useState("");
    const [newCheckItem, setNewCheckItem] = useState("");
    const [newMilestone, setNewMilestone] = useState("");
    const [newMilestoneDate, setNewMilestoneDate] = useState("");
    const [selectedSession, setSelectedSession] = useState(null);

    // Time sessions
    const timeSessions = useSelector((s) => s.projects.timeSessions);
    const activeTracker = useSelector((state) => state.ui.activeTracker);

    useEffect(() => {
        if (activeTab === "timelog" && project) {
            dispatch(fetchTimeSessions(project._id));
        }
    }, [activeTab, project, dispatch]);

    // Attachments state
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    if (!project) {
        return (
            <div className="details-container">
                <div className="empty-state">
                    <h1>Project Not Found</h1>
                    <button onClick={() => navigate("/projects")}>Go Back</button>
                </div>
            </div>
        );
    }

    // --- SUBTASK HANDLERS ---
    const addSubtask = () => {
        if (!newSubtask.trim()) return;
        const updated = [...(project.subtasks || []), { title: newSubtask.trim(), completed: false }];
        dispatch(updateProjectDetails({ id, field: 'subtasks', value: updated }));
        setNewSubtask("");
    };

    const toggleSubtask = (index) => {
        const updated = project.subtasks.map((s, i) =>
            i === index ? { ...s, completed: !s.completed } : s
        );
        dispatch(updateProjectDetails({ id, field: 'subtasks', value: updated }));
    };

    const deleteSubtask = (index) => {
        const updated = project.subtasks.filter((_, i) => i !== index);
        dispatch(updateProjectDetails({ id, field: 'subtasks', value: updated }));
    };

    // --- CHECKLIST HANDLERS ---
    const addChecklist = () => {
        if (!newCheckItem.trim()) return;
        const updated = [...(project.checklist || []), { item: newCheckItem.trim(), done: false }];
        dispatch(updateProjectDetails({ id, field: 'checklist', value: updated }));
        setNewCheckItem("");
    };

    // --- MILESTONE HANDLERS ---
    const addMilestone = () => {
        if (!newMilestone.trim()) return;
        const updated = [...(project.milestones || []), { title: newMilestone.trim(), dueDate: newMilestoneDate, completed: false }];
        dispatch(updateProjectDetails({ id, field: 'milestones', value: updated }));
        setNewMilestone("");
        setNewMilestoneDate("");
    };

    const toggleMilestone = (index) => {
        const updated = project.milestones.map((m, i) =>
            i === index ? { ...m, completed: !m.completed } : m
        );
        dispatch(updateProjectDetails({ id, field: 'milestones', value: updated }));
    };

    const deleteMilestone = (index) => {
        const updated = project.milestones.filter((_, i) => i !== index);
        dispatch(updateProjectDetails({ id, field: 'milestones', value: updated }));
    };

    // --- ATTACHMENT HANDLERS ---
    const uploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError("");
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${BASE_URL}/api/projects/${id}/attachments`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Upload failed');
            }
            const updatedProject = await res.json();
            dispatch(updateProjectDetails({ id, field: 'attachments', value: updatedProject.attachments }));
            dispatch(updateProjectDetails({ id, field: 'activityLog', value: updatedProject.activityLog }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const deleteAttachment = async (fileId, filename) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;
        try {
            const res = await fetch(`${BASE_URL}/api/projects/${id}/attachments/${fileId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Delete failed');
            const updatedProject = await res.json();
            dispatch(updateProjectDetails({ id, field: 'attachments', value: updatedProject.attachments }));
            dispatch(updateProjectDetails({ id, field: 'activityLog', value: updatedProject.activityLog }));
        } catch (err) {
            alert(err.message);
        }
    };

    const subtasksDone = (project.subtasks || []).filter(s => s.completed).length;
    const checklistDone = (project.checklist || []).filter(c => c.done).length;
    const milestonesDone = (project.milestones || []).filter(m => m.completed).length;

    const ProgressBar = ({ done, total }) => {
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        return (
            <div className="details-progress-container">
                <div className="details-progress-meta">
                    <span>{done}/{total} completed</span>
                    <span>{pct}%</span>
                </div>
                <div className="details-progress-track">
                    <div className="details-progress-fill" style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="details-wrapper">
                <button className="back-link" onClick={() => navigate("/projects")}>
                    <ArrowLeft size={16} /> Back to Projects
                </button>

                <div className="details-card">
                    <div className="details-header-badges">
                        <span className={`details-badge ${STATUS_CLASSES[project.status] || 'status-backlog'}`}>
                            {project.status}
                        </span>
                        <span className={`details-badge ${PRIORITY_CLASSES[project.priority] || 'priority-medium'}`}>
                            {project.priority} priority
                        </span>
                        <span className="details-badge sprint">
                            Sprint {project.sprint}
                        </span>
                    </div>

                    <h2>{project.Title}</h2>
                    <p className="details-desc"><strong>Description:</strong> {project.Description}</p>

                    <div className="details-meta-grid">
                        <div className="meta-item">
                            <span className="meta-label">Due Date</span>
                            <span className="meta-value">{project.date}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Start Date</span>
                            <span className="meta-value">{project.startDate}</span>
                        </div>
                    </div>

                    {project.tags && project.tags.length > 0 && (
                        <div className="details-tags">
                            {project.tags.map((tag, i) => (
                                <span key={i} className="kanban-tag">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ── TABS ── */}
                    <div className="details-tabs">
                        <button className={`details-tab${activeTab === "subtasks" ? " active" : ""}`} onClick={() => setActiveTab("subtasks")}>
                            Subtasks ({(project.subtasks || []).length})
                        </button>
                        <button className={`details-tab${activeTab === "checklist" ? " active" : ""}`} onClick={() => setActiveTab("checklist")}>
                            Checklist ({(project.checklist || []).length})
                        </button>
                        <button className={`details-tab${activeTab === "milestones" ? " active" : ""}`} onClick={() => setActiveTab("milestones")}>
                            Milestones ({(project.milestones || []).length})
                        </button>
                        <button className={`details-tab${activeTab === "attachments" ? " active" : ""}`} onClick={() => setActiveTab("attachments")}>
                            FILES ({(project.attachments || []).length})
                        </button>
                        <button className={`details-tab${activeTab === "activity" ? " active" : ""}`} onClick={() => setActiveTab("activity")}>
                            Activity
                        </button>
                        <button id="timelog-tab-btn" className={`details-tab${activeTab === "timelog" ? " active" : ""}`} onClick={() => setActiveTab("timelog")}>
                            TIME LOG
                        </button>
                    </div>

                    <div className="details-tab-content">

                        {/* ── SUBTASKS TAB ── */}
                        {activeTab === "subtasks" && (
                            <div className="tab-pane">
                                <ProgressBar done={subtasksDone} total={(project.subtasks || []).length} />
                                <div className="add-item-row">
                                    <input
                                        type="text"
                                        placeholder="Add subtask..."
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                    />
                                    <button onClick={addSubtask} className="add-btn-icon">
                                        <Plus size={16} /> Add
                                    </button>
                                </div>

                                {(project.subtasks || []).length === 0 ? (
                                    <div className="empty-tab-text">
                                        <Inbox size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No subtasks yet</p>
                                    </div>
                                ) : (
                                    (project.subtasks || []).map((s, i) => {
                                        const loggedSecs = timeSessions
                                            .filter(sess => sess.subtaskIndex === i && sess.status === 'stopped')
                                            .reduce((acc, sess) => acc + (sess.totalSeconds || 0), 0);
                                        const lh = Math.floor(loggedSecs / 3600);
                                        const lm = Math.floor((loggedSecs % 3600) / 60);
                                        const loggedLabel = loggedSecs > 0 ? `${lh}h ${String(lm).padStart(2, '0')}m` : null;

                                        return (
                                            <div key={i} className="detail-item-row">
                                                <input
                                                    type="checkbox"
                                                    checked={s.completed}
                                                    onChange={() => toggleSubtask(i)}
                                                    className="tracker-checkbox"
                                                />
                                                <span className={`detail-item-text${s.completed ? " completed" : ""}`}>
                                                    {s.title}
                                                </span>
                                                {loggedLabel && (
                                                    <span className="logged-time-badge"><Clock size={12} /> {loggedLabel}</span>
                                                )}
                                                <button
                                                    id={`tracker-open-btn-${i}`}
                                                    onClick={() => dispatch(startGlobalTracker({ projectId: project._id, subtaskIndex: i, subtaskTitle: s.title }))}
                                                    className="btn-track-subtask"
                                                    title={activeTracker ? "A tracking session is already active" : "Track time on this subtask"}
                                                    disabled={!!activeTracker}
                                                >
                                                    {activeTracker?.projectId === project._id && activeTracker?.subtaskIndex === i ? (
                                                        <><Activity size={12} /> Tracking</>
                                                    ) : (
                                                        <><Play size={12} /> Track</>
                                                    )}
                                                </button>
                                                <button onClick={() => deleteSubtask(i)} className="detail-action-btn"><X size={14} /></button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* ── CHECKLIST TAB ── */}
                        {activeTab === "checklist" && (
                            <div className="tab-pane">
                                <ProgressBar done={checklistDone} total={(project.checklist || []).length} />
                                <div className="add-item-row">
                                    <input
                                        type="text"
                                        placeholder="Add checklist item..."
                                        value={newCheckItem}
                                        onChange={(e) => setNewCheckItem(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addChecklist()}
                                    />
                                    <button onClick={addChecklist} className="add-btn-icon">
                                        <Plus size={16} /> Add
                                    </button>
                                </div>

                                {(project.checklist || []).length === 0 ? (
                                    <div className="empty-tab-text">
                                        <Inbox size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No checklist items yet</p>
                                    </div>
                                ) : (
                                    (project.checklist || []).map((c, i) => (
                                        <div key={i} className="detail-item-row">
                                            <input
                                                type="checkbox"
                                                checked={c.done}
                                                onChange={() => (dispatch(updateProjectDetails({ id, field: 'checklist', value: project.checklist.map((item, idx) => idx === i ? { ...item, done: !item.done } : item) })))}
                                            />
                                            <span className={`detail-item-text${c.done ? " completed" : ""}`}>
                                                {c.item}
                                            </span>
                                            <button onClick={() => (dispatch(updateProjectDetails({ id, field: 'checklist', value: project.checklist.filter((item, idx) => idx !== i) })))} className="detail-action-btn"><X size={14} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── MILESTONES TAB ── */}
                        {activeTab === "milestones" && (
                            <div className="tab-pane">
                                <ProgressBar done={milestonesDone} total={(project.milestones || []).length} />
                                <div className="add-item-row milestone-row">
                                    <input
                                        type="text"
                                        placeholder="Milestone title..."
                                        value={newMilestone}
                                        onChange={(e) => setNewMilestone(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        value={newMilestoneDate}
                                        onChange={(e) => setNewMilestoneDate(e.target.value)}
                                    />
                                    <button onClick={addMilestone} className="add-btn-icon">
                                        <Plus size={16} /> Add
                                    </button>
                                </div>

                                {(project.milestones || []).length === 0 ? (
                                    <div className="empty-tab-text">
                                        <Calendar size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No milestones yet</p>
                                    </div>
                                ) : (
                                    (project.milestones || []).map((m, i) => (
                                        <div key={i} className="detail-item-row">
                                            <input
                                                type="checkbox"
                                                checked={m.completed}
                                                onChange={() => toggleMilestone(i)}
                                            />
                                            <div className="milestone-text-block">
                                                <div className={`detail-item-text${m.completed ? " completed" : ""}`}>
                                                    {m.title}
                                                </div>
                                                {m.dueDate && (
                                                    <div className="milestone-date">
                                                        <Calendar size={12} /> {m.dueDate}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`details-badge ${m.completed ? "status-complete" : "status-onhold"}`}>
                                                {m.completed ? 'Done' : 'Pending'}
                                            </span>
                                            <button onClick={() => deleteMilestone(i)} className="detail-action-btn"><X size={14} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── ATTACHMENTS TAB ── */}
                        {activeTab === "attachments" && (
                            <div className="tab-pane pane-attachments">
                                <div className="attachment-dropzone">
                                    <div className="dropzone-icon"><Paperclip size={32} /></div>
                                    <p>Upload files for this project</p>
                                    <label className="btn-upload">
                                        {uploading ? 'Uploading...' : 'CHOOSE FILE'}
                                        <input
                                            type="file"
                                            onChange={uploadFile}
                                            disabled={uploading}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {uploadError && <div className="upload-error"><AlertCircle size={14} /> {uploadError}</div>}
                                </div>

                                <div className="attachment-list">
                                    {(project.attachments || []).map((att, i) => (
                                        <div key={i} className="attachment-item">
                                            <span className="file-icon"><FileText size={20} /></span>
                                            <div className="file-info">
                                                <div className="file-name">{att.filename}</div>
                                                <div className="file-date">{new Date(att.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                            <a href={`${BASE_URL}/api/attachments/${att.path}`} download className="btn-download">Download</a>
                                            <button onClick={() => deleteAttachment(att.path, att.filename)} className="detail-action-btn"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── ACTIVITY TAB ── */}
                        {activeTab === "activity" && (
                            <div className="tab-pane pane-activity">
                                {(!project.activityLog || project.activityLog.length === 0) && (
                                    <div className="empty-tab-text">
                                        <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No activity recorded</p>
                                    </div>
                                )}
                                <ul className="activity-list">
                                    {(project.activityLog || []).map((log, i) => (
                                        <li key={i} className="activity-log-item">
                                            <span className="log-action">{log.action}</span>
                                            <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* ── TIME LOG TAB ── */}
                        {activeTab === "timelog" && (
                            <div className="tab-pane pane-timelog">
                                {timeSessions.length === 0 ? (
                                    <div className="empty-tab-text">
                                        <Ghost size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>No sessions tracked yet. Hit <Play size={12} style={{ verticalAlign: 'middle' }} /> Track above.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="timelog-summary-banner">
                                            <div className="summary-left">
                                                <span className="summary-label">Total Tracked</span>
                                                <span className="summary-value">
                                                    {(() => {
                                                        const total = timeSessions.filter(s => s.status === 'stopped').reduce((a, s) => a + (s.totalSeconds || 0), 0);
                                                        return `${Math.floor(total / 3600)}h ${String(Math.floor((total % 3600) / 60)).padStart(2, '0')}m`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="summary-right">
                                                <span className="summary-count">{timeSessions.length}</span>
                                                <span className="summary-count-label">Sessions</span>
                                            </div>
                                        </div>

                                        <div className="timelog-grid">
                                            {timeSessions.map((sess, i) => (
                                                <div key={i} className="timelog-card" onClick={() => setSelectedSession(sess)}>
                                                    {sess.screenshots && sess.screenshots.length > 0 && (
                                                        <div className="timelog-card-preview" style={{ backgroundImage: `url(${BASE_URL}/api/screenshots/${sess.screenshots[sess.screenshots.length - 1].gridfsId})` }} />
                                                    )}
                                                    <div className="timelog-card-body">
                                                        <div className="timelog-card-meta">
                                                            <span>{new Date(sess.startedAt).toLocaleDateString()}</span>
                                                            <span className="duration">{Math.floor(sess.totalSeconds / 3600)}h {Math.floor((sess.totalSeconds % 3600) / 60)}m</span>
                                                        </div>
                                                        <div className="timelog-card-title">{sess.subtaskTitle}</div>
                                                        <div className="timelog-card-footer">
                                                            <Image size={14} /> {sess.screenshots?.length || 0} Captures
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Session Detail Overlay */}
            {selectedSession && (
                <div className="session-overlay" onClick={() => setSelectedSession(null)}>
                    <div className="session-overlay-content" onClick={e => e.stopPropagation()}>
                        <div className="session-overlay-header">
                            <div className="header-info">
                                <span className="session-type-label">Session Details</span>
                                <h2>{selectedSession.subtaskTitle}</h2>
                                <span className="session-time-meta">
                                    {new Date(selectedSession.startedAt).toLocaleString()} • {Math.floor(selectedSession.totalSeconds / 3600)}h {Math.floor((selectedSession.totalSeconds % 3600) / 60)}m
                                </span>
                            </div>
                            <button className="btn-close-overlay" onClick={() => setSelectedSession(null)}><X size={20} /></button>
                        </div>
                        <div className="session-overlay-body">
                            <div className="session-comment-section">
                                <span className="section-label">User Comment</span>
                                <p className={selectedSession.comment ? "" : "no-comment"}>
                                    {selectedSession.comment || "No comment provided."}
                                </p>
                            </div>

                            <div className="session-timeline-section">
                                <span className="section-label">Activity Timeline ({selectedSession.screenshots?.length || 0} Captures)</span>
                                <div className="session-gallery">
                                    {selectedSession.screenshots?.map((shot, idx) => (
                                        <div key={idx} className="gallery-item" onClick={() => window.open(`${BASE_URL}/api/screenshots/${shot.gridfsId}`)}>
                                            <img src={`${BASE_URL}/api/screenshots/${shot.gridfsId}`} alt="Capture" />
                                            <div className="gallery-item-time">
                                                {new Date(shot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Details;
