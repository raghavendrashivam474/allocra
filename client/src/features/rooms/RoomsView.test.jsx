import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomsView from './RoomsView';
import * as institutionApi from '../../api/institution';
import * as roomsApi from '../../api/rooms';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/rooms', () => ({
  fetchRooms: vi.fn(),
  createRoom: vi.fn()
}));

describe('RoomsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<RoomsView />);

    expect(screen.getByText(/Loading room details.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your Institution first before accessing Rooms/i)
      ).toBeInTheDocument();
    });
  });

  it('renders empty rooms list with EmptyState', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    roomsApi.fetchRooms.mockResolvedValueOnce({
      rooms: [],
      roomTypes: ['Classroom', 'Laboratory', 'Seminar Room']
    });

    render(<RoomsView />);

    await waitFor(() => {
      expect(screen.getByText(/No rooms configured yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Room/i })).toBeInTheDocument();
    });
  });

  it('allows adding a room', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    roomsApi.fetchRooms.mockResolvedValueOnce({
      rooms: [],
      roomTypes: ['Classroom', 'Laboratory', 'Seminar Room']
    });
    roomsApi.createRoom.mockResolvedValueOnce({
      message: 'Room created successfully',
      room: {
        _id: 'room-1',
        name: 'Room 101',
        type: 'Classroom',
        capacity: 60
      }
    });

    const user = userEvent.setup();
    render(<RoomsView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Room/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Room/i }));
    await user.type(screen.getByLabelText(/Room Identifier \/ Name/i), 'Room 101');
    await user.click(screen.getByRole('button', { name: /Create Room/i }));

    await waitFor(() => {
      expect(roomsApi.createRoom).toHaveBeenCalledWith({
        name: 'Room 101',
        type: 'Classroom',
        capacity: 60
      });
      expect(screen.getByText('Room 101')).toBeInTheDocument();
      expect(screen.getByText('Capacity: 60 seats')).toBeInTheDocument();
    });
  });

  it('displays API error messages', async () => {
    institutionApi.fetchInstitution.mockRejectedValueOnce(new Error('Network error loading data'));

    render(<RoomsView />);

    await waitFor(() => {
      expect(screen.getByText('Network error loading data')).toBeInTheDocument();
    });
  });
});
