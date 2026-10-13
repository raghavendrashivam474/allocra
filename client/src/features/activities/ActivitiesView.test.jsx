import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivitiesView from './ActivitiesView';
import * as institutionApi from '../../api/institution';
import * as academicContextApi from '../../api/academicContext';
import * as activitiesApi from '../../api/activities';
import * as facultyApi from '../../api/faculty';
import * as roomsApi from '../../api/rooms';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/academicContext', () => ({
  fetchGroups: vi.fn()
}));

vi.mock('../../api/activities', () => ({
  fetchActivities: vi.fn(),
  createActivity: vi.fn(),
  updateActivityRelationships: vi.fn()
}));

vi.mock('../../api/faculty', () => ({
  fetchFaculty: vi.fn()
}));

vi.mock('../../api/rooms', () => ({
  fetchRooms: vi.fn()
}));

const MOCK_INSTITUTION = { _id: 'inst-1', name: 'MIT', academicYear: '2026' };
const MOCK_GROUPS = [{ _id: 'grp-1', name: 'CS-A' }];
const MOCK_FACULTY = [
  { _id: 'fac-1', name: 'Dr. Alan Turing', departmentId: { _id: 'dept-1', name: 'CS' } },
  { _id: 'fac-2', name: 'Dr. Grace Hopper', departmentId: { _id: 'dept-1', name: 'CS' } }
];
const MOCK_ROOMS = [
  { _id: 'room-1', name: 'Lab 101', type: 'Laboratory', capacity: 30 },
  { _id: 'room-2', name: 'LH 201', type: 'Classroom', capacity: 60 }
];

function setupDefaultMocks(overrides = {}) {
  institutionApi.fetchInstitution.mockResolvedValue(
    overrides.institution ?? { institution: MOCK_INSTITUTION }
  );
  academicContextApi.fetchGroups.mockResolvedValue(
    overrides.groups ?? { groups: MOCK_GROUPS }
  );
  activitiesApi.fetchActivities.mockResolvedValue(
    overrides.activities ?? { activities: [] }
  );
  facultyApi.fetchFaculty.mockResolvedValue(
    overrides.faculty ?? { faculty: MOCK_FACULTY }
  );
  roomsApi.fetchRooms.mockResolvedValue(
    overrides.rooms ?? { rooms: MOCK_ROOMS }
  );
}

describe('ActivitiesView Component — S2.3 Baseline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt if institution is not configured yet', async () => {
    setupDefaultMocks({ institution: { institution: null } });

    render(<ActivitiesView />);

    expect(screen.getByText(/Loading academic activities.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your institution first before creating activities/i)
      ).toBeInTheDocument();
    });
  });

  it('renders empty activities list with EmptyState when groups exist', async () => {
    setupDefaultMocks();

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByText(/No Activities Defined/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Activity/i })).toBeInTheDocument();
    });
  });

  it('warns when no groups are configured', async () => {
    setupDefaultMocks({ groups: { groups: [] } });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(
        screen.getByText(/No academic groups found\. Please configure academic terms and groups/i)
      ).toBeInTheDocument();
    });
  });

  it('allows adding an academic activity', async () => {
    const user = userEvent.setup();
    setupDefaultMocks();

    activitiesApi.fetchActivities
      .mockResolvedValueOnce({ activities: [] })
      .mockResolvedValueOnce({
        activities: [{ _id: 'act-1', name: 'Algorithms', groupId: { _id: 'grp-1', name: 'CS-A' }, facultyIds: [], roomIds: [] }]
      });
    activitiesApi.createActivity.mockResolvedValueOnce({
      message: 'Activity created successfully',
      activity: { _id: 'act-1', name: 'Algorithms', groupId: 'grp-1', facultyIds: [], roomIds: [] }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Activity/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Activity/i }));

    expect(screen.getByText(/Add Academic Activity/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: /group \/ cohort/i }), 'grp-1');
    await user.type(screen.getByPlaceholderText(/e\.g\. Data Structures/i), 'Algorithms');
    await user.click(screen.getByRole('button', { name: /Save Activity/i }));

    await waitFor(() => {
      expect(activitiesApi.createActivity).toHaveBeenCalledWith({
        groupId: 'grp-1',
        name: 'Algorithms'
      });
      expect(screen.getByText('Algorithms')).toBeInTheDocument();
      expect(screen.getByText(/CS-A/i)).toBeInTheDocument();
    });
  });
});

