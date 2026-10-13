import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivitiesView from './ActivitiesView';
import * as institutionApi from '../../api/institution';
import * as academicContextApi from '../../api/academicContext';
import * as activitiesApi from '../../api/activities';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/academicContext', () => ({
  fetchGroups: vi.fn()
}));

vi.mock('../../api/activities', () => ({
  fetchActivities: vi.fn(),
  createActivity: vi.fn()
}));

describe('ActivitiesView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<ActivitiesView />);

    expect(screen.getByText(/Loading academic activities.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your institution first before creating activities/i)
      ).toBeInTheDocument();
    });
  });

  it('renders empty activities list with EmptyState when groups exist', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    academicContextApi.fetchGroups.mockResolvedValueOnce({
      groups: [{ _id: 'grp-1', name: 'CS-A' }]
    });
    activitiesApi.fetchActivities.mockResolvedValueOnce({
      activities: []
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(screen.getByText(/No Activities Defined/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Activity/i })).toBeInTheDocument();
    });
  });

  it('warns when no groups are configured', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    academicContextApi.fetchGroups.mockResolvedValueOnce({
      groups: []
    });
    activitiesApi.fetchActivities.mockResolvedValueOnce({
      activities: []
    });

    render(<ActivitiesView />);

    await waitFor(() => {
      expect(
        screen.getByText(/No academic groups found\. Please configure academic terms and groups/i)
      ).toBeInTheDocument();
    });
  });

  it('allows adding an academic activity', async () => {
    const user = userEvent.setup();

    institutionApi.fetchInstitution.mockResolvedValue({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    academicContextApi.fetchGroups.mockResolvedValue({
      groups: [{ _id: 'grp-1', name: 'CS-A' }]
    });
    activitiesApi.fetchActivities
      .mockResolvedValueOnce({ activities: [] })
      .mockResolvedValueOnce({
        activities: [{ _id: 'act-1', name: 'Algorithms', groupId: { _id: 'grp-1', name: 'CS-A' } }]
      });
    activitiesApi.createActivity.mockResolvedValueOnce({
      message: 'Activity created successfully',
      activity: { _id: 'act-1', name: 'Algorithms', groupId: 'grp-1' }
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
