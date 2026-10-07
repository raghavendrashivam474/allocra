import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchDepartments } from '../../api/academicStructure';
import { fetchFaculty, createFaculty } from '../../api/faculty';
import { Card, Alert, Button, LoadingState, EmptyState } from '../../components/ui';

export default function FacultyView() {
  const [institution, setInstitution] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        const [deptsRes, facultyRes] = await Promise.all([
          fetchDepartments(),
          fetchFaculty()
        ]);
        setDepartments(deptsRes.departments || []);
        setFaculty(facultyRes.faculty || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAddForm() {
    setShowForm(true);
    setError(null);
    if (departments.length > 0) {
      setSelectedDeptId(departments[0]._id);
    }
  }

  async function handleAddFaculty(e) {
    e.preventDefault();
    if (!selectedDeptId) {
      setError('Please select a department');
      return;
    }
    if (!name.trim()) {
      setError('Faculty name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createFaculty({
        departmentId: selectedDeptId,
        name: name
      });
      setFaculty(prev => [...prev, result.faculty]);
      setName('');
      setSelectedDeptId(departments[0]?._id || '');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card title="Faculty">
        <LoadingState message="Loading faculty details..." />
      </Card>
    );
  }

  if (!institution) {
    return (
      <Card title="Faculty">
        <Alert type="error">
          {error || 'Please configure your Institution first before accessing Faculty.'}
        </Alert>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '650px' }}>
      <Card title="Faculty Management" style={{ maxWidth: '100%' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Action button if not adding and list has items */}
        {!showForm && faculty.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <Button
              variant="primary"
              onClick={handleOpenAddForm}
              disabled={departments.length === 0}
            >
              + Add Faculty Member
            </Button>
          </div>
        )}

        {/* Form Panel */}
        {showForm && (
          <form onSubmit={handleAddFaculty} className="form-panel" style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>New Faculty Member</h4>
            
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="facultyName">Faculty Name</label>
              <input
                id="facultyName"
                type="text"
                placeholder="e.g. Dr. Alan Turing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="facultyDept">Department</label>
              <select
                id="facultyDept"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                disabled={submitting}
              >
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Faculty'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setShowForm(false); setName(''); setError(null); }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Faculty List or Empty State */}
        {faculty.length === 0 && !showForm ? (
          <EmptyState
            message="No faculty members yet. Add faculty members to begin configuring the institution's teaching resources."
            actionLabel="+ Add Faculty Member"
            onAction={handleOpenAddForm}
            actionDisabled={departments.length === 0}
          />
        ) : faculty.length > 0 ? (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-text-primary, #0f172a)', marginBottom: '12px', borderBottom: '1px solid var(--color-border, #e2e8f0)', paddingBottom: '6px' }}>
              Faculty Members
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {faculty.map(member => (
                <div key={member._id} className="sub-card">
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary, #0f172a)' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                    Department: {member.departmentId?.name || 'Loading...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
