import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Calendar } from "lucide-react";
import "./KanbanBoard.css";
import { useDispatch } from "react-redux";
import { editProjectDb } from "../redux/slices/projectSlice";

const STATUS_OPTIONS = ['backlog', 'todo', 'inprogress', 'inreview', 'onhold', 'done', 'complete'];

const STATUS_LABELS = {
    backlog: 'Backlog',
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    onhold: 'On Hold',
    done: 'Done',
    complete: 'Complete'
};

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

function KanbanBoard({ projects, activeTab, onEdit, onDelete }) {
    const dispatch = useDispatch();

    const [draggingId, setDraggingId] = useState(null);
    const [overColumn, setOverColumn] = useState(null);

    const onDragStart = (e, projectId) => {
        setDraggingId(projectId);
        e.dataTransfer.effectAllowed = 'move';
        // required for Firefox — without this Firefox cancels the drag
        e.dataTransfer.setData('text/plain', projectId);
    };

    const onDragOver = (e, status) => {
        // e.preventDefault() is REQUIRED — without it onDrop will never fire
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverColumn(status);
    };

    const onDrop = (e, status) => {
        e.preventDefault();
        if (!draggingId) return;

        const project = projects.find(p => p._id === draggingId);
        if (project && project.status !== status) {
            dispatch(editProjectDb({
                id: draggingId,
                updatedData: {
                    Title: project.Title,
                    Description: project.Description,
                    status: status,
                    priority: project.priority,
                    tags: project.tags,
                    sprint: project.sprint,
                    date: project.date,
                }
            }));
        }

        setDraggingId(null);
        setOverColumn(null);
    };

    const onDragEnd = () => {
        // cleanup if dropped outside any column
        setDraggingId(null);
        setOverColumn(null);
    };
    console.log("draggingId", draggingId, "overColumn", overColumn);
    return (
        <div className="kanban-wrapper">
            <div className="kanban-board">
                {STATUS_OPTIONS.map(status => {
                    const cards = projects.filter(p => p.status === status);
                    const isOver = overColumn === status;
                    return (
                        <div key={status} className="kanban-column"
                            onDragOver={(e) => onDragOver(e, status)}
                            onDrop={(e) => onDrop(e, status)}
                            onDragLeave={() => setOverColumn(null)}
                            style={{
                                outline: isOver ? `2px solid ${STATUS_COLORS[status]}` : 'none',
                                background: isOver ? 'rgba(255,255,255,0.03)' : undefined,
                                transition: 'outline 0.15s, background 0.15s'
                            }}>
                            {/* Column Header */}
                            <div className="kanban-col-header">
                                <span className="kanban-dot" style={{
                                    background: STATUS_COLORS[status]
                                }}></span>
                                <span>{STATUS_LABELS[status]}</span>
                                <span className="kanban-count">{cards.length}</span>
                            </div>

                            {/* Column Body */}
                            <div className="kanban-col-body">
                                {cards.length === 0 && (
                                    <div
                                        className="kanban-empty"
                                        style={{
                                            border: isOver
                                                ? `2px dashed ${STATUS_COLORS[status]}`
                                                : '2px dashed transparent',
                                            borderRadius: '6px',
                                            padding: '16px',
                                            transition: 'border 0.15s',
                                            color: isOver ? STATUS_COLORS[status] : undefined
                                        }}
                                    >
                                        {isOver ? 'Drop here' : 'No tasks'}
                                    </div>
                                )}


                                {cards.map(p => (
                                    <div
                                        key={p._id}
                                        className="kanban-card"
                                        draggable
                                        onDragStart={(e) => onDragStart(e, p._id)}
                                        onDragEnd={onDragEnd}
                                        style={{
                                            opacity: draggingId === p._id ? 0.4 : 1,
                                            cursor: 'grab',
                                            userSelect: 'none',
                                            transition: 'opacity 0.15s'
                                        }}
                                    >
                                        {/* Title link */}
                                        <NavLink
                                            to={`/projects/${p._id}`}
                                            className="kanban-card-title"
                                            draggable={false}
                                            title={p.Title}
                                            onClick={(e) => { if (draggingId) e.preventDefault(); }}
                                        >
                                            {p.Title}
                                        </NavLink>

                                        {/* Priority + Sprint badges */}
                                        <div className="kanban-card-badges">
                                            <span style={{
                                                background: PRIORITY_COLORS[p.priority],
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                fontSize: '11px'
                                            }}>
                                                {p.priority}
                                            </span>
                                            <span style={{
                                                border: '1px solid var(--accent-amber)',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                fontSize: '11px'
                                            }}>
                                                S{p.sprint}
                                            </span>
                                        </div>

                                        {/* Tags */}
                                        {p.tags && p.tags.length > 0 && (
                                            <div className="kanban-card-tags">
                                                {p.tags.map((tag, i) => (
                                                    <span key={i} className="kanban-tag">#{tag}</span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Due date */}
                                        <div className="kanban-card-due"><Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {p.date}</div>

                                        {/* Description preview */}
                                        {p.Description && (
                                            <div className="kanban-card-desc">
                                                {p.Description.length > 60
                                                    ? p.Description.substring(0, 60) + '...'
                                                    : p.Description}
                                            </div>
                                        )}

                                        {/* Action buttons — only on "mine" tab */}
                                        {activeTab === "mine" && (
                                            <div className="kanban-card-actions">
                                                <button className="kb-edit-btn" onClick={() => onEdit(p)}>Edit</button>
                                                <button className="kb-del-btn" onClick={() => onDelete(p._id)}>Delete</button>
                                            </div>
                                        )}

                                        {/* Assigned tab info */}
                                        {activeTab === "assigned" && (
                                            <div className="kanban-card-assigned">  Assigned by: {p.createdBy}</div>
                                        )}
                                    </div>
                                ))}

                                {/* Drop hint at bottom when column already has cards */}
                                {isOver && cards.length > 0 && draggingId && (
                                    <div style={{
                                        border: `2px dashed ${STATUS_COLORS[status]}`,
                                        borderRadius: '6px',
                                        height: '44px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: STATUS_COLORS[status],
                                        fontSize: '12px',
                                        opacity: 0.7,
                                        marginTop: '4px'
                                    }}>
                                        Drop here
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default KanbanBoard;