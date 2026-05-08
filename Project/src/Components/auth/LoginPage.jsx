import React, { useState } from "react"
import "./LoginPage.css"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, LogIn, Command } from "lucide-react";
import { loginUser, googleLogin } from "../../redux/slices/authSlice";
import { useDispatch } from "react-redux";
import { GoogleLogin } from '@react-oauth/google';

function LoginPage() {
    const dispatch = useDispatch();
    const [Email, setEmail] = useState();
    const [Password, setPassword] = useState();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(loginUser({ email: Email, password: Password }));
        if (loginUser.fulfilled.match(result)) {
            navigate("/linear");
        } else {
            alert(result.payload);
            console.log(result.payload);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const result = await dispatch(googleLogin(credentialResponse.credential));
        if (googleLogin.fulfilled.match(result)) {
            navigate("/linear");
        } else {
            alert("Google Login Failed");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Command size={32} color="var(--accent-primary)" />
                    </div>
                    <h1>Log in to Project-Management-Tool</h1>
                    <p>Welcome back. Please enter your details.</p>
                </div>

                <div className="google-auth-section">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert("Google Login Failed")}
                        useOneTap
                        theme="filled_black"
                        shape="rectangular"
                        text="continue_with_google"
                    />
                </div>

                <div className="auth-separator">
                    <span>OR</span>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-field">
                        <input
                            type="email"
                            placeholder="Email address"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <input
                            type="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        Continue with Email
                    </button>
                </form>

                <div className="auth-switch">
                    Don't have an account? <Link to="/">Sign up</Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage
