
import React from 'react';
import {
  X, ChevronRight, Circle, CircleDashed, CheckCircle2,
  ArrowUp, ArrowRight, ArrowDown, Zap, Tag, Users,
  Link2, Paperclip, MessageSquare, Plus, MoreHorizontal,
  Clock, Calendar, User, Layout
} from 'lucide-react';
import './IssueDetailView.css';

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

const IssueDetailView = ({ task, team, project, user, onClose, onUpdate }) => {
  if (!task) return null;

  const getTaskId = () => {
    if (!task?._id) return 'TASK-000';
    const key = team?.key || 'TASK';
    const num = task._id.substring(task._id.length - 3);
    return `${key}-${parseInt(num, 16) % 1000}`;
  };

  return (
    <div className="issue-detail-overlay">
      {/* Top Navbar */}
      <div className="detail-navbar">
        <div className="navbar-left">
          <div className="breadcrumb">
            <Layout size={14} color="#8C8C8C" />
            <span className="breadcrumb-text">{team?.name}</span>
            <ChevronRight size={12} color="#4A4A4A" />
            <span className="breadcrumb-text active">{getTaskId()}</span>
          </div>
        </div>
        <div className="navbar-right">
          <button className="icon-btn-nav"><Link2 size={16} /></button>{/*This button is not working*/}
          <button className="icon-btn-nav"><Paperclip size={16} /></button>{/*This button is not working*/}
          <button className="icon-btn-nav"><MoreHorizontal size={16} /></button>{/*This button is not working*/}
          <div className="nav-divider"></div>
          <button className="icon-btn-nav close-btn" onClick={onClose}><X size={20} /></button>
        </div>
      </div>

      <div className="detail-container">
        {/* Main Content Area (Left) */}
        <div className="detail-main">
          <div className="issue-header-section">
            <h1 className="issue-title-large">
              <input
                type="text"
                value={task.title}
                onChange={(e) => onUpdate({ ...task, title: e.target.value })}
                className="title-naked-input"
              />
            </h1>
            <div className="issue-subtitle">
              <span className="subtitle-text">Opened by {user?.email || 'User'}</span>
            </div>
          </div>

          <div className="quick-properties-bar">
            <div className="q-prop">
              {STATUS_OPTIONS.find(s => s.id === task.status)?.icon}
              <span>{STATUS_OPTIONS.find(s => s.id === task.status)?.label}</span> {/*This button is not working*/}
            </div>
            <div className="q-prop">
              {PRIORITY_OPTIONS.find(p => p.id === task.priority)?.icon}
              <span>{PRIORITY_OPTIONS.find(p => p.id === task.priority)?.label}</span> {/*This button is not working*/}
            </div>
            <div className="q-prop">
              <User size={14} />
              <span>{user?.email?.split('@')[0] || 'Assignee'}</span> {/*This button is not working*/}
            </div>
            <div className="q-prop">
              <Calendar size={14} />
              <span>Target date</span>{/*This button is not working*/}
            </div>
            <div className="q-prop">
              <Tag size={14} />
              <span>Add label</span>{/*This button is not working*/}
            </div>
          </div>

          <div className="detail-section">
            <div className="section-label">Description</div>
            <textarea
              className="desc-naked-textarea"
              placeholder="Add a description..."
              value={task.description || ''}
              onChange={(e) => onUpdate({ ...task, description: e.target.value })}
            />
          </div>

          <div className="detail-section">
            <div className="section-header">
              <span className="section-label">Subtasks</span>
              <button className="add-sub-btn"><Plus size={12} /> Add subtask</button>{/*This button is not working*/}
            </div>
            <div className="empty-section-placeholder">
              No subtasks yet
            </div>
          </div>

          <div className="detail-section activity-section">
            <div className="section-label">Activity</div>
            <div className="comment-box">
              <div className="user-avatar-small">{user?.email?.charAt(0).toUpperCase()}</div>
              <input type="text" placeholder="Add a comment..." className="comment-input" />{/*This button is not working*/}
            </div>
          </div>
        </div>

        {/* Properties Sidebar (Right) */}
        <div className="detail-sidebar">
          <div className="sidebar-group">
            <div className="sidebar-group-title">Properties</div>

            <div className="property-row">
              <div className="p-label">Status</div>
              <div className="p-value">
                <div className="p-pill">
                  {STATUS_OPTIONS.find(s => s.id === task.status)?.icon}
                  <span>{STATUS_OPTIONS.find(s => s.id === task.status)?.label}</span>{/*This button is not working*/}
                </div>
              </div>
            </div>

            <div className="property-row">
              <div className="p-label">Priority</div>
              <div className="p-value">
                <div className="p-pill">
                  {PRIORITY_OPTIONS.find(p => p.id === task.priority)?.icon}
                  <span>{PRIORITY_OPTIONS.find(p => p.id === task.priority)?.label}</span>{/*This button is not working*/}
                </div>
              </div>
            </div>

            <div className="property-row">
              <div className="p-label">Assignee</div>
              <div className="p-value">
                <div className="p-pill">
                  <div className="user-avatar-mini">{user?.email?.charAt(0).toUpperCase()}</div>
                  <span>{user?.email || 'No assignee'}</span>{/*This button is not working*/}
                </div>
              </div>
            </div>

            <div className="property-row">
              <div className="p-label">Project</div>
              <div className="p-value">
                <div className="p-pill">
                  <Folder size={12} color="#8C8C8C" />
                  <span>{project?.Title || 'No project'}</span>
                </div>
              </div>
            </div>

            <div className="property-row">
              <div className="p-label">Cycle</div>
              <div className="p-value">
                <span className="p-text-empty">Add to cycle</span>
              </div>
            </div>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-group-title">Dates</div>
            <div className="property-row">
              <div className="p-label">Created</div>
              <div className="p-value p-text">Apr 29, 2024</div>
            </div>
            <div className="property-row">
              <div className="p-label">Updated</div>
              <div className="p-value p-text">Just now</div>
            </div>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-group-title">Participants</div>
            <div className="participants-list">
              <div className="user-avatar-small" title={user?.email}>{user?.email?.charAt(0).toUpperCase()}</div>
              <div className="add-participant-btn"><Plus size={14} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Folder = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);

export default IssueDetailView;
