import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editProjectDb, deleteProjectDb, fetchCreatedProjects, fetchAssignedProjects } from './Redux';
import { X, Edit2, Trash2, Layout, Plus, Filter, ChevronDown, CheckCircle2, Circle, CircleDashed, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import './Project_1.css';

const STATUS_COLUMNS = [
  { id: 'backlog', label: 'Backlog', icon: <CircleDashed size={14} /> },
  { id: 'todo', label: 'To Do', icon: <Circle size={14} /> },
  { id: 'inprogress', label: 'In Progress', icon: <Circle size={14} color="#f2aa4d" /> },
  { id: 'inreview', label: 'In Review', icon: <Circle size={14} color="#a855f7" /> },
  { id: 'done', label: 'Done', icon: <CheckCircle2 size={14} color="teal" /> }
];

const PRIORITY_ICONS = {
  high: <ArrowUp size={12} />,
  medium: <ArrowRight size={12} />,
  low: <ArrowDown size={12} />
};

function Project_1() {
  const dispatch = useDispatch();
  const storedUser = localStorage.getItem("CURRENTUSER");
  const CURRENTUSER = storedUser ? JSON.parse(storedUser)[0] : {};

  const createdProjects = useSelector((state) => state.registration.createdProjects);
  const assignedProjects = useSelector((state) => state.registration.assignedProjects);

  const [activeTab, setActiveTab] = useState("mine"); // 'mine' or 'assigned'
  const projects = activeTab === "mine" ? createdProjects : assignedProjects;

  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [customViews, setCustomViews] = useState([]);

  useEffect(() => {
    if (CURRENTUSER?._id) {
      dispatch(fetchCreatedProjects(CURRENTUSER._id));
      dispatch(fetchAssignedProjects(CURRENTUSER._id));
    }
  }, [dispatch, CURRENTUSER?._id]);

  // --- Drag and Drop Logic ---
  const onDragStart = (e, projectId) => {
    setDraggingId(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(status);
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    if (!draggingId) return;

    const project = projects.find(p => p._id === draggingId);
    if (project && project.status !== status) {
      // In a real app we might immediately optimistically update local state here, 
      // but dispatching to Redux works.
      dispatch(editProjectDb({
        id: draggingId,
        updatedData: { ...project, status: status }
      }));
    }
    setDraggingId(null);
    setOverColumn(null);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  // --- Helpers ---
  const getShortId = (id) => {
    if (!id) return 'PRJ-000';
    return `PRJ-${id.substring(id.length - 4).toUpperCase()}`;
  };

  const saveCurrentView = () => {
    const newView = { id: Date.now(), name: `View ${customViews.length + 1}` };
    setCustomViews([...customViews, newView]);
  };

  return (
    <div className="linear-wrapper">

      {/* LEFT PANEL */}
      <div className="linear-sidebar">
        <div className="linear-sidebar-header">
          <div className="workspace-name">
            <div className="workspace-icon">A</div>
            {CURRENTUSER?.email || 'Alian Workspace'}
            <ChevronDown size={14} color="#8C8C8C" style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <button className="new-issue-btn">
          <Edit2 size={14} /> New Issue
        </button>

        <div className="sidebar-section">
          <div className="section-title">Your Views</div>
          <div className={`sidebar-item ${activeTab === 'mine' ? 'active' : ''}`} onClick={() => setActiveTab('mine')}>
            <Layout size={14} /> My Issues
          </div>
          <div className={`sidebar-item ${activeTab === 'assigned' ? 'active' : ''}`} onClick={() => setActiveTab('assigned')}>
            <Layout size={14} /> Assigned to me
          </div>
          {customViews.map(view => (
            <div key={view.id} className="sidebar-item">
              <Filter size={14} /> {view.name}
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="section-title">Projects</div>
          <div className="sidebar-item">Sprint 1</div>
          <div className="sidebar-item">Sprint 2</div>
        </div>
      </div>

      {/* MAIN BOARD */}
      <div className="linear-main">
        <div className="board-header">
          <div className="board-title">
            <Layout size={18} color="#8C8C8C" />
            {activeTab === 'mine' ? 'My Issues' : 'Assigned to me'}
          </div>
          <div className="board-actions">
            <button className="icon-btn" onClick={saveCurrentView} title="Save current view">
              <Plus size={14} /> Save View
            </button>
            <button className="icon-btn">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="kanban-container">
          {STATUS_COLUMNS.map(col => {
            const columnProjects = projects.filter(p => p.status === col.id);
            const isOver = overColumn === col.id;

            return (
              <div
                key={col.id}
                className="linear-column"
                onDragOver={(e) => onDragOver(e, col.id)}
                onDrop={(e) => onDrop(e, col.id)}
                onDragLeave={() => setOverColumn(null)}
                style={{
                  background: isOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderRadius: '8px'
                }}
              >
                <div className="column-header">
                  {col.icon}
                  <span>{col.label}</span>
                  <span className="col-count">{columnProjects.length}</span>
                </div>

                <div className="column-body">
                  {columnProjects.map(p => (
                    <div
                      key={p._id}
                      className="linear-card"
                      draggable
                      onDragStart={(e) => onDragStart(e, p._id)}
                      onDragEnd={onDragEnd}
                      onClick={() => setSelectedProject(p)}
                      style={{ opacity: draggingId === p._id ? 0.4 : 1 }}
                    >
                      <div className="card-top">
                        <span className="issue-id">{getShortId(p._id)}</span>
                      </div>
                      <div className="card-title">{p.Title}</div>

                      <div className="card-meta">
                        <span className={`badge priority-${p.priority}`}>
                          {PRIORITY_ICONS[p.priority]} {p.priority}
                        </span>
                        {p.sprint && <span className="badge">S{p.sprint}</span>}
                      </div>

                      {activeTab === 'mine' && (
                        <div className="card-actions" onClick={e => e.stopPropagation()}>
                          <div className="action-icon" onClick={() => setSelectedProject(p)}><Edit2 size={12} /></div>
                          <div className="action-icon" onClick={() => dispatch(deleteProjectDb(p._id))}><Trash2 size={12} /></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT PANEL (DETAILS) */}
        <div className={`right-panel ${selectedProject ? 'open' : ''}`}>
          {selectedProject && (
            <>
              <div className="panel-header">
                <span className="issue-id" style={{ color: '#8C8C8C', fontSize: '13px' }}>
                  {getShortId(selectedProject._id)}
                </span>
                <button className="panel-close" onClick={() => setSelectedProject(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="panel-content">
                <textarea
                  className="panel-title-input"
                  value={selectedProject.Title}
                  onChange={(e) => setSelectedProject({ ...selectedProject, Title: e.target.value })}
                  onBlur={() => dispatch(editProjectDb({ id: selectedProject._id, updatedData: { ...selectedProject } }))}
                />

                <div className="panel-meta-grid">
                  <div className="meta-label">Status</div>
                  <div className="meta-value">
                    <select
                      className="meta-select"
                      value={selectedProject.status}
                      onChange={(e) => {
                        const updated = { ...selectedProject, status: e.target.value };
                        setSelectedProject(updated);
                        dispatch(editProjectDb({ id: selectedProject._id, updatedData: updated }));
                      }}
                    >
                      {STATUS_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  <div className="meta-label">Priority</div>
                  <div className="meta-value">
                    <select
                      className="meta-select"
                      value={selectedProject.priority}
                      onChange={(e) => {
                        const updated = { ...selectedProject, priority: e.target.value };
                        setSelectedProject(updated);
                        dispatch(editProjectDb({ id: selectedProject._id, updatedData: updated }));
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="meta-label">Sprint</div>
                  <div className="meta-value">
                    <input
                      type="number"
                      className="meta-select"
                      value={selectedProject.sprint || 1}
                      onChange={(e) => {
                        const updated = { ...selectedProject, sprint: Number(e.target.value) };
                        setSelectedProject(updated);
                        dispatch(editProjectDb({ id: selectedProject._id, updatedData: updated }));
                      }}
                    />
                  </div>
                </div>

                <div className="meta-label" style={{ marginBottom: '8px' }}>Description</div>
                <textarea
                  className="panel-desc-input"
                  placeholder="Add a description..."
                  value={selectedProject.Description || ''}
                  onChange={(e) => setSelectedProject({ ...selectedProject, Description: e.target.value })}
                  onBlur={() => dispatch(editProjectDb({ id: selectedProject._id, updatedData: { ...selectedProject } }))}
                />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default Project_1;
