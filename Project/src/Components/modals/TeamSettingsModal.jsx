import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Settings, Users, UserPlus, Trash2, Search, Check } from 'lucide-react';
import { searchUsers, clearUserSearch } from '../../redux/slices/authSlice';
import { updateTeamDb, addTeamMemberDb, removeTeamMemberDb } from '../../redux/slices/teamSlice';
import './TeamSettingsModal.css';

const TeamSettingsModal = ({ isOpen, onClose, team }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({ name: '', key: '' });
  const [memberSearch, setMemberSearch] = useState('');
  
  const userSearchResults = useSelector(state => state.auth.userSearchResults);
  const currentUser = useSelector(state => state.auth.currentUser);

  useEffect(() => {
    if (team) {
      setFormData({ name: team.name, key: team.key });
    }
  }, [team]);

  useEffect(() => {
    if (memberSearch.length > 2) {
      dispatch(searchUsers(memberSearch));
    } else {
      dispatch(clearUserSearch());
    }
  }, [memberSearch, dispatch]);

  if (!isOpen || !team) return null;

  const handleUpdateTeam = (e) => {
    e.preventDefault();
    dispatch(updateTeamDb({ id: team._id, updatedData: formData }));
    onClose();
  };

  const handleAddMember = (userId) => {
    dispatch(addTeamMemberDb({ teamId: team._id, userId }));
    setMemberSearch('');
  };

  const handleRemoveMember = (userId) => {
    if (userId === currentUser._id) {
      alert("You cannot remove yourself from the team.");
      return;
    }
    dispatch(removeTeamMemberDb({ teamId: team._id, userId }));
  };

  return (
    <div className="team-settings-overlay" onClick={onClose}>
      <div className="team-settings-container" onClick={e => e.stopPropagation()}>
        <div className="team-settings-header">
          <div className="team-info">
            <div className="team-avatar">{team.key}</div>
            <div>
              <h3>Team Settings</h3>
              <p>{team.name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="team-settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Settings size={14} /> General
          </button>
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={14} /> Members
          </button>
        </div>

        <div className="team-settings-body">
          {activeTab === 'general' ? (
            <form onSubmit={handleUpdateTeam} className="settings-form">
              <div className="form-group">
                <label>Team Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="form-group">
                <label>Team Key</label>
                <p className="field-desc">Short identifier used for issues (e.g. ENG-101)</p>
                <input 
                  type="text" 
                  value={formData.key} 
                  onChange={e => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                  maxLength={5}
                />
              </div>
              <div className="form-footer">
                <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="primary-btn">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="members-management">
              <div className="member-search-container">
                <div className="search-input-wrapper">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by email to add members..." 
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                </div>
                {userSearchResults.length > 0 && (
                  <div className="search-results">
                    {userSearchResults.map(user => {
                      const isAlreadyMember = team.members?.includes(user._id);
                      return (
                        <div key={user._id} className="search-result-item">
                          <span>{user.email}</span>
                          {isAlreadyMember ? (
                            <span className="already-member">Already in team</span>
                          ) : (
                            <button className="add-member-btn" onClick={() => handleAddMember(user._id)}>
                              <UserPlus size={14} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="current-members-list">
                <h4>Team Members ({team.members?.length || 0})</h4>
                {team.members_data?.map(member => (
                  <div key={member._id} className="member-row">
                    <div className="member-info">
                      <div className="member-avatar-small">
                        {member.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <span className="member-email">{member.email}</span>
                        <span className="member-role">{member._id === currentUser._id ? 'You' : 'Member'}</span>
                      </div>
                    </div>
                    <button 
                      className="remove-btn" 
                      onClick={() => handleRemoveMember(member._id)}
                      title="Remove from team"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamSettingsModal;
