import React, { useState } from "react"
import "./LoginPage.css"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, LogIn } from "lucide-react";
import { loginUser } from "./Redux";
import { useDispatch } from "react-redux";

function LoginPage() {
    const dispatch = useDispatch();
    const [Email, setEmail] = useState();
    const [Password, setPassword] = useState();
    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(loginUser({ email: Email, password: Password }));
        if (loginUser.fulfilled.match(result)) {
            navigate("/projects");
        } else {
            alert(result.payload);
            console.log(result.payload); // "Email not found" or "Wrong password"
        }
    };

    return (
        <div className="login-container">
            <div className="login_page">
                <h1>Log In</h1>
                <p className="login-subtitle">Enter your credentials to access your projects</p>
                
                <form onSubmit={handleSubmit} className="auth-form">
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
                            placeholder="••••••••"
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        <LogIn size={18} /> Sign In
                    </button>

                    <div className="auth-footer">
                        Don't have an account? 
                        <Link to="/">Create one</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage
