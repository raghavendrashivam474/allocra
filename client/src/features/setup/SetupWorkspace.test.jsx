import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupWorkspace from './SetupWorkspace';
import * as setupApi from '../../api/setup';

vi.mock('../../api/setup', () => ({
  fetchReadiness: vi.fn()
}));

describe('SetupWorkspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    setupApi.fetchReadiness.mockReturnValue(new Promise(() => {}));
    render(<SetupWorkspace onNavigate={vi.fn()} />);
    expect(screen.getByText(/Loading setup workspace\.\.\./i)).toBeInTheDocument();
  });

  it('renders error state and allows retry', async () => {
    const user = userEvent.setup();
    setupApi.fetchReadiness
      .mockRejectedValueOnce(new Error('Network error loading setup'))
      .mockResolvedValueOnce({
        ready: false,
        checks: [
          { key: 'institution', label: 'Institution', status: 'incomplete', message: 'No institution has been configured.' }
        ]
      });

    render(<SetupWorkspace onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Network error loading setup')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      const messages = screen.getAllByText(/No institution has been configured\./i);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('renders incomplete configuration with actionable list', async () => {
    setupApi.fetchReadiness.mockResolvedValueOnce({
      ready: false,
      checks: [
        { key: 'institution', label: 'Institution', status: 'complete', message: 'Institution is configured.' },
        { key: 'academic-structure', label: 'Academic Structure', status: 'incomplete', message: 'No department or program has been configured.' },
        { key: 'terms-groups', label: 'Terms & Groups', status: 'incomplete', message: 'No academic term or group has been configured.' },
        { key: 'calendar', label: 'Calendar', status: 'incomplete', message: 'No working days have been configured.' },
        { key: 'time-model', label: 'Time Model', status: 'incomplete', message: 'No time periods have been configured.' }
      ]
    });

    render(<SetupWorkspace onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Configuration Incomplete')).toBeInTheDocument();
      expect(screen.getByText(/4 item\(s\) still need attention/i)).toBeInTheDocument();
    });

    // Check individual card labels are present
    expect(screen.getByText('Academic Structure')).toBeInTheDocument();
    expect(screen.getByText('Time Model')).toBeInTheDocument();

    // Verify messages exist (via getAllByText to allow banner + card duplicates)
    expect(screen.getAllByText('No department or program has been configured.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No academic term or group has been configured.').length).toBeGreaterThan(0);
  });

  it('renders complete configuration when ready: true', async () => {
    setupApi.fetchReadiness.mockResolvedValueOnce({
      ready: true,
      checks: [
        { key: 'institution', label: 'Institution', status: 'complete', message: 'Institution is configured.' },
        { key: 'academic-structure', label: 'Academic Structure', status: 'complete', message: '2 department(s) and 4 program(s) configured.' },
        { key: 'terms-groups', label: 'Terms & Groups', status: 'complete', message: '2 term(s) and 6 group(s) configured.' },
        { key: 'calendar', label: 'Calendar', status: 'complete', message: '5 working day(s) configured.' },
        { key: 'time-model', label: 'Time Model', status: 'complete', message: '8 period(s) and 2 break(s) configured.' }
      ]
    });

    render(<SetupWorkspace onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Configuration Ready')).toBeInTheDocument();
      expect(screen.getByText(/Your institution has the foundational academic, calendar, and time configuration/i)).toBeInTheDocument();
    });

    // All badges should show Configured
    const badges = screen.getAllByText('✓ Configured');
    expect(badges).toHaveLength(5);
  });

  it('calls onNavigate with target tab when Configure or Manage is clicked', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();

    setupApi.fetchReadiness.mockResolvedValueOnce({
      ready: false,
      checks: [
        { key: 'institution', label: 'Institution', status: 'complete', message: 'Institution is configured.' },
        { key: 'academic-structure', label: 'Academic Structure', status: 'incomplete', message: 'No program configured.' }
      ]
    });

    render(<SetupWorkspace onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Institution')).toBeInTheDocument();
    });

    // Manage button for complete item
    const manageBtn = screen.getByRole('button', { name: /Manage/i });
    await user.click(manageBtn);
    expect(handleNavigate).toHaveBeenCalledWith('institution');

    // Configure button for incomplete item
    const configureBtn = screen.getByRole('button', { name: /Configure/i });
    await user.click(configureBtn);
    expect(handleNavigate).toHaveBeenCalledWith('academic-structure');
  });
});
