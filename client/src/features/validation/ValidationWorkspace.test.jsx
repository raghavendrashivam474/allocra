import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ValidationWorkspace from './ValidationWorkspace';
import * as validationApi from '../../api/validation';

vi.mock('../../api/validation');

describe('ValidationWorkspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    validationApi.fetchValidation.mockReturnValue(new Promise(() => {}));
    render(<ValidationWorkspace />);
    expect(screen.getByText(/Evaluating configuration readiness.../i)).toBeInTheDocument();
  });

  it('renders error state and allows retry', async () => {
    validationApi.fetchValidation.mockRejectedValueOnce(new Error('Network error'));
    render(<ValidationWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    validationApi.fetchValidation.mockResolvedValueOnce({
      summary: {
        status: 'ready',
        activityCount: 1,
        validActivityCount: 1,
        errorCount: 0,
        warningCount: 0
      },
      findings: []
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Configuration Ready')).toBeInTheDocument();
    });
  });

  it('renders not_configured state with link to Setup Workspace', async () => {
    validationApi.fetchValidation.mockResolvedValueOnce({
      summary: {
        status: 'not_configured',
        activityCount: 0,
        validActivityCount: 0,
        errorCount: 0,
        warningCount: 0
      },
      findings: []
    });

    const onNavigate = vi.fn();
    render(<ValidationWorkspace onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Institution Not Configured')).toBeInTheDocument();
      expect(screen.getByText(/Configure your institution first via the Setup Workspace/i)).toBeInTheDocument();
    });

    const setupBtn = screen.getByRole('button', { name: /Go to Setup Workspace/i });
    fireEvent.click(setupBtn);
    expect(onNavigate).toHaveBeenCalledWith('setup');
  });

  it('renders no_activities state appropriately', async () => {
    validationApi.fetchValidation.mockResolvedValueOnce({
      summary: {
        status: 'no_activities',
        activityCount: 0,
        validActivityCount: 0,
        errorCount: 0,
        warningCount: 0
      },
      findings: []
    });

    render(<ValidationWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('No Activities Configured')).toBeInTheDocument();
      expect(screen.getByText(/No activities have been created yet/i)).toBeInTheDocument();
    });
  });

  it('renders ready state with all-clear message and count summary', async () => {
    validationApi.fetchValidation.mockResolvedValueOnce({
      summary: {
        status: 'ready',
        activityCount: 2,
        validActivityCount: 2,
        errorCount: 0,
        warningCount: 0
      },
      findings: []
    });

    render(<ValidationWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Configuration Ready')).toBeInTheDocument();
      expect(screen.getByText(/All 2 activities satisfy the defined readiness rules/i)).toBeInTheDocument();
      expect(screen.getByText('All Clear')).toBeInTheDocument();
      expect(screen.getByText(/No configuration issues detected/i)).toBeInTheDocument();
    });

    // Check count cards
    expect(screen.getByText('Activities Evaluated')).toBeInTheDocument();
    expect(screen.getByText('Valid Activities')).toBeInTheDocument();
  });

  it('renders needs_attention state with findings and actionable buttons', async () => {
    validationApi.fetchValidation.mockResolvedValueOnce({
      summary: {
        status: 'needs_attention',
        activityCount: 3,
        validActivityCount: 1,
        errorCount: 2,
        warningCount: 0
      },
      findings: [
        {
          code: 'ACTIVITY_NO_ELIGIBLE_FACULTY',
          severity: 'error',
          entityType: 'activity',
          entityId: 'act-1',
          entityName: 'Mathematics',
          message: 'No eligible faculty members are configured.',
          action: { type: 'configure_activity_resources' }
        },
        {
          code: 'ACTIVITY_NO_ELIGIBLE_ROOMS',
          severity: 'error',
          entityType: 'activity',
          entityId: 'act-2',
          entityName: 'Physics',
          message: 'No eligible rooms are configured.',
          action: { type: 'configure_activity_resources' }
        }
      ]
    });

    const onNavigate = vi.fn();
    render(<ValidationWorkspace onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      expect(screen.getByText(/2 of 3 activities need configuration/i)).toBeInTheDocument();
    });

    // Findings verification
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Mathematics').closest('.finding-error')).toBeInTheDocument();
    expect(screen.getByText('No eligible faculty members are configured.')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('No eligible rooms are configured.')).toBeInTheDocument();

    // Action button clicks
    const configBtns = screen.getAllByRole('button', { name: /Configure Resources/i });
    expect(configBtns).toHaveLength(2);
    fireEvent.click(configBtns[0]);
    expect(onNavigate).toHaveBeenCalledWith('activities');
  });

  it('allows re-checking validation via the Re-check button', async () => {
    validationApi.fetchValidation.mockResolvedValue({
      summary: {
        status: 'ready',
        activityCount: 1,
        validActivityCount: 1,
        errorCount: 0,
        warningCount: 0
      },
      findings: []
    });

    render(<ValidationWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Configuration Ready')).toBeInTheDocument();
    });

    const recheckBtn = screen.getByRole('button', { name: /Re-check/i });
    fireEvent.click(recheckBtn);

    await waitFor(() => {
      expect(validationApi.fetchValidation).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to management views via bottom shortcuts', async () => {
    validationApi.fetchValidation.mockResolvedValueOnce({
      summary: {
        status: 'ready',
        activityCount: 1,
        validActivityCount: 1,
        errorCount: 0,
        warningCount: 0
      },
      findings: []
    });

    const onNavigate = vi.fn();
    render(<ValidationWorkspace onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Configuration Ready')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Manage Activities/i }));
    expect(onNavigate).toHaveBeenCalledWith('activities');

    fireEvent.click(screen.getByRole('button', { name: /Manage Faculty/i }));
    expect(onNavigate).toHaveBeenCalledWith('faculty');

    fireEvent.click(screen.getByRole('button', { name: /Manage Rooms/i }));
    expect(onNavigate).toHaveBeenCalledWith('rooms');
  });
});
