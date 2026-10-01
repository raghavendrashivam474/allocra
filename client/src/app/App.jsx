import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api/health';
import InstitutionView from '../features/institution/InstitutionView';
import AcademicStructureView from '../features/academic-structure/AcademicStructureView';
import TermsAndGroupsView from '../features/academic-context/TermsAndGroupsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkHealth()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <div className="allocra-container">
      <header className="allocra-header">
        <h1>ALLOCRA</h1>
        <div className="system-status">
          <span className={`status-dot status-${serverStatus}`}></span>
          <span>Backend: {serverStatus}</span>
        </div>
      </header>

      <div className="allocra-body">
        <aside className="allocra-sidebar">
          <button
            className={`allocra-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`allocra-nav-item ${activeTab === 'institution' ? 'active' : ''}`}
            onClick={() => setActiveTab('institution')}
          >
            Institution
          </button>
          <button
            className={`allocra-nav-item ${activeTab === 'academic-structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic-structure')}
          >
            Academic Structure
          </button>
          <button
            className={`allocra-nav-item ${activeTab === 'terms-and-groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms-and-groups')}
          >
            Terms & Groups
          </button>
        </aside>

        <main className="allocra-content">
          {activeTab === 'overview' && (
            <div className="card">
              <h2>Welcome to Allocra</h2>
              <p>Configurable, constraint-aware resource allocation and scheduling platform.</p>
              <br />
              <p>Select <strong>Institution</strong> from the sidebar to configure the college foundation.</p>
            </div>
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
        </main>
      </div>
    </div>
  );
}
