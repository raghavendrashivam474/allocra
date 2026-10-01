import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchPrograms } from '../../api/academicStructure';
import {
  fetchTerms,
  createTerm,
  fetchGroups,
  createGroup
} from '../../api/academicContext';

export default function TermsAndGroupsView() {
  const [institution, setInstitution] = useState(null);
  const [terms, setTerms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Term Form State
  const [showTermForm, setShowTermForm] = useState(false);
  const [termName, setTermName] = useState('');
  const [submittingTerm, setSubmittingTerm] = useState(false);

  // Group Form State
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [submittingGroup, setSubmittingGroup] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const instRes = await fetchInstitution();
      setInstitution(instRes.institution);

      if (instRes.institution) {
        const [termsRes, groupsRes, progsRes] = await Promise.all([
          fetchTerms(),
          fetchGroups(),
          fetchPrograms()
        ]);
        setTerms(termsRes.terms || []);
        setGroups(groupsRes.groups || []);
        setPrograms(progsRes.programs || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTerm(e) {
    e.preventDefault();
    if (!termName.trim()) {
      setError('Term name is required');
      return;
    }

    setSubmittingTerm(true);
    setError(null);
    try {
      const result = await createTerm({ name: termName });
      setTerms(prev => [...prev, result.term]);
      setTermName('');
      setShowTermForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingTerm(false);
    }
  }

  async function handleAddGroup(e) {
    e.preventDefault();
    if (!selectedProgramId) {
      setError('Please select a program');
      return;
    }
    if (!selectedTermId) {
      setError('Please select a term');
      return;
    }
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setSubmittingGroup(true);
    setError(null);
    try {
      const result = await createGroup({
        programId: selectedProgramId,
        termId: selectedTermId,
        name: groupName
      });
      setGroups(prev => [...prev, result.group]);
      setGroupName('');
      setSelectedProgramId('');
      setSelectedTermId('');
      setShowGroupForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingGroup(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Academic Terms & Groups</h2>
        <p>Loading terms and groups details...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="card">
        <h2>Academic Terms & Groups</h2>
        <div className="alert alert-error">
          {error || 'Please configure your Institution first before accessing Terms & Groups.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '650px' }}>
      {/* Institution Context Header */}
      <div className="card" style={{ maxWidth: '100%' }}>
        <h2>Active Institution</h2>
        <div className="info-group">
          <span className="info-label">Name</span>
          <span className="info-value">{institution.name}</span>
        </div>
        <div className="info-group" style={{ marginBottom: 0 }}>
          <span className="info-label">Academic Year</span>
          <span className="info-value">{institution.academicYear}</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="card" style={{ maxWidth: '100%' }}>
        <h2>Terms & Groups Configuration</h2>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Academic Terms Panel */}
        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            Academic Terms
          </h3>

          {terms.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
              No academic terms configured yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {terms.map(term => (
                <div
                  key={term._id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{term.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Academic Year: {term.academicYear}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showTermForm && (
            <button className="btn btn-secondary" onClick={() => { setShowTermForm(true); setError(null); }}>
              + Add Term
            </button>
          )}

          {showTermForm && (
            <form onSubmit={handleAddTerm} style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', marginTop: '12px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="termName">Term Name</label>
                <input
                  id="termName"
                  type="text"
                  placeholder="e.g. Semester 1"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  disabled={submittingTerm}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={submittingTerm}>
                  {submittingTerm ? 'Creating...' : 'Create Term'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => { setShowTermForm(false); setTermName(''); setError(null); }}
                  disabled={submittingTerm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Groups / Batches Panel */}
        <section>
          <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            Groups / Batches
          </h3>

          {groups.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
              No groups configured yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {groups.map(grp => (
                <div
                  key={grp._id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{grp.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Program: {grp.programId?.name || 'Unknown Program'} | Term: {grp.termId?.name || 'Unknown Term'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showGroupForm && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowGroupForm(true);
                setError(null);
                if (programs.length > 0) setSelectedProgramId(programs[0]._id);
                if (terms.length > 0) setSelectedTermId(terms[0]._id);
              }}
              disabled={programs.length === 0 || terms.length === 0}
              title={
                programs.length === 0 && terms.length === 0
                  ? "Create at least one Program and one Term first"
                  : programs.length === 0
                  ? "Create a Program in Academic Structure first"
                  : terms.length === 0
                  ? "Create an Academic Term first"
                  : ""
              }
            >
              + Add Group
            </button>
          )}

          {showGroupForm && (
            <form onSubmit={handleAddGroup} style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', marginTop: '12px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="groupName">Group Name</label>
                <input
                  id="groupName"
                  type="text"
                  placeholder="e.g. CSE-A"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={submittingGroup}
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="groupProgram">Program</label>
                <select
                  id="groupProgram"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  disabled={submittingGroup}
                >
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="groupTerm">Term</label>
                <select
                  id="groupTerm"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  disabled={submittingGroup}
                >
                  {terms.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={submittingGroup}>
                  {submittingGroup ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => {
                    setShowGroupForm(false);
                    setGroupName('');
                    setSelectedProgramId('');
                    setSelectedTermId('');
                    setError(null);
                  }}
                  disabled={submittingGroup}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
