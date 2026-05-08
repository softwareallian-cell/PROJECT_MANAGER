import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspaceMembers, removeWorkspaceMember, updateMemberRole } from '../../redux/slices/workspaceSlice';
import InviteModal from '../modals/InviteModal';
import './MembersView.css';

const MembersView = ({ teamId = null }) => {
    const dispatch = useDispatch();
    const activeWorkspaceId = useSelector(state => state.teams.activeWorkspaceId);
    const teams = useSelector(state => state.teams.teams);
    const { members, status, error } = useSelector(state => state.workspace);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    useEffect(() => {
        if (activeWorkspaceId) {
            dispatch(fetchWorkspaceMembers(activeWorkspaceId));
        }
    }, [activeWorkspaceId, dispatch]);

    const activeTeam = teams.find(t => t._id === teamId);
    const filteredMembers = teamId 
        ? members.filter(m => m.teams?.some(t => t._id === teamId))
        : members;

    const handleRemoveMember = (userId) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            dispatch(removeWorkspaceMember({ workspaceId: activeWorkspaceId, userId }));
        }
    };

    const handleRoleChange = (userId, newRole) => {
        dispatch(updateMemberRole({ workspaceId: activeWorkspaceId, userId, role: newRole }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatLastSeen = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 5) return <span className="online-indicator">Online</span>;
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
        return formatDate(dateString);
    };

    return (
        <div className="members-view">
            <div className="members-header">
                <div className="header-left">
                    <h2>{teamId ? `${activeTeam?.name} Members` : 'Workspace Members'} <span className="count">{filteredMembers.length}</span></h2>
                </div>
                <button className="invite-trigger-btn" onClick={() => setIsInviteModalOpen(true)}>+</button>
            </div>

            <div className="members-table-container">
                <table className="members-table">
                    <thead>
                        <tr>
                            <th>Name <span className="sort-icon">↓</span></th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Teams</th>
                            <th>Last seen</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map(member => (
                            <tr key={member._id}>
                                <td>
                                    <div className="member-info">
                                        <div className="member-avatar">
                                            {member.user.avatar ? (
                                                <img src={member.user.avatar} alt="" />
                                            ) : (
                                                <div className="avatar-placeholder" style={{backgroundColor: '#5e6ad2'}}>
                                                    {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-text">
                                            <div className="member-name">{member.user.name || member.user.email.split('@')[0]}</div>
                                            <div className="member-email">{member.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${member.status}`}>
                                        {member.role === 'admin' ? 'Admin' : 'Member'}
                                        {member.status === 'invited' && ' (Invited)'}
                                    </span>
                                </td>
                                <td>{formatDate(member.joinedAt)}</td>
                                <td>
                                    <div className="teams-list">
                                        {member.teams?.map(team => (
                                            <span key={team._id} className="team-small-badge" title={team.name} style={{borderColor: team.color}}>
                                                {team.name.substring(0, 3).toUpperCase()}
                                            </span>
                                        ))}
                                        {(!member.teams || member.teams.length === 0) && <span className="no-teams">—</span>}
                                    </div>
                                </td>
                                <td>{formatLastSeen(member.user.lastSeen)}</td>
                                <td className="actions-cell">
                                    <button className="more-actions" onClick={() => handleRemoveMember(member.user._id)}>Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {status === 'loading' && <div className="loading-state">Loading members...</div>}
                {status === 'failed' && <div className="error-state">{error}</div>}
                {status === 'succeeded' && members.length === 0 && <div className="empty-state">No members found.</div>}
            </div>

            <InviteModal 
                isOpen={isInviteModalOpen} 
                onClose={() => setIsInviteModalOpen(false)} 
            />
        </div>
    );
};

export default MembersView;
