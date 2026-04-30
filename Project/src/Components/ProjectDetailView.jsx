import React, { useState } from 'react';
import { 
  X, ChevronRight, Layout, Circle, CircleDashed, CheckCircle2, 
  ArrowUp, ArrowRight, ArrowDown, Zap, User, Users, Calendar, Tag, Link2, Plus,
  MessageSquare, History, Settings, MoreHorizontal, Share2, Star
} from 'lucide-react';
import './ProjectDetailView.css';

const ProjectDetailView = ({ project, team, user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!project) return null;

  return (
    <div className="project-detail-page">
      {/* Top Header */}
      <div className="project-detail-header">
        <div className="header-left-nav">
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <Layout size={16} />
          </button>
          <ChevronRight size={14} />
          <div className="team-badge-mini">
            {team?.name || 'Team'}
          </div>
          <ChevronRight size={14} />
          <span style={{ color: '#ECECEC', fontWeight: 500 }}>{project.Title}</span>
        </div>
        <div className="header-right-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn"><Share2 size={16} /></button>
          <button className="icon-btn"><Star size={16} /></button>
          <button className="icon-btn"><MoreHorizontal size={16} /></button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.05)', margin: '0 8px' }}></div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tab-nav">
        <div className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
        <div className={`tab-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</div>
        <div className={`tab-item ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>Issues</div>
        <div className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
      </div>

      {/* Content Area */}
      <div className="project-detail-content">
        <div className="main-scroll-area">
          <div className="project-hero">
            <h1 className="project-hero-title">{project.Title}</h1>
            <p className="project-hero-summary">{project.Summary || 'Add a short summary...'}</p>
          </div>

          <div className="properties-bar">
            <div className="prop-chip">
              <CircleDashed size={14} />
              <span>{project.status || 'Backlog'}</span>
            </div>
            <div className="prop-chip">
              <Zap size={14} color="#8C8C8C" />
              <span>High</span>
            </div>
            <div className="prop-chip">
              <User size={14} />
              <span>ALLIAN SOFTWARE</span>
            </div>
            <div className="prop-chip">
              <Calendar size={14} />
              <span>Apr 1st → May 1st</span>
            </div>
            <div className="prop-chip">
              <Plus size={14} color="#8C8C8C" />
              <span>Resources</span>
            </div>
          </div>

          <div className="latest-update-card">
            <div className="update-header">
              <div className="update-meta">
                <span className="update-status-pill">
                  <div className="status-dot status-on-track"></div>
                  On track
                </span>
                <span style={{ color: '#8C8C8C' }}>•</span>
                <div className="user-avatar-mini" style={{ width: '18px', height: '18px', fontSize: '10px' }}>A</div>
                <span style={{ color: '#ECECEC', fontWeight: 500 }}>ALLIAN SOFTWARE</span>
                <span style={{ color: '#8C8C8C' }}>1h ago</span>
              </div>
              <button className="icon-btn" style={{ fontSize: '12px' }}>Update</button>
            </div>
            <div style={{ color: '#B4B4B4', fontSize: '14px' }}>
              Project is proceeding according to plan. Milestone 1 is 90% complete.
            </div>
            <div className="update-footer" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <div className="footer-item"><MessageSquare size={14} /> 4 comments</div>
            </div>
          </div>

          <div className="description-section">
            <div className="sidebar-group-label" style={{ marginBottom: '16px' }}>Description</div>
            <div className="project-description-text">
              {project.Description || 'No description provided.'}
            </div>
          </div>

          <div className="milestones-list-section">
             <div className="sidebar-group-label" style={{ marginBottom: '16px' }}>Milestones</div>
             <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#8C8C8C', fontSize: '13px' }}>
               No milestones defined yet.
             </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="project-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-group-label">Properties</div>
            <div className="property-list-item">
              <span className="p-label">Status</span>
              <span className="p-value"><CircleDashed size={14} /> Backlog</span>
            </div>
            <div className="property-list-item">
              <span className="p-label">Priority</span>
              <span className="p-value"><ArrowUp size={14} /> High</span>
            </div>
            <div className="property-list-item">
              <span className="p-label">Lead</span>
              <span className="p-value">
                <div className="user-avatar-mini" style={{ width: '16px', height: '16px', fontSize: '9px' }}>A</div>
                ALLIAN SOFTWARE
              </span>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-group-label">Dates</div>
            <div className="property-list-item">
              <span className="p-label">Start date</span>
              <span className="p-value">Apr 1st</span>
            </div>
            <div className="property-list-item">
              <span className="p-label">Target date</span>
              <span className="p-value">May 1st</span>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-group-label">Teams</div>
            <div className="property-list-item">
              <span className="p-label">Teams</span>
              <span className="p-value">
                 <div className="team-key-badge" style={{ padding: '1px 4px' }}>HJH</div>
                 {team?.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;
