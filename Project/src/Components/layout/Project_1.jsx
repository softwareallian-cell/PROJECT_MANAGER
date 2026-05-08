import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspaces, fetchTeams, addTeam, deleteTeamDb, setActiveWorkspace, setActiveTeam } from '../../redux/slices/teamSlice';
import { fetchTasks, fetchProjectsByTeam, addTaskDb, editTaskDb, deleteTaskDb, addProjectByTeam, setActiveProject } from '../../redux/slices/taskSlice';
import {
  X, Edit2, Trash2, Layout, Plus, Filter, ChevronDown, ChevronRight, CheckCircle2, Circle, CircleDashed, ArrowUp, ArrowRight, ArrowDown, Hash, Users, Zap, Inbox, FileText, UserCircle
} from 'lucide-react';
import './Project_1.css';
import NewIssueModal from '../modals/NewIssueModal';
import IssueDetailView from '../views/IssueDetailView';
import CreateTeamModal from '../modals/CreateTeamModal';
import CreateProjectModal from '../modals/CreateProjectModal';
import ProjectsBoard from '../views/ProjectsBoard';
import ProjectDetailView from '../views/ProjectDetailView';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import TeamSettingsModal from '../modals/TeamSettingsModal';
import '../ui/ListView.css';
import MembersView from '../views/MembersView';

const STATUS_COLUMNS = [
  { id: 'backlog', label: 'Backlog', icon: <CircleDashed size={14} /> },
  { id: 'todo', label: 'To Do', icon: <Circle size={14} /> },
  { id: 'inprogress', label: 'In Progress', icon: <Circle size={14} color="#f2aa4d" /> },
  { id: 'inreview', label: 'In Review', icon: <Circle size={14} color="#a855f7" /> },
  { id: 'done', label: 'Done', icon: <CheckCircle2 size={14} color="teal" /> }
];

const PRIORITY_ICONS = {
  urgent: <Zap size={12} color="#ff4d4d" />,
  high: <ArrowUp size={12} />,
  medium: <ArrowRight size={12} />,
  low: <ArrowDown size={12} />,
  none: <Circle size={12} color="#8C8C8C" />
};

