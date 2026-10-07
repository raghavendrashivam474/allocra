import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchRooms, createRoom } from '../../api/rooms';
import { Card, Alert, Button, LoadingState, EmptyState } from '../../components/ui';

const DEFAULT_ROOM_TYPES = ['Classroom', 'Laboratory', 'Seminar Room', 'Auditorium', 'Other'];

export default function RoomsView() {
  const [institution, setInstitution] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState(DEFAULT_ROOM_TYPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Classroom');
  const [capacity, setCapacity] = useState('60');
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
        const roomsRes = await fetchRooms();
        setRooms(roomsRes.rooms || []);
        if (roomsRes.roomTypes && roomsRes.roomTypes.length > 0) {
          setRoomTypes(roomsRes.roomTypes);
          setType(roomsRes.roomTypes[0]);
        }
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
  }

  async function handleAddRoom(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    const capNum = parseInt(capacity, 10);
    if (!capacity || isNaN(capNum) || capNum <= 0) {
      setError('Capacity must be a positive integer');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await createRoom({
        name: name.trim(),
        type,
        capacity: capNum
      });
      setRooms(prev => [...prev, result.room]);
      setName('');
      setCapacity('60');
      setType(roomTypes[0] || 'Classroom');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card title="Rooms & Physical Spaces">
        <LoadingState message="Loading room details..." />
      </Card>
    );
  }

  if (!institution) {
    return (
      <Card title="Rooms & Physical Spaces">
        <Alert type="error">
          {error || 'Please configure your Institution first before accessing Rooms.'}
        </Alert>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '650px' }}>
      <Card title="Rooms & Physical Spaces" style={{ maxWidth: '100%' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Action Button */}
        {!showForm && rooms.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <Button
              variant="primary"
              onClick={handleOpenAddForm}
            >
              + Add Room
            </Button>
          </div>
        )}

        {/* Form Panel */}
        {showForm && (
          <form onSubmit={handleAddRoom} className="form-panel" style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>New Room</h4>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="roomName">Room Identifier / Name</label>
              <input
                id="roomName"
                type="text"
                placeholder="e.g. Room 101, Lab C-204"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="roomType">Room Type</label>
              <select
                id="roomType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
              >
                {roomTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="roomCapacity">Capacity (Students)</label>
              <input
                id="roomCapacity"
                type="number"
                min="1"
                placeholder="e.g. 60"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Room'}
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

        {/* Room List or Empty State */}
        {rooms.length === 0 && !showForm ? (
          <EmptyState
            message="No rooms configured yet. Add rooms to define the physical spaces available to the institution."
            actionLabel="+ Add Room"
            onAction={handleOpenAddForm}
          />
        ) : rooms.length > 0 ? (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-text-primary, #0f172a)', marginBottom: '12px', borderBottom: '1px solid var(--color-border, #e2e8f0)', paddingBottom: '6px' }}>
              Available Rooms
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rooms.map(room => (
                <div key={room._id} className="sub-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary, #0f172a)' }}>
                      {room.name}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'var(--color-bg-subtle, #f1f5f9)',
                      color: 'var(--color-text-secondary, #475569)',
                      fontWeight: 500
                    }}>
                      {room.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', marginTop: '4px' }}>
                    Capacity: {room.capacity} seats
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
