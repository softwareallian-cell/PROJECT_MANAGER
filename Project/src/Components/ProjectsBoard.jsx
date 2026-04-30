import React, { useState } from 'react';
import { Layout, Circle, CircleDashed, CheckCircle2, XCircle, Calendar, Hash, Plus, Filter } from 'lucide-react';
import './ProjectsBoard.css';
import './ListView.css';

const PROJECT_COLUMNS = [
  { id: 'backlog', label: 'Backlog', icon: <CircleDashed size={14} /> },
  { id: 'planned', label: 'Planned', icon: <Circle size={14} /> },
  { id: 'inprogress', label: 'In Progress', icon: <Circle size={14} color="#f1c40f" /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={14} color="teal" /> },
  { id: 'canceled', label: 'Canceled', icon: <XCircle size={14} color="#8C8C8C" /> }
];


const ProjectsBoard = ({ projects, onProjectClick }) => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list'
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);

  return (
    <div className="projects-board-container">
      <div className="board-header-row">
        <h2 style={{ fontSize: '14px', fontWeight: 600 }}>All projects</h2>
        <div className="board-actions">
          <button className="icon-btn">
            <Filter size={14} /> Filter
          </button>
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setShowDisplayMenu(!showDisplayMenu)}>
              <Plus size={14} /> Display
            </button>
            {showDisplayMenu && (
              <div className="display-menu" style={{ right: 0, top: '40px' }} onMouseLeave={() => setShowDisplayMenu(false)}>
                <div className="section-title">Layout</div>
                <div 
                  className={`display-option ${viewMode === 'kanban' ? 'active' : ''}`}
                  onClick={() => { setViewMode('kanban'); setShowDisplayMenu(false); }}
                >
                  Board <span>⌘1</span>
                </div>
                <div 
                  className={`display-option ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => { setViewMode('list'); setShowDisplayMenu(false); }}
                >
                  List <span>⌘2</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="board-columns-wrapper">
        {PROJECT_COLUMNS.map(col => {
          const colProjects = projects.filter(p => (p.status || 'backlog') === col.id);

          return (
            <div key={col.id} className="project-column">
              <div className="column-label">
                {col.icon}
                <span>{col.label}</span>
                <span className="column-count">{colProjects.length}</span>
              </div>

              {colProjects.map(proj => (
                <div
                  key={proj._id}
                  className="project-card"
                  onClick={() => onProjectClick(proj)}
                >
                  <div className="card-title-row">
                    <div className="project-icon-box">
                      <Layout size={12} />
                    </div>
                    <div className="project-title-text">{proj.Title}</div>
                  </div>

                  {proj.Summary && (
                    <div className="project-summary-text">{proj.Summary}</div>
                  )}

                  <div className="card-footer-row">
                    <div className="footer-item">
                      <div className="status-dot status-on-track"></div>
                    </div>
                    {proj.date && (
                      <div className="footer-item">
                        <Calendar size={12} />
                        <span>{proj.date}</span>
                      </div>
                    )}
                    <div className="footer-item">
                      <Hash size={12} />
                      <span>{proj.issueCount || 0} issues</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        </div>
      ) : (
        <div className="list-view-container">
          <div className="list-header" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 80px' }}>
            <div></div>
            <div>Name</div>
            <div>Health</div>
            <div>Priority</div>
            <div>Lead</div>
            <div>Target date</div>
            <div>Issues</div>
          </div>
          {projects.map(proj => (
            <div key={proj._id} className="list-row" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 80px' }} onClick={() => onProjectClick(proj)}>
              <div className="list-cell"><input type="checkbox" /></div>
              <div className="list-cell">
                <div className="project-icon-box"><Layout size={12} /></div>
                <span className="issue-title">{proj.Title}</span>
              </div>
              <div className="list-cell">
                <div className="status-dot status-on-track"></div>
                <span style={{ fontSize: '12px' }}>On track</span>
              </div>
              <div className="list-cell"><ArrowUp size={14} color="#8C8C8C" /></div>
              <div className="list-cell">
                <div className="user-avatar-mini" style={{ width: '18px', height: '18px', fontSize: '10px' }}>A</div>
                <span style={{ fontSize: '12px' }}>ALLIAN</span>
              </div>
              <div className="list-cell" style={{ color: '#8C8C8C', fontSize: '12px' }}>May 1st</div>
              <div className="list-cell">
                <Hash size={12} color="#8C8C8C" />
                <span>{proj.issueCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsBoard;
