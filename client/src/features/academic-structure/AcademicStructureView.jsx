import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import {
  fetchDepartments,
  createDepartment,
  fetchPrograms,
  createProgram
} from '../../api/academicStructure';

export default function AcademicStructureView() {
  const [institution, setInstitution] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Forms states
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [submittingDept, setSubmittingDept] = useState(false);

  const [showProgForm, setShowProgForm] = useState(false);
  const [progName, setProgName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [submittingProg, setSubmittingProg] = useState(false);

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
        const [deptsRes, progsRes] = await Promise.all([
          fetchDepartments(),
          fetchPrograms()
        ]);
        setDepartments(deptsRes.departments || []);
        setPrograms(progsRes.programs || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDepartment(e) {
    e.preventDefault();
    if (!deptName.trim()) {
      setError('Department name is required');
      return;
    }

    setSubmittingDept(true);
    setError(null);
    try {
      const result = await createDepartment({ name: deptName });
      setDepartments(prev => [...prev, result.department]);
      setDeptName('');
      setShowDeptForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingDept(false);
    }
  }

  async function handleAddProgram(e) {
    e.preventDefault();
    if (!selectedDeptId) {
      setError('Please select a department');
      return;
    }
    if (!progName.trim()) {
      setError('Program name is required');
      return;
    }

    setSubmittingProg(true);
    setError(null);
    try {
      const result = await createProgram({
        departmentId: selectedDeptId,
        name: progName
      });
      setPrograms(prev => [...prev, result.program]);
      setProgName('');
      setSelectedDeptId('');
      setShowProgForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingProg(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Academic Structure</h2>
        <p>Loading academic structure details...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="card">
        <h2>Academic Structure</h2>
        <div className="alert alert-error">
          {error || 'Please configure your Institution first before accessing Academic Structure.'}
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

      {/* Main Structure Workspace */}
      <div className="card" style={{ maxWidth: '100%' }}>
        <h2>Academic Structure Configuration</h2>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Departments Panel */}
        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            Departments
          </h3>

          {departments.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
              No departments configured yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {departments.map(dept => {
                const deptPrograms = programs.filter(p => p.departmentId?._id === dept._id || p.departmentId === dept._id);
                return (
                  <div
                    key={dept._id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{dept.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {deptPrograms.length} {deptPrograms.length === 1 ? 'Program' : 'Programs'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!showDeptForm && (
            <button className="btn btn-secondary" onClick={() => { setShowDeptForm(true); setError(null); }}>
              + Add Department
            </button>
          )}

          {showDeptForm && (
            <form onSubmit={handleAddDepartment} style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', marginTop: '12px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="deptName">Department Name</label>
                <input
                  id="deptName"
                  type="text"
                  placeholder="e.g. Computer Science & Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  disabled={submittingDept}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={submittingDept}>
                  {submittingDept ? 'Creating...' : 'Create Department'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => { setShowDeptForm(false); setDeptName(''); setError(null); }}
                  disabled={submittingDept}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Programs Panel */}
        <section>
          <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
            Programs
          </h3>

          {programs.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
              No programs configured yet.
            </p>
          ) : (
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {programs.map(prog => (
                <li key={prog._id} style={{ fontSize: '14px', color: '#374151' }}>
                  <strong>{prog.name}</strong>{' '}
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    ({prog.departmentId?.name || 'Department Name Loading'})
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!showProgForm && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowProgForm(true);
                setError(null);
                if (departments.length > 0) {
                  setSelectedDeptId(departments[0]._id);
                }
              }}
              disabled={departments.length === 0}
              title={departments.length === 0 ? "Create a department first" : ""}
            >
              + Add Program
            </button>
          )}

          {showProgForm && (
            <form onSubmit={handleAddProgram} style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', marginTop: '12px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="progDept">Department</label>
                <select
                  id="progDept"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  disabled={submittingProg}
                >
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="progName">Program Name</label>
                <input
                  id="progName"
                  type="text"
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  value={progName}
                  onChange={(e) => setProgName(e.target.value)}
                  disabled={submittingProg}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={submittingProg}>
                  {submittingProg ? 'Creating...' : 'Create Program'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => { setShowProgForm(false); setProgName(''); setError(null); }}
                  disabled={submittingProg}
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
