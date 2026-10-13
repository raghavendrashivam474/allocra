import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchGroups } from '../../api/academicContext';
import { fetchActivities, createActivity, updateActivityRelationships } from '../../api/activities';
import { fetchFaculty } from '../../api/faculty';
import { fetchRooms } from '../../api/rooms';
import { Card, Alert, Button, LoadingState, EmptyState, PageHeader } from '../../components/ui';

export default function ActivitiesView() {
  const [institution, setInstitution] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Relationship editor state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [savingRelationships, setSavingRelationships] = useState(false);
  const [relationshipSuccess, setRelationshipSuccess] = useState(null);

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
        const [groupsRes, activitiesRes, facultyRes, roomsRes] = await Promise.all([
          fetchGroups(),
          fetchActivities(),
          fetchFaculty(),
          fetchRooms()
        ]);
        setGroups(groupsRes.groups || []);
        setActivities(activitiesRes.activities || []);
        setAllFaculty(facultyRes.faculty || []);
        setAllRooms(roomsRes.rooms || []);
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

  function handleConfigureActivity(activity) {
    setSelectedActivity(activity);
    setSelectedFacultyIds((activity.facultyIds || []).map(f => f._id));
    setSelectedRoomIds((activity.roomIds || []).map(r => r._id));
    setRelationshipSuccess(null);
    setError(null);
  }

  function handleCancelConfigure() {
    setSelectedActivity(null);
    setSelectedFacultyIds([]);
    setSelectedRoomIds([]);
    setRelationshipSuccess(null);
  }

  function toggleFaculty(facultyId) {
    setSelectedFacultyIds(prev =>
      prev.includes(facultyId)
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  }

  function toggleRoom(roomId) {
    setSelectedRoomIds(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  }

  async function handleSaveRelationships() {
    if (!selectedActivity) return;
    setSavingRelationships(true);
    setError(null);
    setRelationshipSuccess(null);
    try {
      const result = await updateActivityRelationships(selectedActivity._id, {
        facultyIds: selectedFacultyIds,
        roomIds: selectedRoomIds
      });
      setRelationshipSuccess('Relationships updated successfully');
      setActivities(prev => prev.map(a =>
        a._id === selectedActivity._id ? result.activity : a
      ));
      setTimeout(() => {
        setSelectedActivity(null);
        setRelationshipSuccess(null);
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRelationships(false);
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
      {relationshipSuccess && <Alert type="success">{relationshipSuccess}</Alert>}

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

      {/* Relationship Editor */}
      {selectedActivity && (
        <Card title={`Configure Resources — ${selectedActivity.name}`} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Faculty Selection */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary, #0f172a)' }}>
                Eligible Faculty ({selectedFacultyIds.length})
              </h4>
              {allFaculty.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)', padding: '8px 0' }}>
                  No faculty members available. Add faculty in the Faculty tab first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {allFaculty.map(f => (
                    <label
                      key={f._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '13px',
                        background: selectedFacultyIds.includes(f._id) ? 'var(--color-bg-subtle, #f1f5f9)' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFacultyIds.includes(f._id)}
                        onChange={() => toggleFaculty(f._id)}
                        disabled={savingRelationships}
                      />
                      <span style={{ fontWeight: 500 }}>{f.name}</span>
                      <span style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '12px' }}>
                        {f.departmentId?.name || ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Room Selection */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary, #0f172a)' }}>
                Eligible Rooms ({selectedRoomIds.length})
              </h4>
              {allRooms.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)', padding: '8px 0' }}>
                  No rooms available. Add rooms in the Rooms tab first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {allRooms.map(r => (
                    <label
                      key={r._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '13px',
                        background: selectedRoomIds.includes(r._id) ? 'var(--color-bg-subtle, #f1f5f9)' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoomIds.includes(r._id)}
                        onChange={() => toggleRoom(r._id)}
                        disabled={savingRelationships}
                      />
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      <span style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '12px' }}>
                        {r.type} · {r.capacity} seats
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={handleCancelConfigure} disabled={savingRelationships}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSaveRelationships} disabled={savingRelationships}>
              {savingRelationships ? 'Saving...' : 'Save Relationships'}
            </Button>
          </div>
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
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
                    background: 'var(--color-bg-subtle, #f1f5f9)', color: 'var(--color-text-secondary, #475569)', fontWeight: 500
                  }}>
                    {(act.facultyIds || []).length} Faculty
                  </span>
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
                    background: 'var(--color-bg-subtle, #f1f5f9)', color: 'var(--color-text-secondary, #475569)', fontWeight: 500
                  }}>
                    {(act.roomIds || []).length} Rooms
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleConfigureActivity(act)}
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                >
                  Configure Resources
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
