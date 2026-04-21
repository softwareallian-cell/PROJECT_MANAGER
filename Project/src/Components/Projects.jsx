import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import KanbanBoard from "./KanbanBoard";
import { addProjectDb, assignProjectDb, clearUserSearch, deleteProjectDb, editProjectDb, fetchAssignedProjects, fetchCreatedProjects, logoutUser, removeAssigneeDb, searchUsers, toggleTheme } from "./Redux";
import { createPortal } from "react-dom";
import './Projects.css'
import { NavLink, useNavigate } from "react-router-dom";
import { Calendar, Users, X, Check, AlertTriangle, Trash2, Plus, LayoutDashboard, User, LogOut, Sun, Moon, Search, List, KanbanSquare } from "lucide-react";

const STATUS_OPTIONS = ['backlog', 'todo', 'inprogress', 'inreview', 'onhold', 'done', 'complete'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

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

function Projects() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const CURRENT_USER = JSON.parse(localStorage.getItem("CURRENTUSER"));
    const CURRENTUSER_ID = CURRENT_USER[0]._id;
    const themeMode = useSelector((state) => state.registration.mode);
    const isManager = CURRENT_USER[0].role === 'manager';

    const createdProjects = useSelector((state) => state.registration.createdProjects);
    const assignedProjects = useSelector((state) => state.registration.assignedProjects);
    const userSearchResults = useSelector((state) => state.registration.userSearchResults);

    const [activeTab, setActiveTab] = useState("mine");
    const [viewMode, setViewMode] = useState("list");

    const [Title, setTitle] = useState("");
    const [Description, setDesc] = useState("");
    const [Status, setStatus] = useState("backlog");
    const [Priority, setPriority] = useState("medium");
    const [Tags, setTags] = useState("");
    const [Sprint, setSprint] = useState(1);
    const [Due_Date, setDate] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [Search_Status, setSearch_Status] = useState("all");
    const [Search_Priority, setSearch_Priority] = useState("all");

    const activeProjects = activeTab === "mine" ? createdProjects : assignedProjects;

    useEffect(() => {
        dispatch(fetchCreatedProjects(CURRENTUSER_ID));
        dispatch(fetchAssignedProjects(CURRENTUSER_ID));
    }, [dispatch, CURRENTUSER_ID]);

    const Filtered_Projects = activeProjects
        .filter((p) => p.Title.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase().trim()))
        .filter((p) => Search_Status === "all" ? true : p.status === Search_Status)
        .filter((p) => Search_Priority === "all" ? true : p.priority === Search_Priority);

    const add_Project = (e) => {
        e.preventDefault();
        const tagsArray = Tags.split(',').map(t => t.trim()).filter(t => t !== '');
        const data = {
            Title,
            Description,
            status: Status,
            priority: Priority,
            tags: tagsArray,
            sprint: Sprint,
            date: Due_Date,
            createdBy: CURRENTUSER_ID,
            startDate: new Date().toISOString().substring(0, 10)
        };
        dispatch(addProjectDb(data));
        setTitle("");
        setDesc("");
        setTags("");
        setDate("");
    };

    // Edit state
    const [EditId, setEditId] = useState(null);
    const [Title_2, setEditTitle] = useState("");
    const [Description_2, setEditDesc] = useState("");
    const [Status_2, setEditStatus] = useState("");
    const [Priority_2, setEditPriority] = useState("");
    const [Tags_2, setEditTags] = useState("");
    const [Sprint_2, setEditSprint] = useState(1);
    const [Due_Date_2, setEditDate] = useState("");

    const startEditing = (p) => {
        setEditId(p._id);
        setEditTitle(p.Title);
        setEditDesc(p.Description);
        setEditStatus(p.status);
        setEditPriority(p.priority);
        setEditTags(p.tags ? p.tags.join(', ') : '');
        setEditSprint(p.sprint);
        setEditDate(p.date);
    };

    const edit_Project = (e) => {
        e.preventDefault();
        const tagsArray = Tags_2.split(',').map(t => t.trim()).filter(t => t !== '');
        dispatch(editProjectDb({
            id: EditId,
            updatedData: {
                Title: Title_2,
                Description: Description_2,
                status: Status_2,
                priority: Priority_2,
                tags: tagsArray,
                sprint: Sprint_2,
                date: Due_Date_2,
            }
        }));
        setEditId(null);
    };

    const [deleteId, setdeleteId] = useState(null);

    // ASSIGN PANEL STATE
    const [assignPanelProjectId, setAssignPanelProjectId] = useState(null);
    const [assignSearchQ, setAssignSearchQ] = useState("");

    const openAssignPanel = (projectId) => {
        setAssignPanelProjectId(projectId);
        setAssignSearchQ("");
        dispatch(clearUserSearch());
    };

    const closeAssignPanel = () => {
        setAssignPanelProjectId(null);
        setAssignSearchQ("");
        dispatch(clearUserSearch());
    };

    const handleAssignSearch = (e) => {
        const q = e.target.value;
        setAssignSearchQ(q);
        if (q.trim().length >= 1) {
            dispatch(searchUsers(q.trim()));
        } else {
            dispatch(clearUserSearch());
        }
    };

    const handleAssign = (projectId, userId) => {
        dispatch(assignProjectDb({ projectId, assignToUserId: userId }));
    };

    const handleRemoveAssignee = (projectId, userId) => {
        dispatch(removeAssigneeDb({ projectId, userId }));
    };

    const logout = () => {
        dispatch(logoutUser());
        navigate("/login");
    };

    const handleKanbanEdit = (p) => {
        startEditing(p);
        setViewMode("list");
    };

    return (
        <>
            <h1 className="projects-welcome-header">
                WELCOME {CURRENT_USER[0].email}
                <span className="role-badge">{CURRENT_USER[0].role}</span>
            </h1>

            {deleteId && (() => {
                const projectToDelete = createdProjects.find(p => p._id === deleteId);
                return createPortal(
                    <div className="modal-overlay">
                        <div className="modal-form confirm-modal">
                            <div className="confirm-icon">
                                <AlertTriangle size={48} color="var(--danger)" />
                            </div>
                            <h1>Are You Sure?</h1>
                            <p>You want to permanently delete this project? This action cannot be undone.</p>

                            {projectToDelete && (
                                <div className="delete-project-details">
                                    <div >
                                        <span className="value" title={projectToDelete.Title}>{projectToDelete.Title}</span>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="confirm-btn delete" onClick={() => {
                                    dispatch(deleteProjectDb(deleteId));
                                    setdeleteId(null);
                                }}>
                                    <Trash2 size={16} /> Delete Project
                                </button>
                                <button className="confirm-btn cancel" onClick={() => setdeleteId(null)}>
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                    , document.getElementById("modal-root"));
            })()}

            <div className="PROJECTS">
                <div className="projects-sidebar">
                    <div className="sidebar-nav">
                        <button className="nav-btn dashboard-btn" onClick={() => navigate("/dashboard")}>
                            <LayoutDashboard size={14} /> DASHBOARD
                        </button>
                        <button className="nav-btn" onClick={() => navigate("/profile")}>
                            <User size={14} /> EDIT PROFILE
                        </button>
                        <button className="nav-btn theme-toggle" onClick={() => dispatch(toggleTheme())}>
                            {themeMode === "dark" ? <Sun size={14} /> : <Moon size={14} />} {themeMode === "dark" ? "LIGHT MODE" : "DARK MODE"}
                        </button>
                        <button className="nav-btn logout-action" onClick={logout}>
                            <LogOut size={14} /> LOGOUT
                        </button>
                    </div>

                    <div className="sidebar-tabs">
                        <button
                            className={`tab-btn${activeTab === "mine" ? " active" : ""}`}
                            onClick={() => setActiveTab("mine")}>
                            My Projects ({createdProjects.length})
                        </button>

                        <button
                            className={`tab-btn${activeTab === "assigned" ? " active" : ""}`}
                            onClick={() => setActiveTab("assigned")}>
                            Assigned to Me ({assignedProjects.length})
                        </button>
                    </div>

                    {activeTab === "mine" && (
                        <div className="project-form">
                            <h3>CREATE NEW PROJECT</h3>
                            <form onSubmit={add_Project}>
                                <div className="field-group">
                                    <label>Title</label>
                                    <input type="text" value={Title} onChange={(e) => setTitle(e.target.value)} required />
                                </div>

                                <div className="field-group">
                                    <label>Description</label>
                                    <textarea rows="3" value={Description} onChange={(e) => setDesc(e.target.value)}></textarea>
                                </div>

                                <div className="form-row">
                                    <div className="field-group">
                                        <label>Status</label>
                                        <select onChange={(e) => setStatus(e.target.value)} value={Status}>
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field-group">
                                        <label>Priority</label>
                                        <select onChange={(e) => setPriority(e.target.value)} value={Priority}>
                                            {PRIORITY_OPTIONS.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label>Tags (comma separated)</label>
                                    <input type="text" value={Tags} placeholder="e.g. design, frontend" onChange={(e) => setTags(e.target.value)} />
                                </div>

                                <div className="form-row">
                                    <div className="field-group sprint-field">
                                        <label>Sprint</label>
                                        <input type="number" min="1"  value={Sprint} onChange={(e) => setSprint(Number(e.target.value))} />
                                    </div>
                                    <div className="field-group">
                                        <label>Due Date</label>
                                        <input type="date" value={Due_Date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                </div>

                                <button type="submit" className="submit-btn">CREATE PROJECT</button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="projects-main-content">
                    <div className="Search-Bar">
                        <div className="view-toggle">
                            <button
                                className={`view-btn${viewMode === "list" ? " active" : ""}`}
                                onClick={() => setViewMode("list")}>
                                <List size={14} /> List View
                            </button>
                            <button
                                className={`view-btn${viewMode === "kanban" ? " active" : ""}`}
                                onClick={() => setViewMode("kanban")}>
                                <KanbanSquare size={14} /> Kanban
                            </button>
                        </div>
                        <div className="search-inputs">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={14} />
                                <input
                                    className="search-field"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select className="filter-select" onChange={(e) => setSearch_Status(e.target.value)} value={Search_Status}>
                                <option value="all">All Statuses</option>
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <select className="filter-select" onChange={(e) => setSearch_Priority(e.target.value)} value={Search_Priority}>
                                <option value="all">All Priorities</option>
                                {PRIORITY_OPTIONS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {viewMode === "kanban" ? (
                        <KanbanBoard
                            projects={Filtered_Projects}
                            activeTab={activeTab}
                            onEdit={handleKanbanEdit}
                            onDelete={(id) => setdeleteId(id)}
                        />
                    ) : (
                        <div className="user-projects">
                            {Filtered_Projects.length === 0 ? (
                                <div className="empty-projects-state">
                                    <p>No projects found matching your criteria.</p>
                                </div>
                            ) : (
                                <ol className="project-list">
                                    {Filtered_Projects.map((p) =>
                                        EditId !== p._id ? (
                                            <li key={p._id} className="project-list-card">
                                                <div className="card-content-side">
                                                    <div className="card-title-row">
                                                        <NavLink to={`/projects/${p._id}`} className="project-link" title={p.Title}>
                                                            {p.Title}
                                                        </NavLink>
                                                    </div>
                                                    <div className="project-meta-row">
                                                        <span className="project-date">
                                                            <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                                            Due: {p.date}
                                                        </span>
                                                        <div className="inline-tags" title={p.tags ? p.tags.map(t => `#${t}`).join(', ') : ''}>
                                                            {p.tags && p.tags.map((tag, ti) => (
                                                                <span key={ti} className="kanban-tag small">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="project-card-description" title={p.Description}>
                                                            {p.Description || "No description provided."}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="card-meta-side">
                                                    <div className="card-badges">
                                                        <span className={`details-badge ${STATUS_CLASSES[p.status] || 'status-backlog'}`}>
                                                            {p.status}
                                                        </span>
                                                        <span className={`details-badge ${PRIORITY_CLASSES[p.priority] || 'priority-medium'}`}>
                                                            {p.priority}
                                                        </span>
                                                        <span className="details-badge sprint">
                                                            Sprint {p.sprint}
                                                        </span>
                                                    </div>

                                                    <div className="card-actions">
                                                        {activeTab === "mine" ? (
                                                            <>
                                                                <button className="action-btn edit" onClick={() => startEditing(p)}>Edit</button>
                                                                <button className="action-btn delete" onClick={() => setdeleteId(p._id)}>Delete</button>
                                                                {isManager && (
                                                                    <button
                                                                        onClick={() => assignPanelProjectId === p._id ? closeAssignPanel() : openAssignPanel(p._id)}
                                                                        className="action-btn assign">
                                                                        <Users size={14} /> Assign
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="assigned-info">
                                                                Assigned by: {p.createdBy}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* ASSIGN PANEL stays inside LI, usually below or absolute */}
                                                {assignPanelProjectId === p._id && (
                                                    <div className="assign-panel">
                                                        <div className="panel-header">
                                                            <strong>Assign Members</strong>
                                                            <button onClick={closeAssignPanel} className="close-panel"><X size={16} /></button>
                                                        </div>
                                                        {p.assignedTo && p.assignedTo.length > 0 && (
                                                            <div className="current-assignees">
                                                                <span className="label">Currently assigned:</span>
                                                                <div className="assignee-tags">
                                                                    {p.assignedTo.map((uid) => (
                                                                        <span key={uid} className="assignee-tag">
                                                                            {String(uid).slice(-6)}
                                                                            <button onClick={() => handleRemoveAssignee(p._id, uid)}><X size={12} /></button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="text"
                                                            placeholder="Search member..."
                                                            value={assignSearchQ}
                                                            onChange={handleAssignSearch}
                                                            className="assign-search"
                                                        />
                                                        {userSearchResults.length > 0 && (
                                                            <div className="search-results">
                                                                {userSearchResults
                                                                    .filter(u => u._id !== CURRENTUSER_ID)
                                                                    .map(u => {
                                                                        const alreadyAssigned = p.assignedTo?.some(uid => String(uid) === String(u._id));
                                                                        return (
                                                                            <div key={u._id} className="result-item">
                                                                                <div className="user-info">
                                                                                    <div className="email">{u.email}</div>
                                                                                    <div className={`role ${u.role}`}>{u.role}</div>
                                                                                </div>
                                                                                {alreadyAssigned ? (
                                                                                    <span className="assigned-check"><Check size={16} /></span>
                                                                                ) : (
                                                                                    <button onClick={() => handleAssign(p._id, u._id)} className="assign-add-btn">Add</button>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ) : (
                                            <li key={p._id} className="project-edit-card">
                                                <h3>EDIT PROJECT</h3>
                                                <form onSubmit={edit_Project}>
                                                    <div className="field-group">
                                                        <label>Title</label>
                                                        <input type="text" value={Title_2} onChange={(e) => setEditTitle(e.target.value)} required />
                                                    </div>

                                                    <div className="field-group">
                                                        <label>Description</label>
                                                        <textarea value={Description_2} rows="2" onChange={(e) => setEditDesc(e.target.value)}></textarea>
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="field-group">
                                                            <label>Status</label>
                                                            <select value={Status_2} onChange={(e) => setEditStatus(e.target.value)}>
                                                                {STATUS_OPTIONS.map(s => (
                                                                    <option key={s} value={s}>{s}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="field-group">
                                                            <label>Priority</label>
                                                            <select value={Priority_2} onChange={(e) => setEditPriority(e.target.value)}>
                                                                {PRIORITY_OPTIONS.map(pr => (
                                                                    <option key={pr} value={pr}>{pr}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="form-row">
                                                        <div className="field-group sprint-field">
                                                            <label>Sprint</label>
                                                            <input type="number" min="1" value={Sprint_2} onChange={(e) => setEditSprint(Number(e.target.value))} />
                                                        </div>
                                                        <div className="field-group">
                                                            <label>Due Date</label>
                                                            <input type="date" value={Due_Date_2} onChange={(e) => setEditDate(e.target.value)} required />
                                                        </div>
                                                    </div>

                                                    <div className="edit-actions">
                                                        <button className="save-btn" type="submit">SAVE CHANGES</button>
                                                        <button className="cancel-btn" type="button" onClick={() => setEditId(null)}>CANCEL</button>
                                                    </div>
                                                </form>
                                            </li>
                                        )
                                    )}
                                </ol>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Projects;