function Project_1() {
  const dispatch = useDispatch();
  const storedUser = localStorage.getItem("CURRENTUSER");
  const CURRENTUSER = storedUser ? JSON.parse(storedUser)[0] : {};

  // Linear Architecture State
  const workspaces = useSelector(state => state.teams.workspaces);
  const teams = useSelector(state => state.teams.teams);
  const tasks = useSelector(state => state.tasks.tasks);
  const linearProjects = useSelector(state => state.tasks.linearProjects);

  const activeWorkspaceId = useSelector(state => state.teams.activeWorkspaceId);
  const activeTeamId = useSelector(state => state.teams.activeTeamId);
  const activeProjectId = useSelector(state => state.tasks.activeProjectId);

  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [mainView, setMainView] = useState('issues'); // 'issues', 'projects', 'project-detail', 'all-teams', 'all-members', 'team-members'
  const [viewProject, setViewProject] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list'
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTeamSettingsModalOpen, setIsTeamSettingsModalOpen] = useState(false);
  const [settingsTeam, setSettingsTeam] = useState(null);

  const [expandedSections, setExpandedSections] = useState({ workspace: true, teams: true });
  const [expandedTeamIds, setExpandedTeamIds] = useState([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetType: null, // 'task' or 'project'
    targetId: null
  });

  const handleContextMenu = (e, type, id) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetType: type,
      targetId: id
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTeam = (teamId) => {
    setExpandedTeamIds(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  // Initial data fetch
  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  // Fetch teams when workspace changes
  useEffect(() => {
    if (activeWorkspaceId) {
      dispatch(fetchTeams(activeWorkspaceId));
    }
  }, [dispatch, activeWorkspaceId]);

  // Fetch tasks and projects when team changes
  useEffect(() => {
    if (activeTeamId) {
      dispatch(fetchTasks(activeTeamId));
      dispatch(fetchProjectsByTeam(activeTeamId));
    }
  }, [dispatch, activeTeamId]);

  const activeWorkspace = workspaces.find(w => w._id === activeWorkspaceId);
  const activeTeam = teams.find(t => t._id === activeTeamId);

  // Filter tasks by selected project and search term
  const filteredTasks = tasks.filter(t => {
    const matchesProject = activeProjectId ? t.projectId === activeProjectId : true;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || getTaskId(t).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesSearch;
  });

  // --- Drag and Drop Logic ---
  const onDragStart = (e, taskId) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(status);
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    if (!draggingId) return;
    const task = tasks.find(t => t._id === draggingId);
    if (task && task.status !== status) {
      dispatch(editTaskDb({
        id: draggingId,
        updatedData: { ...task, status: status }
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
  const getTaskId = (task) => {
    const key = activeTeam?.key || 'TASK';
    const num = task._id.substring(task._id.length - 3);
    return `${key}-${parseInt(num, 16) % 1000}`;
  };

  const handleCreateTask = (taskData) => {
    dispatch(addTaskDb(taskData)).then(action => {
      if (action.payload) setSelectedTask(action.payload);
    });
  };
  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  const confirmCreateProject = (projData) => {
    dispatch(addProjectByTeam(projData));
    setIsCreateProjectModalOpen(false);
  };

  const handleCreateTeam = () => {
    setIsCreateTeamModalOpen(true);
  };

  const confirmCreateTeam = (teamData) => {
    if (!activeWorkspaceId) return;
    const newTeam = {
      workspaceId: activeWorkspaceId,
      name: teamData.name,
      key: teamData.key,
      members: [CURRENTUSER._id]
    };
    dispatch(addTeam(newTeam));
    setIsCreateTeamModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    const { targetType, targetId } = contextMenu;
    if (targetType === 'task') {
      dispatch(deleteTaskDb(targetId));
    } else if (targetType === 'project') {
      dispatch(deleteProjectDb(targetId));
    } else if (targetType === 'team') {
      dispatch(deleteTeamDb(targetId));
    }
    setIsDeleteModalOpen(false);
  };

  const getDeleteTargetName = () => {
    const { targetType, targetId } = contextMenu;
    if (targetType === 'task') return tasks.find(t => t._id === targetId)?.title || 'Task';
    if (targetType === 'project') return linearProjects.find(p => p._id === targetId)?.Title || 'Project';
    if (targetType === 'team') return teams.find(t => t._id === targetId)?.name || 'Team';
    return 'item';
  };

  return (
    <div className="linear-wrapper">

      {/* LEFT PANEL */}
      <div className="linear-sidebar">
        <div className="linear-sidebar-header" onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}>
          <div className="workspace-name">
            <div className="workspace-icon">
              {activeWorkspace?.name?.charAt(0)}
            </div>
            {activeWorkspace?.name || 'Select Workspace'}
            <ChevronDown size={14} color="#8C8C8C" style={{ marginLeft: 'auto' }} />
          </div>

          {showWorkspaceMenu && (
            <div className="workspace-dropdown">
              {workspaces.map(w => (
                <div key={w._id} className="dropdown-item" onClick={() => dispatch(setActiveWorkspace(w._id))}>
                  {w.name}
                </div>
              ))}
              <div className="dropdown-divider"></div>
              <div className="dropdown-item secondary"><Plus size={12} /> Create Workspace</div>{/*this button dosnt do shit */}
            </div>
          )}
        </div>

        <button className="new-issue-btn" onClick={() => setIsCreateModalOpen(true)}>
          <Edit2 size={14} /> New Issue
        </button>

        <div className="sidebar-section" style={{ marginTop: '12px' }}>
          <div className="sidebar-item"><Inbox size={14} /> Inbox</div>
          <div className="sidebar-item"><Layout size={14} /> My issues</div>
          <div className="sidebar-item"><FileText size={14} /> Drafts</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => toggleSection('workspace')}>
            <span>Workspace</span>
            {expandedSections.workspace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          {expandedSections.workspace && (
            <div className="sidebar-section-content">
              <div
                className={`sidebar-item nested-sidebar-item ${mainView === 'projects' ? 'active' : ''}`}
                onClick={() => {
                  setMainView('projects');
                  dispatch(setActiveProject(null));
                  dispatch(setActiveTeam(null));
                }}
              >
                <Hash size={14} /> Projects
              </div>
              <div
                className={`sidebar-item nested-sidebar-item ${mainView === 'all-teams' ? 'active' : ''}`}
                onClick={() => {
                  setMainView('all-teams');
                  dispatch(setActiveProject(null));
                  dispatch(setActiveTeam(null));
                }}
              >
                <Users size={14} /> All Teams
              </div>
              <div
                className={`sidebar-item nested-sidebar-item ${mainView === 'all-members' ? 'active' : ''}`}
                onClick={() => {
                  setMainView('all-members');
                  dispatch(setActiveProject(null));
                  dispatch(setActiveTeam(null));
                }}
              >
                <UserCircle size={14} /> All Members
              </div>
              <div className="sidebar-item nested-sidebar-item secondary" onClick={handleCreateProject}>
                <Plus size={14} /> Add Project
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => toggleSection('teams')}>
            <span>Your teams</span>
            {expandedSections.teams ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          {expandedSections.teams && (
            <div className="sidebar-section-content">
              {teams.map(team => {
                const isExpanded = expandedTeamIds.includes(team._id);
                return (
                  <div key={team._id}>
                    <div
                      className={`sidebar-item nested-sidebar-item ${activeTeamId === team._id && !['projects', 'issues', 'team-members'].includes(mainView) ? 'active-team-header' : ''}`}
                      onClick={() => toggleTeam(team._id)}
                      onContextMenu={(e) => handleContextMenu(e, 'team', team._id)}
                    >
                      <div className="team-key-badge">{team.key}</div>
                      {team.name}
                      <div style={{ marginLeft: 'auto' }}>
                        {isExpanded ? <ChevronDown size={14} color="#8C8C8C" /> : <ChevronRight size={14} color="#8C8C8C" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="team-sub-items">
                        <div
                          className={`sidebar-item deep-nested-item ${activeTeamId === team._id && mainView === 'issues' ? 'active' : ''}`}
                          onClick={() => {
                            dispatch(setActiveTeam(team._id));
                            setMainView('issues');
                          }}
                        >
                          <Layout size={14} /> Issues
                        </div>
                        <div
                          className={`sidebar-item deep-nested-item ${activeTeamId === team._id && mainView === 'projects' ? 'active' : ''}`}
                          onClick={() => {
                            dispatch(setActiveTeam(team._id));
                            setMainView('projects');
                          }}
                        >
                          <Hash size={14} /> Projects
                        </div>
                        <div
                          className={`sidebar-item deep-nested-item ${activeTeamId === team._id && mainView === 'team-members' ? 'active' : ''}`}
                          onClick={() => {
                            dispatch(setActiveTeam(team._id));
                            setMainView('team-members');
                          }}
                        >
                          <UserCircle size={14} /> Members
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="sidebar-item nested-sidebar-item secondary" onClick={handleCreateTeam}>
                <Plus size={14} /> Add Team
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN BOARD */}
      <div className="linear-main">
        {mainView === 'issues' ? (
          <>
            <div className="board-header">
              <div className="board-title">
                <Users size={18} color="#8C8C8C" />
                {activeTeam ? `${activeTeam.name} Board` : 'Select a Team'}
              </div>
              <div className="board-actions">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="board-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="icon-btn">
                  <Filter size={14} /> Filter
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="icon-btn" onClick={() => setShowDisplayMenu(!showDisplayMenu)}>
                    <Plus size={14} /> Display
                  </button>
                  {showDisplayMenu && (
                    <div className="display-menu" onMouseLeave={() => setShowDisplayMenu(false)}>
                      <div className="section-title">Layout</div>
                      <div
                        className={`display-option ${viewMode === 'kanban' ? 'active' : ''}`}
                        onClick={() => { setViewMode('kanban'); setShowDisplayMenu(false); }}
                      >
                        Kanban <span>1</span>
                      </div>
                      <div
                        className={`display-option ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => { setViewMode('list'); setShowDisplayMenu(false); }}
                      >
                        List <span>2</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {viewMode === 'kanban' ? (
              <div className="kanban-container">
                {STATUS_COLUMNS.map(col => {
                  const columnTasks = filteredTasks.filter(t => t.status === col.id);
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
                        <span className="col-count">{columnTasks.length}</span>
                      </div>

                      <div className="column-body">
                        {columnTasks.map(t => (
                          <div
                            key={t._id}
                            className="linear-card"
                            draggable
                            onDragStart={(e) => onDragStart(e, t._id)}
                            onDragEnd={onDragEnd}
                            onClick={() => setSelectedTask(t)}
                            onContextMenu={(e) => handleContextMenu(e, 'task', t._id)}
                            style={{ opacity: draggingId === t._id ? 0.4 : 1 }}
                          >
                            <div className="card-top">
                              <span className="issue-id">{getTaskId(t)}</span>
                            </div>
                            <div className="card-title">{t.title}</div>

                            <div className="card-meta">
                              <span className={`badge priority-${t.priority}`}>
                                {PRIORITY_ICONS[t.priority] || PRIORITY_ICONS.none}
                              </span>
                              {t.tags && t.tags.map(tag => (
                                <span key={tag} className="badge tag-badge">#{tag}</span>
                              ))}
                            </div>

                            <div className="card-actions" onClick={e => e.stopPropagation()}>
                              <div className="action-icon" onClick={() => setSelectedTask(t)}><Edit2 size={12} /></div>
                              <div className="action-icon" onClick={() => dispatch(deleteTaskDb(t._id))}><Trash2 size={12} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="list-view-container">
                <div className="list-header">
                  <div></div>
                  <div>Name</div>
                  <div>Status</div>
                  <div>Priority</div>
                  <div>Team</div>
                  <div>Date</div>
                </div>
                {filteredTasks.map(t => (
                  <div 
                    key={t._id} 
                    className="list-row" 
                    onClick={() => setSelectedTask(t)}
                    onContextMenu={(e) => handleContextMenu(e, 'task', t._id)}
                  >
                    <div className="list-cell"><input type="checkbox" /></div>
                    <div className="list-cell">
                      <span className="issue-id">{getTaskId(t)}</span>
                      <span className="issue-title">{t.title}</span>
                    </div>
                    <div className="list-cell">
                      {STATUS_COLUMNS.find(s => s.id === t.status)?.icon}
                      <span>{STATUS_COLUMNS.find(s => s.id === t.status)?.label}</span>
                    </div>
                    <div className="list-cell">
                      <span className={`badge priority-${t.priority}`}>
                        {PRIORITY_ICONS[t.priority] || PRIORITY_ICONS.none}
                        {t.priority}
                      </span>
                    </div>
                    <div className="list-cell">{activeTeam?.key}</div>
                    <div className="list-cell" style={{ color: '#8C8C8C', fontSize: '12px' }}>Apr 29</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : mainView === 'projects' ? (
          <ProjectsBoard
            projects={linearProjects}
            onProjectClick={(proj) => {
              setViewProject(proj);
              setMainView('project-detail');
            }}
            onContextMenu={handleContextMenu}
          />
        ) : mainView === 'project-detail' ? (
          <ProjectDetailView
            project={viewProject}
            team={teams.find(t => t._id === viewProject?.teamId)}
            user={CURRENTUSER}
            onClose={() => setMainView('projects')}
          />
        ) : mainView === 'all-teams' ? (
          <div className="list-view-container" style={{ padding: '24px' }}>
            <div className="board-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
              <div className="board-title"><Users size={18} color="#8C8C8C" /> All Teams</div>
            </div>
            <div className="list-header" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
              <div>Team Name</div>
              <div>Key</div>
              <div>Members</div>
            </div>
            {teams.map(t => (
              <div key={t._id} className="list-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div className="list-cell">{t.name}</div>
                <div className="list-cell"><div className="team-key-badge">{t.key}</div></div>
                <div className="list-cell">{t.members?.length || 0} members</div>
              </div>
            ))}
          </div>
        ) : mainView === 'all-members' ? (
          <MembersView />
        ) : mainView === 'team-members' ? (
          <MembersView teamId={activeTeamId} />
        ) : null}

        {/* FULL PAGE ISSUE DETAIL VIEW */}
        <IssueDetailView
          task={selectedTask}
          team={activeTeam}
          project={linearProjects.find(p => p._id === selectedTask?.projectId)}
          user={CURRENTUSER}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedData) => dispatch(editTaskDb({ id: updatedData._id, updatedData }))}
        />
      </div>

      <NewIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
        team={activeTeam}
        project={linearProjects.find(p => p._id === activeProjectId)}
        workspaceId={activeWorkspaceId}
        user={CURRENTUSER}
      />

      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onCreate={confirmCreateTeam}
      />
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreate={confirmCreateProject}
        team={activeTeam}
        user={CURRENTUSER}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={getDeleteTargetName()}
        itemType={contextMenu.targetType?.charAt(0).toUpperCase() + contextMenu.targetType?.slice(1)}
      />

      <TeamSettingsModal
        isOpen={isTeamSettingsModalOpen}
        onClose={() => {
          setIsTeamSettingsModalOpen(false);
          setSettingsTeam(null);
        }}
        team={settingsTeam}
      />

      {/* CONTEXT MENU */}
      {contextMenu.visible && (
        <div 
          className="custom-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="context-menu-section">
            <div 
              className="context-item"
              onClick={() => {
                if (contextMenu.targetType === 'team') {
                  setSettingsTeam(teams.find(t => t._id === contextMenu.targetId));
                  setIsTeamSettingsModalOpen(true);
                }
                closeContextMenu();
              }}
            >
              <Edit2 size={14} /> Edit {contextMenu.targetType}
            </div>
            <div className="context-item disabled">
              <Plus size={14} /> Duplicate
            </div>
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-section">
            <div 
              className="context-item danger" 
              onClick={() => {
                setIsDeleteModalOpen(true);
                closeContextMenu();
              }}
            >
              <Trash2 size={14} /> Delete
              <span className="shortcut">Ctrl Delete</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Project_1;
