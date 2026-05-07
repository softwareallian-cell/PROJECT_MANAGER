import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-container" onClick={e => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="warning-icon-wrapper">
            <AlertTriangle size={20} color="#ff4d4d" />
          </div>
          <h3>Delete {itemType}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p>
            Are you sure you want to delete <span className="item-name">"{itemName}"</span>? 
            This action cannot be undone and all associated data will be permanently removed.
          </p>
        </div>

        <div className="delete-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-delete-btn" onClick={onConfirm}>
            Delete {itemType}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
