import { Navigate, Outlet, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertTriangle, ShieldX, ArrowLeft } from "lucide-react";

const LoginGuard = () => {
    return localStorage.getItem("CURRENTUSER") ? <Outlet /> : <Navigate to="/login" />;
}

const GuestGuard = () => {
    return !localStorage.getItem("CURRENTUSER") ? <Outlet /> : <Navigate to="/projects" />;
}

const ProjectGuard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUserRaw = localStorage.getItem("CURRENTUSER");
    if (!currentUserRaw) return <Navigate to="/login" />;

    const CURRENTUSER_ID = JSON.parse(currentUserRaw)[0]._id;

    const createdProjects = useSelector((state) => state.projects.createdProjects);
    const assignedProjects = useSelector((state) => state.projects.assignedProjects);
    const allProjects = [...createdProjects, ...assignedProjects];

    const matchedProject = allProjects.find((p) => p._id === id);

    if (!matchedProject) {
        return (
            <div className="error-screen">
                <AlertTriangle size={64} color="var(--accent-amber)" />
                <h1>Project Not Found</h1>
                <p>The project you are looking for does not exist or has been removed.</p>
                <button onClick={() => navigate("/projects")} className="back-link">
                    <ArrowLeft size={16} /> Back to Projects
                </button>
            </div>
        );
    }

    const isCreator = String(matchedProject.createdBy) === String(CURRENTUSER_ID);
    const isAssignee = matchedProject.assignedTo?.some(uid => String(uid) === String(CURRENTUSER_ID));

    if (isCreator || isAssignee) {
        return <Outlet />;
    }

    return (
        <div className="error-screen">
            <ShieldX size={64} color="var(--danger)" />
            <h1>Access Denied</h1>
            <p>You do not have permission to view this project.</p>
            <button onClick={() => navigate("/projects")} className="back-link">
                <ArrowLeft size={16} /> Back to Projects
            </button>
        </div>
    );
};


export { LoginGuard, ProjectGuard, GuestGuard };