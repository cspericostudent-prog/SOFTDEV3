import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, BookOpen, CalendarDays, Check, CheckCheck, ChevronDown,
  ClipboardCheck, Download, FileBarChart, GraduationCap, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, SlidersHorizontal,
  UserRound, Users, X
} from "lucide-react";

const initialStudents = [
  { id: "2026-001", name: "Juan Dela Cruz", section: "CPE 3A", email: "juan.delacruz@school.edu" },
  { id: "2026-002", name: "Maria Santos", section: "CPE 3A", email: "maria.santos@school.edu" },
  { id: "2026-003", name: "Mark Reyes", section: "CPE 3B", email: "mark.reyes@school.edu" },
  { id: "2026-004", name: "Angela Cruz", section: "CPE 3A", email: "angela.cruz@school.edu" },
  { id: "2026-005", name: "Paolo Garcia", section: "CPE 3A", email: "paolo.garcia@school.edu" },
  { id: "2026-006", name: "Sofia Mendoza", section: "CPE 3B", email: "sofia.mendoza@school.edu" },
  { id: "2026-007", name: "Daniel Flores", section: "CPE 3B", email: "daniel.flores@school.edu" },
  { id: "2026-008", name: "Isabella Ramos", section: "CPE 3A", email: "isabella.ramos@school.edu" }
];

const today = new Date().toISOString().slice(0, 10);
const initialStatus = ["Present", "Absent", "Late", "Present", "Present", "Present", "Late", "Present"];
const seedAttendance = Object.fromEntries(initialStudents.map((s, i) => [s.id, initialStatus[i]]));

