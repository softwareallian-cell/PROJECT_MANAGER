import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import KanbanBoard from "./KanbanBoard";
import { addProjectDb, assignProjectDb, clearUserSearch, deleteProjectDb, editProjectDb, fetchAssignedProjects, fetchCreatedProjects, logoutUser, removeAssigneeDb, searchUsers, toggleTheme } from "./Redux";
import { createPortal } from "react-dom";
import './Projects.css'
import { NavLink, useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ['backlog', 'todo', 'inprogress', 'inreview', 'onhold', 'done', 'complete'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

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


function Projects() {



    const dispatch = useDispatch();
    const navigate = useNavigate();
    const CURRENTUSER_ID = JSON.parse(localStorage.getItem("CURRENTUSER"))[0]._id;
    const CURRENT_USER = JSON.parse(localStorage.getItem("CURRENTUSER"));
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
    const [Tags, setTags] = useState("");         // comma separated input
    const [Sprint, setSprint] = useState(1);
    const [Due_Date, setDate] = useState("");

    const [Search, setSearch] = useState("");
    const [Search_Status, setSearch_Status] = useState("all");
    const [Search_Priority, setSearch_Priority] = useState("all");

    const activeProjects = activeTab === "mine" ? createdProjects : assignedProjects;

    useEffect(() => {
        dispatch(fetchCreatedProjects(CURRENTUSER_ID));
        dispatch(fetchAssignedProjects(CURRENTUSER_ID));
    }, []);

    const Filtered_Projects = activeProjects
        .filter((p) => p.Title.toLocaleLowerCase().includes(Search.toLocaleLowerCase().trim()))
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

    }

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
    }

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
        console.log("logout 1")
        dispatch(logoutUser());
        navigate("/login");
    }
    const handleKanbanEdit = (p) => {
        startEditing(p);
        setViewMode("list");
    };
    return (
        <> 
         <h1>WELCOME {CURRENT_USER[0].email}
            <span style={{
                fontSize: '14px',
                marginLeft: '10px',
                padding: '3px 10px',
                border: '1px solid var(--accent-amber)',
                borderRadius: '20px'
            }}>
                {CURRENT_USER[0].role}
            </span>
        </h1 >

            {deleteId && createPortal(
                <div className="modal-overlay">
                    <div className="modal-form">
                        <h1> Are You Sure?</h1>
                        <p> You want to Delete This Project?</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: '20px', margin: '10px 0px' }}>
                            <button style={{ background: 'red', color: 'white' }} onClick={() => {
                                dispatch(deleteProjectDb(deleteId));
                                setdeleteId(null);
                            }}>Yes</button>
                            <button onClick={() => setdeleteId(0)} style={{ border: '1px solid var(--accent-amber)' }}> Not Sure </button>
                        </div>
                    </div>
                </div>
                , document.getElementById("modal-root"))
            }

            <div className="PROJECTS">
                <div style={{ display: 'flex ', gap: '20px', maxHeight: '380px' }}>
                    <div className="projects-btns" >
                        <button className="logout-btn" onClick={() => navigate("/dashboard")}>DASHBOARD</button >
                        <button className="logout-btn" onClick={() => navigate("/profile")}>Edit Profile</button>
                        <button className="logout-btn" onClick={logout}>LOGOUT</button>
                        <button className="toggle-btn" onClick={() => dispatch(toggleTheme())} style={{ padding: '10px' }}>{themeMode === "dark" ? "Current: Dark Mode " : "Current:Light Mode"}</button>
                        <button
                            onClick={() => setActiveTab("mine")}
                            style={{
                                border: activeTab === "mine" ? '2px solid var(--accent-amber)' : '1px solid gray',
                                padding: '8px 20px'
                            }}>
                            My Projects ({createdProjects.length})
                        </button>

                        <button
                            onClick={() => setActiveTab("assigned")}
                            style={{
                                border: activeTab === "assigned" ? '2px solid var(--accent-amber)' : '1px solid gray',
                            }}>
                            Assigned to Me({assignedProjects.length})
                        </button>
                    </div>

                    {activeTab === "mine" && (
                        <div className="project-form" >
                            <form onSubmit={add_Project}>
                                <label>Title</label>
                                <input type="text" onChange={(e) => setTitle(e.target.value)} required />

                                <label>Description</label>
                                <textarea onChange={(e) => setDesc(e.target.value)}></textarea>

                                <label>Status</label>
                                <select onChange={(e) => setStatus(e.target.value)} value={Status}>
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>

                                <label>Priority</label>
                                <select onChange={(e) => setPriority(e.target.value)} value={Priority}>
                                    {PRIORITY_OPTIONS.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>

                                <label>Tags (comma separated)</label>
                                <input type="text" placeholder="e.g. design, frontend" onChange={(e) => setTags(e.target.value)} />

                                <label>Sprint</label>
                                <input type="number" min="1" defaultValue={1} onChange={(e) => setSprint(Number(e.target.value))} />

                                <label>Due Date</label>
                                <input type="date" onChange={(e) => setDate(e.target.value)} required />

                                <button type="submit" style={{ border: '1px solid var(--accent-amber)' }}>  ADD+ </button>
                            </form>
                        </div >)}
                </div>


                <div >


                </div>

                {/* 🆕 VIEW MODE TOGGLE */}


                <div style={{ maxWidth: '800px' }}>

                    <div className="Search-Bar">
                        <div style={{ display: 'flex', maxHeight: '38px', gap: '10px' }}>
                            <button
                                onClick={() => setViewMode("list")}
                                style={{
                                    border: viewMode === "list" ? '2px solid var(--accent-amber)' : '1px solid gray',


                                    background: viewMode === "list" ? 'var(--accent-amber)' : 'transparent',
                                    color: viewMode === "list" ? 'black' : 'inherit',

                                    cursor: 'pointer'
                                }}>
                                List
                            </button>
                            <button
                                onClick={() => setViewMode("kanban")}
                                style={{
                                    border: viewMode === "kanban" ? '2px solid var(--accent-amber)' : '1px solid gray',


                                    background: viewMode === "kanban" ? 'var(--accent-amber)' : 'transparent',
                                    color: viewMode === "kanban" ? 'black' : 'inherit',

                                    cursor: 'pointer'
                                }}>
                                Kanban
                            </button>
                        </div>
                        <input
                            style={{ width: '40%' }}
                            placeholder="Search title..."
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select onChange={(e) => setSearch_Status(e.target.value)}>
                            <option value="all">All Statuses</option>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select onChange={(e) => setSearch_Priority(e.target.value)}>
                            <option value="all">All Priorities</option>
                            {PRIORITY_OPTIONS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    {/* 🆕 CONDITIONAL VIEW RENDERING */}
                    {viewMode === "kanban" ? (
                        <KanbanBoard
                            projects={Filtered_Projects}
                            activeTab={activeTab}
                            onEdit={handleKanbanEdit}
                            onDelete={(id) => setdeleteId(id)}
                        />
                    ) : (
                        <div className="user-projects">
                            {Filtered_Projects.length === 0 && <div>No projects found</div>}
                            <ol>
                                {Filtered_Projects.map((p, i) =>
                                    EditId != p._id ? (
                                        <li key={p._id}>
                                            <NavLink to={`/projects/${p._id}`}>
                                                <strong>{p.Title}</strong>
                                                <br />
                                                {p.date}
                                            </NavLink>

                                            {/* Status badge */}
                                            <span style={{
                                                background: STATUS_COLORS[p.status] || 'gray',
                                                color: 'white',
                                                marginLeft: '10px'
                                            }}>
                                                {p.status}
                                            </span>

                                            {/* Priority badge */}
                                            <span style={{
                                                background: PRIORITY_COLORS[p.priority] || 'gray',
                                                color: 'white',
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                marginLeft: '6px'
                                            }}>
                                                {p.priority}
                                            </span>

                                            {/* Sprint badge */}
                                            <span style={{
                                                border: '1px solid var(--accent-amber)',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                marginLeft: '6px'
                                            }}>
                                                Sprint {p.sprint}
                                            </span>

                                            {/* Tags */}
                                            {p.tags && p.tags.map((tag, ti) => (
                                                <span key={ti} style={{
                                                    background: '#4a5568',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    marginLeft: '4px'
                                                }}>
                                                    #{tag}
                                                </span>
                                            ))}


                                            {activeTab === "mine" && (
                                                <div style={{ display: "flex", gap: "10px", marginTop: '6px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                    <button style={{ border: '1px solid var(--accent-amber)' }} onClick={() => startEditing(p)}>Edit</button>
                                                    <button style={{ background: 'red', color: 'white' }} onClick={() => setdeleteId(p._id)}>Delete</button>

                                                    {/* ASSIGN BUTTON — managers only */}
                                                    {isManager && (
                                                        <button
                                                            onClick={() => assignPanelProjectId === p._id ? closeAssignPanel() : openAssignPanel(p._id)}
                                                            style={{
                                                                border: assignPanelProjectId === p._id
                                                                    ? '2px solid var(--accent-amber)'
                                                                    : '1px solid #a855f7',
                                                                color: '#a855f7',
                                                                padding: '2px 10px'
                                                            }}>
                                                            👥 Assign
                                                        </button>
                                                    )}
                                                </div>
                                            )}



                                            {/* Assigned tab shows who assigned it */}
                                            {activeTab === "assigned" && (
                                                <div style={{ fontSize: '12px', color: 'gray', marginTop: '4px' }}>
                                                    Assigned by: {p.createdBy}
                                                </div>
                                            )}

                                            {/* ASSIGN PANEL — inline under the project card */}
                                            {assignPanelProjectId === p._id && (
                                                <div style={{
                                                    marginTop: '10px',
                                                    padding: '12px',
                                                    border: '1px solid #a855f7',
                                                    borderRadius: '8px',
                                                    background: '#0d0d1a',
                                                    maxWidth: '420px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <strong style={{ color: '#a855f7' }}>Assign Members</strong>
                                                        <button
                                                            onClick={closeAssignPanel}
                                                            style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>
                                                            ×
                                                        </button>
                                                    </div>

                                                    {/* Current assignees */}
                                                    {p.assignedTo && p.assignedTo.length > 0 && (
                                                        <div style={{ marginBottom: '10px' }}>
                                                            <div style={{ fontSize: '12px', color: 'gray', marginBottom: '5px' }}>Currently assigned:</div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {p.assignedTo.map((uid) => (
                                                                    <span key={uid} style={{
                                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                                        background: '#1a1a2e',
                                                                        border: '1px solid #333',
                                                                        borderRadius: '12px',
                                                                        padding: '2px 8px',
                                                                        fontSize: '12px'
                                                                    }}>
                                                                        <span style={{ color: '#a855f7' }}>●</span>
                                                                        <span style={{ color: 'gray' }}>{String(uid).slice(-6)}</span>
                                                                        <button
                                                                            onClick={() => handleRemoveAssignee(p._id, uid)}
                                                                            style={{
                                                                                background: 'none', border: 'none',
                                                                                color: 'gray', cursor: 'pointer',
                                                                                fontSize: '14px', lineHeight: 1, padding: 0
                                                                            }}>
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Search input */}
                                                    <input
                                                        type="text"
                                                        placeholder="Search by email..."
                                                        value={assignSearchQ}
                                                        onChange={handleAssignSearch}
                                                        style={{ width: '100%', padding: '6px 10px', boxSizing: 'border-box', marginBottom: '8px' }}
                                                    />

                                                    {/* Search results */}
                                                    {userSearchResults.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {userSearchResults
                                                                .filter(u => u._id !== CURRENTUSER_ID)
                                                                .map(u => {
                                                                    const alreadyAssigned = p.assignedTo?.some(uid => String(uid) === String(u._id));
                                                                    return (
                                                                        <div key={u._id} style={{
                                                                            display: 'flex', justifyContent: 'space-between',
                                                                            alignItems: 'center', padding: '6px 8px',
                                                                            background: '#1a1a2e', borderRadius: '6px',
                                                                            border: '1px solid #333'
                                                                        }}>
                                                                            <div>
                                                                                <span style={{ fontSize: '13px' }}>{u.email}</span>
                                                                                <span style={{
                                                                                    fontSize: '11px', marginLeft: '6px',
                                                                                    color: u.role === 'manager' ? '#f2aa4d' : '#4a9eff'
                                                                                }}>
                                                                                    {u.role}
                                                                                </span>
                                                                            </div>
                                                                            {alreadyAssigned ? (
                                                                                <span style={{ fontSize: '12px', color: 'gray' }}>assigned ✓</span>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleAssign(p._id, u._id)}
                                                                                    style={{
                                                                                        border: '1px solid #a855f7',
                                                                                        color: '#a855f7',
                                                                                        padding: '2px 10px',
                                                                                        fontSize: '12px',
                                                                                        cursor: 'pointer',
                                                                                        background: 'transparent'
                                                                                    }}>
                                                                                    + Assign
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })
                                                            }
                                                        </div>
                                                    )}

                                                    {assignSearchQ.length >= 1 && userSearchResults.length === 0 && (
                                                        <div style={{ fontSize: '13px', color: 'gray' }}>No users found</div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    )
                                        : (<div key={p._id} className="edit-form">
                                            <form>
                                                <label>Title</label>
                                                <input type="text" defaultValue={Title_2} onChange={(e) => setEditTitle(e.target.value)} required />

                                                <label>Description</label>
                                                <textarea defaultValue={p.Description} onChange={(e) => setEditDesc(e.target.value)}></textarea>

                                                <label>Status</label>
                                                <select defaultValue={p.status} onChange={(e) => setEditStatus(e.target.value)}>
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>

                                                <label>Priority</label>
                                                <select defaultValue={p.priority} onChange={(e) => setEditPriority(e.target.value)}>
                                                    {PRIORITY_OPTIONS.map(pr => (
                                                        <option key={pr} value={pr}>{pr}</option>
                                                    ))}
                                                </select>

                                                <label>Tags (comma separated)</label>
                                                <input type="text" defaultValue={p.tags ? p.tags.join(', ') : ''} onChange={(e) => setEditTags(e.target.value)} />

                                                <label>Sprint</label>
                                                <input type="number" min="1" defaultValue={p.sprint} onChange={(e) => setEditSprint(Number(e.target.value))} />

                                                <label>Due Date</label>
                                                <input type="date" defaultValue={p.date} onChange={(e) => setEditDate(e.target.value)} required />

                                                <div style={{ display: "flex", justifyContent: "center", gap: '20px', margin: '10px 0px' }}>
                                                    <button style={{ background: 'lime', color: 'white' }} type="submit" onClick={edit_Project}>SAVE</button>
                                                    <button style={{ border: '1px solid var(--accent-amber)' }} onClick={() => setEditId(null)}>Cancel</button>
                                                </div>
                                            </form>
                                        </div>
                                        )
                                )}
                            </ol>

                        </div>
                    )}
                </div>
            </div >
        </>
    );
}

export default Projects;