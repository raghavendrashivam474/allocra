import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api/health';
import SetupWorkspace from '../features/setup/SetupWorkspace';
import InstitutionView from '../features/institution/InstitutionView';
import AcademicStructureView from '../features/academic-structure/AcademicStructureView';
import TermsAndGroupsView from '../features/academic-context/TermsAndGroupsView';
import CalendarView from '../features/calendar/CalendarView';
import TimeModelView from '../features/time-model/TimeModelView';
import FacultyView from '../features/faculty/FacultyView';
import RoomsView from '../features/rooms/RoomsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkHealth()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <div className="allocra-container">
      <header className="allocra-header">
        <div className="brand-wrap">
          <h1>ALLOCRA</h1>
          <span className="brand-badge">Academic Engine</span>
        </div>
        <div className="system-status">
          <span className={`status-dot status-${serverStatus}`} aria-hidden="true"></span>
          <span>Backend: {serverStatus}</span>
        </div>
      </header>

      <div className="allocra-body">
        <aside className="allocra-sidebar" aria-label="Main Navigation">
          <div className="nav-section-label">Workspace</div>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            Setup Workspace
          </button>

          <div className="nav-section-label">Institution</div>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'institution' ? 'active' : ''}`}
            onClick={() => setActiveTab('institution')}
          >
            Institution
          </button>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'academic-structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic-structure')}
          >
            Academic Structure
          </button>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'terms-and-groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms-and-groups')}
          >
            Terms & Groups
          </button>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </button>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'time-model' ? 'active' : ''}`}
            onClick={() => setActiveTab('time-model')}
          >
            Time Model
          </button>

          <div className="nav-section-label">Resources</div>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveTab('faculty')}
          >
            Faculty
          </button>
          <button
            type="button"
            className={`allocra-nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Rooms
          </button>
        </aside>

        <main className="allocra-content" id="main-content">
          {activeTab === 'setup' && (
            <SetupWorkspace onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'institution' && (
            <InstitutionView />
          )}
          {activeTab === 'academic-structure' && (
            <AcademicStructureView />
          )}
          {activeTab === 'terms-and-groups' && (
            <TermsAndGroupsView />
          )}
          {activeTab === 'calendar' && (
            <CalendarView />
          )}
          {activeTab === 'time-model' && (
            <TimeModelView />
          )}
          {activeTab === 'faculty' && (
            <FacultyView />
          )}
          {activeTab === 'rooms' && (
            <RoomsView />
          )}
        </main>
      </div>
    </div>
  );
}