const navItems = [
  ["Dashboard", LayoutDashboard], ["Take Attendance", ClipboardCheck],
  ["Students", Users], ["Reports", FileBarChart], ["Settings", Settings]
];

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function Status({ value }) {
  return <span className={`status status-${value.toLowerCase()}`}>{value}</span>;
}
function StatCard({ label, value, note, icon: Icon, tone }) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${tone}`}>{value}</div>
    <div className="stat-note">{note}</div>
  </div>;
}
function App() {
  const [loggedIn, setLoggedIn] = useState(readStore("sa_logged_in", false));
  const [page, setPage] = useState("Dashboard");
  const [students, setStudents] = useState(() => readStore("sa_students", initialStudents));
  const [records, setRecords] = useState(() => readStore("sa_records", { [today]: seedAttendance }));
  const [selectedDate, setSelectedDate] = useState(today);
  const [section, setSection] = useState("All sections");
  const [search, setSearch] = useState("");
  const [studentModal, setStudentModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [teacherName, setTeacherName] = useState(() => readStore("sa_teacher", "Teacher"));

  useEffect(() => localStorage.setItem("sa_students", JSON.stringify(students)), [students]);
  useEffect(() => localStorage.setItem("sa_records", JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem("sa_logged_in", JSON.stringify(loggedIn)), [loggedIn]);
  useEffect(() => localStorage.setItem("sa_teacher", JSON.stringify(teacherName)), [teacherName]);

  const sections = useMemo(() => ["All sections", ...new Set(students.map(s => s.section))], [students]);
  const todays = records[selectedDate] || {};
  const filteredStudents = students.filter(s =>
    (section === "All sections" || s.section === section) &&
    `${s.name} ${s.id} ${s.section}`.toLowerCase().includes(search.toLowerCase())
  );
  const counts = students.reduce((a, s) => {
    const status = todays[s.id] || "Unmarked";
    a[status] = (a[status] || 0) + 1;
    return a;
  }, {});
  const marked = (counts.Present || 0) + (counts.Absent || 0) + (counts.Late || 0);
  const attendanceRate = marked ? Math.round(((counts.Present || 0) + (counts.Late || 0)) / marked * 1000) / 10 : 0;

  function updateStatus(id, status) {
    setRecords(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] || {}), [id]: status } }));
  }
  function saveStudent(student) {
    if (editing) setStudents(prev => prev.map(s => s.id === editing.id ? student : s));
    else setStudents(prev => [...prev, student]);
    setStudentModal(false); setEditing(null);
  }
  function exportCSV() {
    const rows = [["Student ID", "Student Name", "Section", "Date", "Attendance Status"],
      ...students.map(s => [s.id, s.name, s.section, selectedDate, todays[s.id] || "Unmarked"])];
    const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${selectedDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
      setLoggedIn(false);
      setPage("Dashboard");
      setMobileNav(false);
      setSearch("");
      setSection("All sections");
    }
  }

  if (!loggedIn) return <Login onLogin={(name) => { setTeacherName(name || "Teacher"); setLoggedIn(true); }} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Check size={17} strokeWidth={3} /></div><span>StudentAttend</span></div>
      <div className="nav-caption">MAIN MENU</div>
      <nav>{navItems.map(([label, Icon]) => <button key={label} className={`nav-link ${page === label ? "active" : ""}`}
        onClick={() => { setPage(label); setMobileNav(false); }}>
        <Icon size={17} /><span>{label}</span>
      </button>)}</nav>
      <div className="sidebar-bottom"><div className="help-dot"><ShieldCheck size={16} /></div>
        <div><strong>Classroom tools</strong><small>Simple. Clear. Organized.</small></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>
        <div className="topbar-title">Student Attendance Management System</div>
        <div className="topbar-actions"><span className="role-label">Teacher</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button>
          <div className="avatar">{teacherName.slice(0, 1).toUpperCase()}</div>
          <button className="profile-name" onClick={() => setPage("Settings")}>{teacherName}<ChevronDown size={14}/></button>
          <button className="icon-button" aria-label="Logout" onClick={handleLogout} title="Logout"><LogOut size={18}/></button>
        </div>
      </header>

      <div className="page-content">
        {page === "Dashboard" && <Dashboard students={students} counts={counts} attendanceRate={attendanceRate}
          records={records} onTake={() => setPage("Take Attendance")} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
        {page === "Take Attendance" && <section>
          <PageHeading title="Take Attendance" subtitle="Mark each student's attendance and save the class record." />
          <div className="notice"><CalendarDays size={17}/><span>Select a date and section, update each status, then save the attendance record.</span></div>
          <div className="toolbar attendance-toolbar">
            <div className="field-inline"><label>Date</label><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/></div>
            <div className="field-inline"><label>Section</label><select value={section} onChange={e => setSection(e.target.value)}>{sections.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="search-box"><Search size={16}/><input placeholder="Search student name or ID" value={search} onChange={e => setSearch(e.target.value)}/></div>
          </div>
          <div className="panel table-panel">
            <div className="panel-heading"><div><h3>Class attendance</h3><p>{filteredStudents.length} students in this view</p></div>
              <button className="button button-light" onClick={() => filteredStudents.forEach(s => updateStatus(s.id, "Present"))}><CheckCheck size={16}/> Mark all present</button></div>
            <div className="table-wrap"><table><thead><tr><th>STUDENT ID</th><th>STUDENT NAME</th><th>SECTION</th><th>ATTENDANCE STATUS</th></tr></thead>
              <tbody>{filteredStudents.map(s => <tr key={s.id}><td className="muted-cell">{s.id}</td><td><strong>{s.name}</strong><small className="cell-sub">{s.email}</small></td><td>{s.section}</td>
                <td><select className={`status-select ${(todays[s.id] || "unmarked").toLowerCase()}`} value={todays[s.id] || "Unmarked"}
                  onChange={e => updateStatus(s.id, e.target.value)}>
                  <option>Unmarked</option><option>Present</option><option>Absent</option><option>Late</option>
                </select></td></tr>)}</tbody></table></div>
            <div className="table-footer"><span>{counts.Present || 0} Present · {counts.Absent || 0} Absent · {counts.Late || 0} Late · {students.length - marked} Unmarked</span>
              <button className="button button-primary" onClick={() => alert("Attendance saved on this device.")}><Check size={16}/> Save attendance</button></div>
          </div>
        </section>}

        {page === "Students" && <section>
          <PageHeading title="Students" subtitle="Manage your class list and student information." action={<button className="button button-primary" onClick={() => {setEditing(null);setStudentModal(true);}}><Plus size={16}/> Add student</button>}/>
          <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search by name, ID, or section" value={search} onChange={e => setSearch(e.target.value)}/></div>
            <div className="field-inline"><label>Section</label><select value={section} onChange={e => setSection(e.target.value)}>{sections.map(s => <option key={s}>{s}</option>)}</select></div></div>
          <div className="panel table-panel"><div className="panel-heading"><div><h3>Student directory</h3><p>{filteredStudents.length} of {students.length} students</p></div></div>
            <div className="table-wrap"><table><thead><tr><th>STUDENT ID</th><th>NAME</th><th>EMAIL</th><th>SECTION</th><th>ACTION</th></tr></thead>
              <tbody>{filteredStudents.map(s => <tr key={s.id}><td>{s.id}</td><td><strong>{s.name}</strong></td><td>{s.email}</td><td>{s.section}</td><td><button className="text-button" onClick={() => {setEditing(s);setStudentModal(true);}}>Edit</button><button className="text-button danger-text" onClick={() => {if(confirm(`Remove ${s.name}?`))setStudents(prev=>prev.filter(x=>x.id!==s.id));}}>Remove</button></td></tr>)}</tbody></table></div>
          </div>
        </section>}

        {page === "Reports" && <section>
          <PageHeading title="Attendance Reports" subtitle="Review attendance records by date and section." action={<button className="button button-primary" onClick={exportCSV}><Download size={16}/> Export CSV</button>}/>
          <div className="toolbar report-toolbar"><div className="field-inline"><label>Report date</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></div>
            <div className="field-inline"><label>Section</label><select value={section} onChange={e=>setSection(e.target.value)}>{sections.map(s=><option key={s}>{s}</option>)}</select></div>
            <span className="report-hint"><SlidersHorizontal size={15}/> Filters update the report automatically</span></div>
          <div className="stats-grid report-stats"><StatCard label="Attendance rate" value={`${attendanceRate}%`} note="Present and late / marked records" icon={Activity} tone="blue"/><StatCard label="Present records" value={counts.Present||0} note="Selected date" icon={CheckCheck} tone="green"/><StatCard label="Absences" value={counts.Absent||0} note="Selected date" icon={X} tone="red"/><StatCard label="Late arrivals" value={counts.Late||0} note="Selected date" icon={CalendarDays} tone="orange"/></div>
          <div className="panel report-table"><div className="panel-heading"><div><h3>Attendance details</h3><p>{selectedDate}</p></div><span className="small-pill">{section}</span></div>
            <div className="table-wrap"><table><thead><tr><th>STUDENT ID</th><th>STUDENT NAME</th><th>SECTION</th><th>STATUS</th></tr></thead><tbody>{filteredStudents.map(s=><tr key={s.id}><td>{s.id}</td><td><strong>{s.name}</strong></td><td>{s.section}</td><td>{todays[s.id]?<Status value={todays[s.id]}/>:<Status value="Unmarked"/>}</td></tr>)}</tbody></table></div></div>
        </section>}

        {page === "Settings" && <section><PageHeading title="Settings" subtitle="Manage your teacher profile and local application preferences."/>
          <div className="panel settings-panel"><div className="settings-icon"><UserRound size={22}/></div><h3>Teacher profile</h3><p>Update the name displayed in the navigation bar.</p>
            <label className="form-label">Display name</label><input className="form-input" value={teacherName} onChange={e=>setTeacherName(e.target.value)} placeholder="Enter teacher name"/>
            <div className="settings-divider"/><h3>Data storage</h3><p>Demo data is stored in this browser using local storage. It is not synced to a server or shared across devices.</p>
            <button className="button button-danger-outline" onClick={()=>{if(confirm("Reset all student and attendance data to the sample data?")){setStudents(initialStudents);setRecords({[today]:seedAttendance});setSelectedDate(today);}}}>Reset sample data</button>
          </div></section>}
      </div>
    </main>
    {studentModal && <StudentModal student={editing} onClose={()=>setStudentModal(false)} onSave={saveStudent} students={students}/>}
  </div>;
}

function PageHeading({title,subtitle,action}) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function Dashboard({students,counts,attendanceRate,records,onTake,selectedDate,setSelectedDate}) {
  const total=students.length, present=counts.Present||0, absent=counts.Absent||0, late=counts.Late||0;
  const weekdays=["Mon","Tue","Wed","Thu","Fri"], heights=[62,86,72,98,78];
  return <section>
    <div className="welcome-row"><div><h1>Good afternoon, Teacher!</h1><p>Here's your class attendance snapshot.</p></div>
      <button className="button button-primary" onClick={onTake}><Plus size={16}/> Take attendance</button></div>
    <div className="dashboard-date"><CalendarDays size={15}/><input aria-label="Dashboard date" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></div>
    <div className="stats-grid"><StatCard label="Total students" value={total} note="Students in your directory" icon={Users} tone="blue"/>
      <StatCard label="Present today" value={present} note="Marked present" icon={CheckCheck} tone="green"/>
      <StatCard label="Absent today" value={absent} note="Marked absent" icon={X} tone="red"/>
      <StatCard label="Late today" value={late} note="Arrived late" icon={CalendarDays} tone="orange"/></div>
    <div className="dashboard-grid">
      <div className="panel recent-panel"><div className="panel-heading"><div><h3>Recent attendance</h3><p>Records for {selectedDate}</p></div><span className="small-pill">{attendanceRate}% attendance</span></div>
        <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>SECTION</th><th>STATUS</th></tr></thead><tbody>{students.slice(0,6).map(s=><tr key={s.id}><td><strong>{s.name}</strong><small className="cell-sub">{s.id}</small></td><td>{s.section}</td><td>{(records[selectedDate]||{})[s.id]?<Status value={records[selectedDate][s.id]}/>:<Status value="Unmarked"/>}</td></tr>)}</tbody></table></div>
      </div>
      <div className="panel chart-panel"><div className="panel-heading"><div><h3>Attendance this week</h3><p>Illustrative weekly overview</p></div></div>
        <div className="bar-chart">{heights.map((h,i)=><div className="bar-column" key={weekdays[i]}><div className="bar-track"><div className={`bar ${i===3?"bar-strong":""}`} style={{height:`${h}%`}}/></div><span>{weekdays[i]}</span></div>)}</div>
        <div className="chart-foot"><span><i/> Weekly attendance trend</span></div>
      </div>
    </div>
  </section>;
}
function Login({onLogin}) {
  const [email,setEmail]=useState("teacher@school.edu"),[password,setPassword]=useState("password"),[name,setName]=useState("Teacher");
  return <div className="login-screen"><div className="login-brand-panel"><div className="brand brand-light"><div className="brand-mark"><Check size={17}/></div><span>StudentAttend</span></div>
    <div className="login-copy"><span className="eyebrow">STUDENT ATTENDANCE</span><h1>Every class.<br/>Every student.<br/>Accounted for.</h1><p>A simple way to record attendance,<br/>track absences, and review class records.</p></div>
    <span className="login-footer">CLASSROOM MANAGEMENT</span></div>
    <div className="login-form-side"><form className="login-card" onSubmit={e=>{e.preventDefault();onLogin(name);}}>
      <span className="eyebrow blue-text">WELCOME BACK</span><h2>Sign in to your account</h2><p className="login-sub">Enter your school account details to continue.</p>
      <label className="form-label">Display name</label><input className="form-input" value={name} onChange={e=>setName(e.target.value)} required/>
      <label className="form-label">Email address</label><input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <label className="form-label">Password</label><input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <div className="login-options"><label><input type="checkbox"/> Remember me</label><button type="button" className="text-button" onClick={()=>alert("Password recovery requires a connected authentication service.")}>Forgot password?</button></div>
      <button className="button button-primary login-submit" type="submit">Sign in</button><p className="login-note">Demo interface · Any email and password will work</p>
    </form></div></div>;
}
function StudentModal({student,onClose,onSave,students}) {
  const [form,setForm]=useState(student||{id:"",name:"",section:"CPE 3A",email:""});
  const [error,setError]=useState("");
  function submit(e){e.preventDefault();if(!form.id.trim()||!form.name.trim()||!form.section.trim()){setError("Please complete the student ID, name, and section.");return;}
    if(!student&&students.some(s=>s.id.toLowerCase()===form.id.trim().toLowerCase())){setError("That student ID already exists.");return;}
    onSave({...form,id:form.id.trim(),name:form.name.trim(),section:form.section.trim(),email:form.email.trim()});}
  const change=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><form className="modal-card" onSubmit={submit}>
    <div className="modal-heading"><div><h2>{student?"Edit student":"Add student"}</h2><p>Enter the student's basic information.</p></div><button type="button" className="icon-button" onClick={onClose}><X size={19}/></button></div>
    <label className="form-label">Student ID</label><input className="form-input" value={form.id} onChange={e=>change("id",e.target.value)} disabled={!!student} placeholder="e.g. 2026-009"/>
    <label className="form-label">Full name</label><input className="form-input" value={form.name} onChange={e=>change("name",e.target.value)} placeholder="Student full name"/>
    <label className="form-label">Section</label><input className="form-input" value={form.section} onChange={e=>change("section",e.target.value)} placeholder="e.g. CPE 3A"/>
    <label className="form-label">Email address</label><input className="form-input" type="email" value={form.email} onChange={e=>change("email",e.target.value)} placeholder="student@school.edu"/>
    {error&&<p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">{student?"Save changes":"Add student"}</button></div>
  </form></div>;
}

export default App;
