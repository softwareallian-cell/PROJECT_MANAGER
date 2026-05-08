import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inviteWorkspaceMembers, fetchWorkspaceMembers } from '../../redux/slices/workspaceSlice';
import './InviteModal.css';

const InviteModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const activeWorkspaceId = useSelector(state => state.teams.activeWorkspaceId);
    const teams = useSelector(state => state.teams.teams);
    
    const [emails, setEmails] = useState('');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async () => {
        if (!emails.trim()) return;
        
        setIsSending(true);
        const emailList = emails.split(/[, \n]+/).filter(e => e.trim().includes('@'));
        
        try {
            await dispatch(inviteWorkspaceMembers({
                workspaceId: activeWorkspaceId,
                emails: emailList,
                teamIds: selectedTeams
            })).unwrap();
            
            // Refresh members list
            dispatch(fetchWorkspaceMembers(activeWorkspaceId));
            onClose();
        } catch (err) {
            alert("Failed to send invites: " + err);
        } finally {
            setIsSending(false);
        }
    };

    const toggleTeam = (teamId) => {
        setSelectedTeams(prev => 
            prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="invite-modal" onClick={e => e.stopPropagation()}>
                <div className="invite-modal-header">
                    <div className="workspace-badge">WO</div>
                    <h3>Invite to your workspace</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="invite-modal-body">
                    <div className="input-group">
                        <label>Email</label>
                        <textarea 
                            placeholder="email@gmail.com, email2@gmail.com..."
                            value={emails}
                            onChange={e => setEmails(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Add to team <span className="optional">(optional)</span></label>
                        <div className="team-select-trigger">
                            {selectedTeams.length > 0 ? (
                                <div className="selected-teams-badges">
                                    {selectedTeams.map(id => {
                                        const team = teams.find(t => t._id === id);
                                        return (
                                            <span key={id} className="team-badge" style={{'--team-color': team?.color || '#5e6ad2'}}>
                                                {team?.name}
                                                <button onClick={() => toggleTeam(id)}>&times;</button>
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : "Select teams..."}
                        </div>
                        <div className="team-options-dropdown">
                            {teams.map(team => (
                                <div 
                                    key={team._id} 
                                    className={`team-option ${selectedTeams.includes(team._id) ? 'selected' : ''}`}
                                    onClick={() => toggleTeam(team._id)}
                                >
                                    <span className="team-icon" style={{backgroundColor: team.color || '#5e6ad2'}}>
                                        {team.name.charAt(0)}
                                    </span>
                                    {team.name}
                                    {selectedTeams.includes(team._id) && <span className="check-mark">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="invite-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button 
                        className="send-btn" 
                        onClick={handleInvite} 
                        disabled={isSending || !emails.trim()}
                    >
                        {isSending ? "Sending..." : "Send invites"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
