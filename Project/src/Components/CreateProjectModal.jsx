import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, ChevronRight, Layout, Circle, CircleDashed, CheckCircle2, 
  ArrowUp, ArrowRight, ArrowDown, Zap, User, Users, Calendar, Tag, Link2, Plus
} from 'lucide-react';
import './CreateProjectModal.css';

const STATUS_OPTIONS = [
  { id: 'backlog', label: 'Backlog', icon: <CircleDashed size={14} /> },
  { id: 'planned', label: 'Planned', icon: <Circle size={14} /> },
  { id: 'inprogress', label: 'In Progress', icon: <Circle size={14} color="#f2aa4d" /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={14} color="teal" /> }
];

const CreateProjectModal = ({ isOpen, onClose, onCreate, team, user }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('backlog');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      Title: title,
      Summary: summary,
      Description: description,
      status: status,
      teamId: team?._id,
      createdBy: user?._id,
      date: new Date().toISOString().substring(0, 10)
    });
    setTitle('');
    setSummary('');
    setDescription('');
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="create-project-card" onClick={e => e.stopPropagation()}>
        <div className="project-modal-header">
          <div className="project-breadcrumb">
            <div className="team-badge-mini">
              <Users size={12} />
              {team?.key || 'TEAM'}
            </div>
            <ChevronRight size={12} />
            <Layout size={12} />
            <span>New project</span>
          </div>
          <button className="cancel-btn" style={{ padding: '4px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="project-modal-body">
          <input
            type="text"
            className="project-title-input"
            placeholder="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <input
            type="text"
            className="project-summary-input"
            placeholder="Add a short summary..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          <div className="project-properties-row">
            <div className="prop-pill">
              {STATUS_OPTIONS.find(s => s.id === status)?.icon}
              <span>{STATUS_OPTIONS.find(s => s.id === status)?.label}</span>
            </div>
            <div className="prop-pill">
              <Zap size={14} color="#8C8C8C" />
              <span>No priority</span>
            </div>
            <div className="prop-pill">
              <User size={14} />
              <span>Lead</span>
            </div>
            <div className="prop-pill">
              <Users size={14} />
              <span>Members</span>
            </div>
            <div className="prop-pill">
              <Calendar size={14} />
              <span>Start</span>
            </div>
            <div className="prop-pill">
              <Calendar size={14} />
              <span>Target</span>
            </div>
            <div className="prop-pill">
              <Tag size={14} />
              <span>Labels</span>
            </div>
          </div>

          <textarea
            className="project-description-area"
            placeholder="Write a description, a project brief, or collect ideas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="milestones-section">
            <div className="milestones-label">Milestones</div>
            <Plus size={14} color="#8C8C8C" style={{ cursor: 'pointer' }} />
          </div>
        </div>

        <div className="project-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="create-project-submit" 
            onClick={handleCreate}
            disabled={!title.trim()}
          >
            Create project
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateProjectModal;
