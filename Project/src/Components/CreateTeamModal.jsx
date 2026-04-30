import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, Users } from 'lucide-react';
import './CreateTeamModal.css';

const CreateTeamModal = ({ isOpen, onClose, onCreate }) => {
  const [teamName, setTeamName] = useState('');
  const [teamKey, setTeamKey] = useState('');

  // Auto-generate key from name if not manually edited
  const handleNameChange = (e) => {
    const val = e.target.value;
    setTeamName(val);
    if (val.length >= 2) {
      setTeamKey(val.substring(0, 3).toUpperCase());
    } else {
      setTeamKey('');
    }
  };

  const handleCreate = () => {
    if (!teamName.trim()) return;
    onCreate({
      name: teamName,
      key: teamKey || teamName.substring(0, 3).toUpperCase()
    });
    setTeamName('');
    setTeamKey('');
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="team-modal-overlay" onClick={onClose}>
      <div className="create-team-card" onClick={e => e.stopPropagation()}>
        <button className="close-team-modal" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="team-modal-header">
          <h2>Create a new team</h2>
          <p>Create a new team to manage separate cycles, workflows and notifications</p>
        </div>



        <div className="team-form-section">
          <div className="form-group-row">
            <div className="label-side">
              <div className="field-label">Team icon</div>
            </div>
            <div className="input-side">
              <div className="team-icon-placeholder">
                <Users size={16} />
              </div>
            </div>
          </div>

          <div className="form-group-row">
            <div className="label-side">
              <div className="field-label">Team name</div>
            </div>
            <div className="input-side">
              <input
                type="text"
                className="team-text-input"
                placeholder="e.g. Engineering"
                value={teamName}
                onChange={handleNameChange}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="label-side">
              <div className="field-label">Identifier</div>
              <div className="field-desc">Used to identify issues from this team (e.g. ENG-123)</div>
            </div>
            <div className="input-side">
              <input
                type="text"
                className="team-text-input"
                placeholder="e.g. ENG"
                value={teamKey}
                onChange={(e) => setTeamKey(e.target.value.toUpperCase())}
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <div className="team-modal-footer">
          <button
            className="submit-team-btn"
            onClick={handleCreate}
            disabled={!teamName.trim()}
          >
            Create team
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateTeamModal;
