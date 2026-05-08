import { useSelector } from "react-redux";
import { GanttChartSquare } from "lucide-react";
import "./GanttView.css";

const STATUS_COLORS = {
    backlog: 'gray',
    todo: '#4a9eff',
    inprogress: '#f2aa4d',
    inreview: '#a855f7',
    onhold: 'orange',
    done: 'teal',
    complete: 'lime'
};



function GanttView() {

    const createdProjects = useSelector((state) => state.projects.createdProjects);
    const assignedProjects = useSelector((state) => state.projects.assignedProjects);
    // Show all projects the user is involved in
    const allProjects = [
        ...createdProjects,
        ...assignedProjects.filter(ap => !createdProjects.find(cp => cp._id === ap._id))
    ];
    const current_Date = new Date();
    const daysInMonth = new Date(current_Date.getFullYear(), current_Date.getMonth() + 1, 0).getDate();

    return (
        <>

            <div className="gantt-wrapper">
                <h2 className="gantt-title">
                    <GanttChartSquare size={22} /> Gantt Chart of {current_Date.toLocaleString('default', { month: 'long' })} {current_Date.getFullYear()}
                </h2>
                <div className="gantt-grid">
                    <div className="gantt-days">
                        {
                            Array.from({ length: daysInMonth }, (_, i) => (
                                <div key={i} style={{ borderLeft: '1px solid white' }}>{i + 1}</div>
                            ))
                        }
                    </div >
                    <div>
                        {allProjects.map((p) => {
                            const StartDate = new Date(p.startDate || p.createdAt);
                            const Due_Date = new Date(p.date);


                            const endsBeforeMonth =
                                Due_Date.getFullYear() < current_Date.getFullYear() ||
                                (Due_Date.getFullYear() === current_Date.getFullYear() &&
                                    Due_Date.getMonth() < current_Date.getMonth());

                            const startsAfterMonth =
                                StartDate.getFullYear() > current_Date.getFullYear() ||
                                (StartDate.getFullYear() === current_Date.getFullYear() &&
                                    StartDate.getMonth() > current_Date.getMonth());

                            if (endsBeforeMonth || startsAfterMonth) return null;

                            let Start = 1;
                            if (StartDate.getMonth() === current_Date.getMonth() && StartDate.getFullYear() === current_Date.getFullYear()) {
                                Start = StartDate.getDate();
                            }

                            //const daysInMonth = new Date(current_Date.getFullYear(), current_Date.getMonth() + 1, 0).getDate();
                            let End = daysInMonth;
                            if (Due_Date.getMonth() === current_Date.getMonth() && Due_Date.getFullYear() === current_Date.getFullYear()) {
                                End = Due_Date.getDate();
                            }

                            const duration = Math.max(1, End - Start + 1);
                            return (
                                < div key={p._id} className="gantt-row" >
                                    <div className="gantt-label">{p.Title}</div>
                                    <div className="gantt-bar-container">
                                        <div className={`gantt-bar ${p.status}`} style={{
                                            gridColumnStart: Start,
                                            gridColumnEnd: `span ${duration}`,
                                            background: STATUS_COLORS[p.status] || 'gray'
                                        }}> {p.status}
                                        </div>
                                    </div>
                                </div>);
                        })}
                    </div>
                </div>
            </div >
        </>)
}

export default GanttView;