describe('ActivitiesView Component — S2.4 Relationships', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays faculty and room counts on activity cards', async () => {
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Data Structures',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [{ _id: 'fac-1', name: 'Dr. Alan Turing' }],
          roomIds: [{ _id: 'room-1', name: 'Lab 101' }, { _id: 'room-2', name: 'LH 201' }]
        }]
      }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('1 Faculty')).toBeInTheDocument();
      expect(screen.getByText('2 Rooms')).toBeInTheDocument();
    });
  });

  it('opens the relationship editor when Configure Resources is clicked', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [],
          roomIds: []
        }]
      }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      expect(screen.getByText(/Configure Resources — Algorithms/i)).toBeInTheDocument();
      expect(screen.getByText(/Eligible Faculty/i)).toBeInTheDocument();
      expect(screen.getByText(/Eligible Rooms/i)).toBeInTheDocument();
    });
  });

  it('pre-selects existing relationships when opening the editor', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [{ _id: 'fac-1', name: 'Dr. Alan Turing' }],
          roomIds: [{ _id: 'room-2', name: 'LH 201' }]
        }]
      }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      const facultyCheckboxes = screen.getAllByRole('checkbox');
      // fac-1 checked, fac-2 unchecked, room-1 unchecked, room-2 checked
      const checkedBoxes = facultyCheckboxes.filter(cb => cb.checked);
      expect(checkedBoxes).toHaveLength(2);
    });
  });

  it('sends correct payload when saving relationships', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [],
          roomIds: []
        }]
      }
    });

    activitiesApi.updateActivityRelationships.mockResolvedValueOnce({
      message: 'Activity relationships updated successfully',
      activity: {
        _id: 'act-1',
        name: 'Algorithms',
        groupId: { _id: 'grp-1', name: 'CS-A' },
        facultyIds: [{ _id: 'fac-1', name: 'Dr. Alan Turing' }],
        roomIds: [{ _id: 'room-1', name: 'Lab 101' }]
      }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      expect(screen.getByText(/Eligible Faculty/i)).toBeInTheDocument();
    });

    // Check one faculty and one room
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // fac-1
    await user.click(checkboxes[2]); // room-1

    await user.click(screen.getByRole('button', { name: /Save Relationships/i }));

    await waitFor(() => {
      expect(activitiesApi.updateActivityRelationships).toHaveBeenCalledWith('act-1', {
        facultyIds: ['fac-1'],
        roomIds: ['room-1']
      });
    });
  });

  it('sends empty arrays when all checkboxes are unchecked (intentional clear)', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [{ _id: 'fac-1', name: 'Dr. Alan Turing' }],
          roomIds: [{ _id: 'room-1', name: 'Lab 101' }]
        }]
      }
    });

    activitiesApi.updateActivityRelationships.mockResolvedValueOnce({
      message: 'Activity relationships updated successfully',
      activity: {
        _id: 'act-1',
        name: 'Algorithms',
        groupId: { _id: 'grp-1', name: 'CS-A' },
        facultyIds: [],
        roomIds: []
      }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      expect(screen.getByText(/Eligible Faculty/i)).toBeInTheDocument();
    });

    // Uncheck the pre-selected faculty and room
    const checkboxes = screen.getAllByRole('checkbox');
    const checkedBoxes = checkboxes.filter(cb => cb.checked);
    for (const cb of checkedBoxes) {
      await user.click(cb);
    }

    await user.click(screen.getByRole('button', { name: /Save Relationships/i }));

    await waitFor(() => {
      expect(activitiesApi.updateActivityRelationships).toHaveBeenCalledWith('act-1', {
        facultyIds: [],
        roomIds: []
      });
    });
  });

  it('displays error when save fails and does not show success', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [],
          roomIds: []
        }]
      }
    });

    activitiesApi.updateActivityRelationships.mockRejectedValueOnce(
      new Error('One or more faculty members not found')
    );

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      expect(screen.getByText(/Eligible Faculty/i)).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    await user.click(screen.getByRole('button', { name: /Save Relationships/i }));

    await waitFor(() => {
      expect(screen.getByText(/One or more faculty members not found/i)).toBeInTheDocument();
      expect(screen.queryByText(/Relationships updated successfully/i)).not.toBeInTheDocument();
    });
  });

  it('closes the editor when Cancel is clicked', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [],
          roomIds: []
        }]
      }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      expect(screen.getByText(/Configure Resources — Algorithms/i)).toBeInTheDocument();
    });

    // Find the Cancel button inside the relationship editor card
    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText(/Configure Resources — Algorithms/i)).not.toBeInTheDocument();
    });
  });

  it('shows empty state messages when no faculty or rooms exist', async () => {
    const user = userEvent.setup();
    setupDefaultMocks({
      activities: {
        activities: [{
          _id: 'act-1',
          name: 'Algorithms',
          groupId: { _id: 'grp-1', name: 'CS-A' },
          facultyIds: [],
          roomIds: []
        }]
      },
      faculty: { faculty: [] },
      rooms: { rooms: [] }
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Configure Resources/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Configure Resources/i }));

    await waitFor(() => {
      expect(screen.getByText(/No faculty members available/i)).toBeInTheDocument();
      expect(screen.getByText(/No rooms available/i)).toBeInTheDocument();
    });
  });

  it('handles loading state on initial render', async () => {
    setupDefaultMocks();

    render(<ActivitiesView />);

    expect(screen.getByText(/Loading academic activities.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading academic activities.../i)).not.toBeInTheDocument();
    });
  });
});

