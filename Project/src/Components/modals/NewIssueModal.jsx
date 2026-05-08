import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  X, Maximize2, Paperclip, ChevronRight, Circle, CircleDashed, CheckCircle2, ArrowUp, ArrowRight, ArrowDown, Zap, Tag, UserPlus, Folder
} from 'lucide-react';
import './NewIssueModal.css';

const STATUS_OPTIONS = [
  { id: 'backlog', label: 'Backlog', icon: <CircleDashed size={14} /> },
  { id: 'todo', label: 'To Do', icon: <Circle size={14} /> },
  { id: 'inprogress', label: 'In Progress', icon: <Circle size={14} color="#f2aa4d" /> },
  { id: 'inreview', label: 'In Review', icon: <Circle size={14} color="#a855f7" /> },
  { id: 'done', label: 'Done', icon: <CheckCircle2 size={14} color="teal" /> }
];

const PRIORITY_OPTIONS = [
  { id: 'urgent', label: 'Urgent', icon: <Zap size={14} color="#ff4d4d" /> },
  { id: 'high', label: 'High', icon: <ArrowUp size={14} /> },
  { id: 'medium', label: 'Medium', icon: <ArrowRight size={14} /> },
  { id: 'low', label: 'Low', icon: <ArrowDown size={14} /> },
  { id: 'none', label: 'No Priority', icon: <Circle size={14} color="#8C8C8C" /> }
];

const NewIssueModal = ({ isOpen, onClose, onCreate, team, project, workspaceId, user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [createMore, setCreateMore] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'status', 'priority'

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      title,
      description,
      status,
      priority,
      teamId: team?._id,
      workspaceId: workspaceId,
      projectId: project?._id,
      createdBy: user?._id
    });
    
    setTitle('');
    setDescription('');
    if (!createMore) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className={`new-issue-card ${isMaximized ? 'maximized' : ''}`}>
        {/* Header */}
        <div className="modal-header">
          <div className="breadcrumb">
            <div className="team-icon">
              {team?.key?.charAt(0) || 'T'}
            </div>
            <span className="team-key">{team?.key || 'TEAM'}</span>
            <ChevronRight size={14} color="#8C8C8C" />
            <span className="current-action">New issue</span>
          </div>
          <div className="header-actions">
            <button className="icon-btn-small" onClick={() => setIsMaximized(!isMaximized)}>
              <Maximize2 size={14} />
            </button>
            <button className="icon-btn-small" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          <input
            type="text"
            className="issue-title-input"
            placeholder="Issue title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="issue-desc-textarea"
            placeholder="Add description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Quick Suggestions (Simulated for high-end look) */}
        <div className="quick-suggestions">
          <Zap size={14} color="#8C8C8C" />
          <span className="suggestion-label">Quick suggestions</span>
          <div className="suggestion-pill">
            <div className="user-avatar-mini">{user?.email?.charAt(0).toUpperCase()}</div>
            <span>{user?.email?.split('@')[0]}</span>
          </div>
          {project && (
            <div className="suggestion-pill">
              <Folder size={12} />
              <span>{project.Title}</span>
            </div>
          )}
        </div>

        {/* Property Pills */}
        <div className="modal-properties">
          <div className="property-wrapper">
            <div className="property-pill" onClick={() => setActiveMenu(activeMenu === 'status' ? null : 'status')}>
              {STATUS_OPTIONS.find(s => s.id === status)?.icon}
              <span>{STATUS_OPTIONS.find(s => s.id === status)?.label}</span>
            </div>
            {activeMenu === 'status' && (
              <div className="property-dropdown">
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt.id} className="dropdown-item" onClick={() => { setStatus(opt.id); setActiveMenu(null); }}>
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="property-wrapper">
            <div className="property-pill" onClick={() => setActiveMenu(activeMenu === 'priority' ? null : 'priority')}>
              {PRIORITY_OPTIONS.find(p => p.id === priority)?.icon}
              <span>{PRIORITY_OPTIONS.find(p => p.id === priority)?.label}</span>
            </div>
            {activeMenu === 'priority' && (
              <div className="property-dropdown">
                {PRIORITY_OPTIONS.map(opt => (
                  <div key={opt.id} className="dropdown-item" onClick={() => { setPriority(opt.id); setActiveMenu(null); }}>
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="property-pill static">
            <UserPlus size={14} />
            <span>Assignee</span>
          </div>
          <div className="property-pill static">
            <Folder size={14} />
            <span>Project</span>
          </div>
          <div className="property-pill static">
            <Tag size={14} />
            <span>Labels</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-left">
            <button className="icon-btn-circle"><Paperclip size={14} /></button>
          </div>
          <div className="footer-right">
            <div className="create-more">
              <label className="switch">
                <input type="checkbox" checked={createMore} onChange={(e) => setCreateMore(e.target.checked)} />
                <span className="slider round"></span>
              </label>
              <span>Create more</span>
            </div>
            <button className="create-issue-submit" onClick={handleCreate}>
              Create issue
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewIssueModal;
