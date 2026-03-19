import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Details.css";
import { useDispatch, useSelector } from "react-redux";
import { updateProjectDetails } from "./Redux";

const STATUS_COLORS = {
    backlog: 'gray',
    todo: '#4a9eff',
    inprogress: '#f2aa4d',
    inreview: '#a855f7',
    onhold: 'orange',
    done: 'teal',
    complete: 'lime'
};

const PRIORITY_COLORS = {
    low: 'lime',
    medium: '#f2aa4d',
    high: 'red'
};

function Details() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const createdProjects = useSelector((state) => state.registration.createdProjects);
    const assignedProjects = useSelector((state) => state.registration.assignedProjects);
    const allProjects = [...createdProjects, ...assignedProjects];
    const project = allProjects.find((p) => p._id === id);

    const [activeTab, setActiveTab] = useState("subtasks");
    const [newSubtask, setNewSubtask] = useState("");
    const [newCheckItem, setNewCheckItem] = useState("");
    const [newMilestone, setNewMilestone] = useState("");
    const [newMilestoneDate, setNewMilestoneDate] = useState("");

    // Attachments state
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    if (!project) {
        return (
            <div className="details-container">
                <h1>Project Not Found</h1>
                <button onClick={() => navigate("/projects")}>Go Back</button>
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
    const addCheckItem = () => {
        if (!newCheckItem.trim()) return;
        const updated = [...(project.checklist || []), { item: newCheckItem.trim(), done: false }];
        dispatch(updateProjectDetails({ id, field: 'checklist', value: updated }));
        setNewCheckItem("");
    };

    const toggleCheckItem = (index) => {
        const updated = project.checklist.map((c, i) =>
            i === index ? { ...c, done: !c.done } : c
        );
        dispatch(updateProjectDetails({ id, field: 'checklist', value: updated }));
    };

    const deleteCheckItem = (index) => {
        const updated = project.checklist.filter((_, i) => i !== index);
        dispatch(updateProjectDetails({ id, field: 'checklist', value: updated }));
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
            const res = await fetch(`http://localhost:5000/api/projects/${id}/attachments`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Upload failed');
            }
            const updatedProject = await res.json();
            // Sync updated project into Redux
            dispatch(updateProjectDetails({ id, field: 'attachments', value: updatedProject.attachments }));
            // Also sync activityLog
            dispatch(updateProjectDetails({ id, field: 'activityLog', value: updatedProject.activityLog }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
            e.target.value = '';  // reset file input
        }
    };

    const deleteAttachment = async (fileId, filename) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/projects/${id}/attachments/${fileId}`, {
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
            <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'gray', marginBottom: '4px' }}>
                    <span>{done}/{total} completed</span>
                    <span>{pct}%</span>
                </div>
                <div style={{ height: '6px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-amber)', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
            </div>
        );
    };

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
        <div className="details-wrapper">
            <button className="back-link" onClick={() => navigate("/projects")}>
                ← Back to Projects
            </button>

            <div className="details-card">
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
                    <span style={{ background: STATUS_COLORS[project.status] || 'gray', color: 'white', padding: '4px 14px', borderRadius: '12px' }}>
                        {project.status}
                    </span>
                    <span style={{ background: PRIORITY_COLORS[project.priority] || 'gray', color: 'white', padding: '4px 14px', borderRadius: '12px' }}>
                        {project.priority} priority
                    </span>
                    <span style={{ border: '1px solid var(--accent-amber)', padding: '4px 14px', borderRadius: '12px' }}>
                        Sprint {project.sprint}
                    </span>
                </div>

                <h2>{project.Title}</h2>
                <p><strong>Description:</strong> {project.Description}</p>
                <p><strong>Due Date:</strong> {project.date}</p>
                <p><strong>Start Date:</strong> {project.startDate}</p>

                {project.tags && project.tags.length > 0 && (
                    <div style={{ margin: '10px 0' }}>
                        <strong>Tags: </strong>
                        {project.tags.map((tag, i) => (
                            <span key={i} style={{ background: '#4a5568', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginLeft: '4px' }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── TABS ── */}
                <div style={{ borderBottom: '1px solid #333', display: 'flex', gap: '4px', marginTop: '24px' }}>
                    <button style={tabStyle("subtasks")} onClick={() => setActiveTab("subtasks")}>
                        Subtasks ({(project.subtasks || []).length})
                    </button>
                    <button style={tabStyle("checklist")} onClick={() => setActiveTab("checklist")}>
                        Checklist ({(project.checklist || []).length})
                    </button>
                    <button style={tabStyle("milestones")} onClick={() => setActiveTab("milestones")}>
                        Milestones ({(project.milestones || []).length})
                    </button>
                    <button style={tabStyle("attachments")} onClick={() => setActiveTab("attachments")}>
                        📎 Files ({(project.attachments || []).length})
                    </button>
                    <button style={tabStyle("activity")} onClick={() => setActiveTab("activity")}>
                        Activity
                    </button>
                </div>

                <div style={{ marginTop: '20px' }}>

                    {/* ── SUBTASKS TAB ── */}
                    {activeTab === "subtasks" && (
                        <div>
                            <ProgressBar done={subtasksDone} total={(project.subtasks || []).length} />
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Add subtask..."
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                    style={{ flex: 1, padding: '6px 10px' }}
                                />
                                <button onClick={addSubtask} style={{ border: '1px solid var(--accent-amber)', padding: '6px 14px' }}>Add</button>
                            </div>

                            {/* FIX: was missing closing ) on ternary */}
                            {(project.subtasks || []).length === 0 ? (
                                <div style={{ color: 'gray', fontSize: '13px' }}>No subtasks yet</div>
                            ) : (
                                (project.subtasks || []).map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #222' }}>
                                        <input
                                            type="checkbox"
                                            checked={s.completed}
                                            onChange={() => toggleSubtask(i)}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                        <span style={{
                                            flex: 1,
                                            textDecoration: s.completed ? 'line-through' : 'none',
                                            color: s.completed ? 'gray' : 'inherit',
                                            fontSize: '14px'
                                        }}>
                                            {s.title}
                                        </span>
                                        <button onClick={() => deleteSubtask(i)} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── CHECKLIST TAB ── */}
                    {activeTab === "checklist" && (
                        <div>
                            <ProgressBar done={checklistDone} total={(project.checklist || []).length} />
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Add checklist item..."
                                    value={newCheckItem}
                                    onChange={(e) => setNewCheckItem(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                                    style={{ flex: 1, padding: '6px 10px' }}
                                />
                                <button onClick={addCheckItem} style={{ border: '1px solid var(--accent-amber)', padding: '6px 14px' }}>Add</button>
                            </div>

                            {(project.checklist || []).length === 0 ? (
                                <div style={{ color: 'gray', fontSize: '13px' }}>No checklist items yet</div>
                            ) : (
                                (project.checklist || []).map((c, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #222' }}>
                                        <input
                                            type="checkbox"
                                            checked={c.done}
                                            onChange={() => toggleCheckItem(i)}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                        <span style={{
                                            flex: 1,
                                            textDecoration: c.done ? 'line-through' : 'none',
                                            color: c.done ? 'gray' : 'inherit',
                                            fontSize: '14px'
                                        }}>
                                            {c.item}
                                        </span>
                                        <button onClick={() => deleteCheckItem(i)} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── MILESTONES TAB ── */}
                    {activeTab === "milestones" && (
                        <div>
                            <ProgressBar done={milestonesDone} total={(project.milestones || []).length} />
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Milestone title..."
                                    value={newMilestone}
                                    onChange={(e) => setNewMilestone(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
                                    style={{ flex: 1, minWidth: '160px', padding: '6px 10px' }}
                                />
                                <input
                                    type="date"
                                    value={newMilestoneDate}
                                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                                    style={{ padding: '6px 10px' }}
                                />
                                <button onClick={addMilestone} style={{ border: '1px solid var(--accent-amber)', padding: '6px 14px' }}>Add</button>
                            </div>

                            {(project.milestones || []).length === 0 ? (
                                <div style={{ color: 'gray', fontSize: '13px' }}>No milestones yet</div>
                            ) : (
                                (project.milestones || []).map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #222' }}>
                                        <input
                                            type="checkbox"
                                            checked={m.completed}
                                            onChange={() => toggleMilestone(i)}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                textDecoration: m.completed ? 'line-through' : 'none',
                                                color: m.completed ? 'gray' : 'inherit',
                                                fontSize: '14px'
                                            }}>
                                                {m.title}
                                            </div>
                                            {m.dueDate && (
                                                <div style={{ fontSize: '11px', color: 'gray', marginTop: '2px' }}>
                                                    📅 Due: {m.dueDate}
                                                </div>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            background: m.completed ? 'teal' : '#333',
                                            color: 'white'
                                        }}>
                                            {m.completed ? 'Done' : 'Pending'}
                                        </span>
                                        <button onClick={() => deleteMilestone(i)} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── ATTACHMENTS TAB ── */}
                    {activeTab === "attachments" && (
                        <div>
                            {/* Upload area */}
                            <div style={{
                                border: '2px dashed #333',
                                borderRadius: '10px',
                                padding: '24px',
                                textAlign: 'center',
                                marginBottom: '20px',
                                background: '#0d0d1a'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                                <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                                    Upload any file — images, documents, code, etc. (max 20MB)
                                </div>
                                <label style={{
                                    display: 'inline-block',
                                    padding: '8px 20px',
                                    border: '1px solid var(--accent-amber)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--accent-amber)'
                                }}>
                                    {uploading ? 'Uploading...' : 'Choose File'}
                                    <input
                                        type="file"
                                        onChange={uploadFile}
                                        disabled={uploading}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {uploadError && (
                                    <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>
                                        ❌ {uploadError}
                                    </div>
                                )}
                            </div>

                            {/* File list */}
                            {(project.attachments || []).length === 0 ? (
                                <div style={{ color: 'gray', fontSize: '13px' }}>No files attached yet</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(project.attachments || []).map((att, i) => {
                                        const ext = att.filename.split('.').pop().toLowerCase();
                                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
                                        const isPdf = ext === 'pdf';
                                        const isDoc = ['doc', 'docx'].includes(ext);
                                        const isCode = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext);

                                        const icon = isImage ? '🖼️' : isPdf ? '📄' : isDoc ? '📝' : isCode ? '💻' : '📁';

                                        return (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 14px',
                                                background: '#1a1a2e',
                                                border: '1px solid #222240',
                                                borderRadius: '8px'
                                            }}>
                                                <span style={{ fontSize: '20px' }}>{icon}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '14px', color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {att.filename}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                                                        Uploaded {new Date(att.uploadedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {/* Download button */}
                                                <a
                                                    href={`http://localhost:5000/api/attachments/${att.path}`}
                                                    download={att.filename}
                                                    style={{
                                                        padding: '4px 12px',
                                                        border: '1px solid #4a9eff',
                                                        borderRadius: '5px',
                                                        color: '#4a9eff',
                                                        fontSize: '12px',
                                                        textDecoration: 'none',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                    ⬇ Download
                                                </a>
                                                {/* Delete button */}
                                                <button
                                                    onClick={() => deleteAttachment(att.path, att.filename)}
                                                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ACTIVITY TAB ── */}
                    {activeTab === "activity" && (
                        <div>
                            {(!project.activityLog || project.activityLog.length === 0) && (
                                <div style={{ color: 'gray', fontSize: '13px' }}>No activity yet</div>
                            )}
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {(project.activityLog || []).map((log, i) => (
                                    <li key={i} style={{ borderLeft: '3px solid var(--accent-amber)', paddingLeft: '10px', marginBottom: '8px', fontSize: '13px' }}>
                                        {log.action} — <span style={{ color: 'gray' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Details;