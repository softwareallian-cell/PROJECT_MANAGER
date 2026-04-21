import React, { useState } from "react"
import "./SignupPage.css"
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, ShieldCheck } from "lucide-react";
import { useDispatch, } from "react-redux";
import { signupUser } from "./Redux";
function SignupPage() {
    const dispatch = useDispatch();
    const [Email, setEmail] = useState();
    const [Password, setPassword] = useState();
    const [Role, setRole] = useState("member");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(signupUser({ email: Email, password: Password, role: Role }));
        if (signupUser.fulfilled.match(result)) {
            alert("Account created!");
            navigate("/login");
        } else {
            alert(result.payload || "Signup failed");
            console.log(result.payload); // shows "Email already exists" from server
        }
    };


    return (
        <div className="signup-container">
            <div className="signup-card">
                <h1>Create Account</h1>
                <p className="signup-subtitle">Join us to start managing your projects</p>
                
                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="input-group">
                        <label><Mail size={16} /> Email Address</label>
                        <input 
                            type="email" 
                            placeholder="name@company.com"
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={16} /> Password</label>
                        <input 
                            type="password" 
                            placeholder="Min. 8 characters"
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label><ShieldCheck size={16} /> Account Role</label>
                        <select onChange={(e) => setRole(e.target.value)} value={Role}>
                            <option value="member">Project Member</option>
                            <option value="manager">Project Manager</option>
                        </select>
                    </div>

                    <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>
                        <UserPlus size={18} /> Get Started
                    </button>

                    <div className="auth-footer">
                        Already have an account? 
                        <Link to="/login">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignupPage;
