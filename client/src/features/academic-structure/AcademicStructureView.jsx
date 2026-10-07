import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import {
  fetchDepartments,
  createDepartment,
  fetchPrograms,
  createProgram
} from '../../api/academicStructure';
import { Card, Alert, Button, LoadingState } from '../../components/ui';

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
      <Card title="Academic Structure">
        <LoadingState message="Loading academic structure details..." />
      </Card>
    );
  }

  if (!institution) {
    return (
      <Card title="Academic Structure">
        <Alert type="error">
          {error || 'Please configure your Institution first before accessing Academic Structure.'}
        </Alert>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '650px' }}>
      {/* Institution Context Header */}
      <Card title="Active Institution" style={{ maxWidth: '100%' }}>
        <div className="info-group">
          <span className="info-label">Name</span>
          <span className="info-value">{institution.name}</span>
        </div>
        <div className="info-group" style={{ marginBottom: 0 }}>
          <span className="info-label">Academic Year</span>
          <span className="info-value">{institution.academicYear}</span>
        </div>
      </Card>

      {/* Main Structure Workspace */}
      <Card title="Academic Structure Configuration" style={{ maxWidth: '100%' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Departments Panel */}
        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--color-text-primary, #0f172a)', marginBottom: '12px', borderBottom: '1px solid var(--color-border, #e2e8f0)', paddingBottom: '6px' }}>
            Departments
          </h3>
          {departments.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '14px', marginBottom: '12px' }}>
              No departments configured yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {departments.map(dept => {
                const deptPrograms = programs.filter(p => p.departmentId?._id === dept._id || p.departmentId === dept._id);
                return (
                  <div
                    key={dept._id}
                    className="sub-card"
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary, #0f172a)' }}>{dept.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                      {deptPrograms.length} {deptPrograms.length === 1 ? 'Program' : 'Programs'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!showDeptForm && (
            <Button variant="secondary" onClick={() => { setShowDeptForm(true); setError(null); }}>
              + Add Department
            </Button>
          )}

          {showDeptForm && (
            <form onSubmit={handleAddDepartment} className="form-panel">
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
                <Button type="submit" variant="primary" size="sm" disabled={submittingDept}>
                  {submittingDept ? 'Creating...' : 'Create Department'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowDeptForm(false); setDeptName(''); setError(null); }}
                  disabled={submittingDept}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Programs Panel */}
        <section>
          <h3 style={{ fontSize: '15px', color: 'var(--color-text-primary, #0f172a)', marginBottom: '12px', borderBottom: '1px solid var(--color-border, #e2e8f0)', paddingBottom: '6px' }}>
            Programs
          </h3>
          {programs.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '14px', marginBottom: '12px' }}>
              No programs configured yet.
            </p>
          ) : (
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {programs.map(prog => (
                <li key={prog._id} style={{ fontSize: '14px', color: 'var(--color-text-secondary, #475569)' }}>
                  <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{prog.name}</strong>{' '}
                  <span style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '13px' }}>
                    ({prog.departmentId?.name || 'Department Name Loading'})
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!showProgForm && (
            <Button
              variant="secondary"
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
            </Button>
          )}

          {showProgForm && (
            <form onSubmit={handleAddProgram} className="form-panel">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="progDept">Department</label>
                <select
                  id="progDept"
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
                <Button type="submit" variant="primary" size="sm" disabled={submittingProg}>
                  {submittingProg ? 'Creating...' : 'Create Program'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowProgForm(false); setProgName(''); setError(null); }}
                  disabled={submittingProg}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </section>
      </Card>
    </div>
  );
}
