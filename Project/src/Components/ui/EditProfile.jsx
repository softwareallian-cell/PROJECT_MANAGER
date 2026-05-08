import React, { useState } from "react"
import "../auth/LoginPage.css"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, Save, Trash2, X } from "lucide-react";
import { deleteProfile, updateProfile } from "../../redux/slices/authSlice";

function EditProfile() {
    const CURRENT_USER = JSON.parse(localStorage.getItem("CURRENTUSER"));
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [Email, setEmail] = useState(CURRENT_USER[0].email);
    const [Password, setPassword] = useState(CURRENT_USER[0].password);

    const delete_profile = async (e) => {
        e.preventDefault();
        const result = await dispatch(deleteProfile(CURRENT_USER[0]._id));
        if (deleteProfile.fulfilled.match(result)) {
            alert("Account deleted.");
            navigate("/");
        } else {
            alert("Failed to delete account.");
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(updateProfile({
            id: CURRENT_USER[0]._id,
            updatedData: { email: Email, password: Password }
        }));
        if (updateProfile.fulfilled.match(result)) {
            alert("Profile updated.");
            navigate("/projects");
        } else {
            alert("Failed to update profile.");
        }
    };

    return (
        <div className="login-container">
            <div className="login_page">
                <h1>Edit Profile</h1>
                <p className="login-subtitle">Update your account credentials</p>

                <form className="auth-form">
                    <div className="input-group">
                        <label><Mail size={16} /> Email Address</label>
                        <input
                            type="email"
                            defaultValue={CURRENT_USER[0].email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={16} /> Password</label>
                        <input
                            type="password"
                            defaultValue={CURRENT_USER[0].password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: '12px', marginTop: '10px' }}>
                        <button onClick={handleSubmit} className="submit-btn" type="submit">
                            <Save size={18} /> Save Changes
                        </button>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={() => navigate("/projects")}
                                className="tracker-btn-ghost"
                                style={{ flex: 1, padding: "12px", borderRadius: "12px", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                type="button"
                                onClick={delete_profile}
                                className="tracker-btn-danger"
                                style={{ flex: 1, padding: "12px", borderRadius: "12px", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Trash2 size={16} /> Delete Account
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfile
