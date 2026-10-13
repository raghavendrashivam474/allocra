import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchGroups } from '../../api/academicContext';
import { fetchActivities, createActivity } from '../../api/activities';
import { Card, Alert, Button, LoadingState, EmptyState, PageHeader } from '../../components/ui';

export default function ActivitiesView() {
  const [institution, setInstitution] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
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
        const [groupsRes, activitiesRes] = await Promise.all([
          fetchGroups(),
          fetchActivities()
        ]);
        setGroups(groupsRes.groups || []);
        setActivities(activitiesRes.activities || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !selectedGroupId) return;

    setSubmitting(true);
    setError(null);
    try {
      await createActivity({
        name: name.trim(),
        groupId: selectedGroupId
      });
      setName('');
      setSelectedGroupId('');
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading academic activities..." />;
  }

  if (!institution) {
    return (
      <div className="allocra-view-container">
        <PageHeader
          title="Activities"
          description="Define academic activities and subjects for allocation."
        />
        <EmptyState
          message="Please configure your institution first before creating activities."
        />
      </div>
    );
  }

  return (
    <div className="allocra-view-container">
      <PageHeader
        title="Academic Activities"
        description="Define subjects, courses, and lecture units attached to academic groups."
      />

      {error && <Alert type="error">{error}</Alert>}

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Total Activities: <strong>{activities.length}</strong>
          </span>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            disabled={groups.length === 0}
            onClick={() => setShowForm(true)}
          >
            + Add Activity
          </Button>
        )}
      </div>

      {groups.length === 0 && (
        <Alert type="warning" style={{ marginBottom: '1.5rem' }}>
          No academic groups found. Please configure academic terms and groups before adding activities.
        </Alert>
      )}

      {showForm && (
        <Card title="Add Academic Activity" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Group / Cohort *
                </label>
                <select
                  aria-label="Group / Cohort"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select a Group...</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Activity Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures, OS Lab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Activity'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activities.length === 0 ? (
        <EmptyState
          message="No Activities Defined. Create your first academic activity to associate with groups."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {activities.map((act) => (
            <Card key={act._id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  {act.name}
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Group: <strong>{act.groupId?.name || 'Unknown Group'}</strong>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
