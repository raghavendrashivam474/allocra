import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeModelView from './TimeModelView';
import * as institutionApi from '../../api/institution';
import * as timeModelApi from '../../api/timeModel';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/timeModel', () => ({
  fetchTimeModel: vi.fn(),
  saveTimeModel: vi.fn()
}));

describe('TimeModelView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    institutionApi.fetchInstitution.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<TimeModelView />);
    expect(screen.getByText(/Loading time model details.../i)).toBeInTheDocument();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<TimeModelView />);

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your Institution first before accessing Time Model Configuration/i)
      ).toBeInTheDocument();
    });
  });

  it('renders unconfigured time model with default periods and breaks templates', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    timeModelApi.fetchTimeModel.mockResolvedValueOnce({ timeModel: null });

    render(<TimeModelView />);

    await waitFor(() => {
      expect(screen.getByText('MIT')).toBeInTheDocument();
      expect(screen.getByText('2026-27')).toBeInTheDocument();

      // Check default periods loaded using aria-labels to avoid sharing/duplicate value issues
      expect(screen.getByLabelText('Period 1 Name')).toHaveValue('Period 1');
      expect(screen.getByLabelText('Period 1 Start Time')).toHaveValue('09:00');
      expect(screen.getByLabelText('Period 1 End Time')).toHaveValue('09:50');

      expect(screen.getByLabelText('Period 2 Name')).toHaveValue('Period 2');
      expect(screen.getByLabelText('Period 2 Start Time')).toHaveValue('09:50');
      expect(screen.getByLabelText('Period 2 End Time')).toHaveValue('10:40');

      expect(screen.getByLabelText('Period 3 Name')).toHaveValue('Period 3');
      expect(screen.getByLabelText('Period 3 Start Time')).toHaveValue('11:00');
      expect(screen.getByLabelText('Period 3 End Time')).toHaveValue('11:50');

      // Check default break template loaded in inputs
      expect(screen.getByLabelText('Break 1 Name')).toHaveValue('Break');
      expect(screen.getByLabelText('Break 1 Start Time')).toHaveValue('10:40');
      expect(screen.getByLabelText('Break 1 End Time')).toHaveValue('11:00');
    });
  });

  it('loads and renders existing configuration from backend database', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    timeModelApi.fetchTimeModel.mockResolvedValueOnce({
      timeModel: {
        periods: [
          { name: 'Morning Lesson 1', startTime: '08:00', endTime: '09:00' }
        ],
        breaks: [
          { name: 'Tea Time', startTime: '09:00', endTime: '09:15' }
        ]
      }
    });

    render(<TimeModelView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Period 1 Name')).toHaveValue('Morning Lesson 1');
      expect(screen.getByLabelText('Period 1 Start Time')).toHaveValue('08:00');
      expect(screen.getByLabelText('Period 1 End Time')).toHaveValue('09:00');

      expect(screen.getByLabelText('Break 1 Name')).toHaveValue('Tea Time');
      expect(screen.getByLabelText('Break 1 Start Time')).toHaveValue('09:00');
      expect(screen.getByLabelText('Break 1 End Time')).toHaveValue('09:15');
    });
  });

  it('allows adding, editing, and removing periods and breaks', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    timeModelApi.fetchTimeModel.mockResolvedValueOnce({
      timeModel: {
        periods: [{ name: 'P1', startTime: '09:00', endTime: '09:50' }],
        breaks: []
      }
    });

    const user = userEvent.setup();
    render(<TimeModelView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Period 1 Name')).toHaveValue('P1');
    });

    // Add a Period
    const addPeriodButton = screen.getByRole('button', { name: /\+ Add Period/i });
    await user.click(addPeriodButton);

    const p2NameInput = screen.getByRole('textbox', { name: /Period 2 Name/i });
    const p2StartInput = screen.getByRole('textbox', { name: /Period 2 Start Time/i });
    const p2EndInput = screen.getByRole('textbox', { name: /Period 2 End Time/i });

    await user.clear(p2NameInput);
    await user.type(p2NameInput, 'P2');
    await user.type(p2StartInput, '09:50');
    await user.type(p2EndInput, '10:40');

    expect(screen.getByLabelText('Period 2 Name')).toHaveValue('P2');

    // Add a Break
    const addBreakButton = screen.getByRole('button', { name: /\+ Add Break/i });
    await user.click(addBreakButton);

    const b1NameInput = screen.getByRole('textbox', { name: /Break 1 Name/i });
    const b1StartInput = screen.getByRole('textbox', { name: /Break 1 Start Time/i });
    const b1EndInput = screen.getByRole('textbox', { name: /Break 1 End Time/i });

    await user.clear(b1NameInput);
    await user.type(b1NameInput, 'Coffee');
    await user.type(b1StartInput, '10:40');
    await user.type(b1EndInput, '11:00');

    expect(screen.getByLabelText('Break 1 Name')).toHaveValue('Coffee');

    // Remove P1
    const removeP1Button = screen.getByRole('button', { name: /Remove Period 1/i });
    await user.click(removeP1Button);

    expect(screen.queryByLabelText('P1')).not.toBeInTheDocument();
  });

  it('performs local UI validation and blocks overlapping configs before sending API request', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    timeModelApi.fetchTimeModel.mockResolvedValueOnce({
      timeModel: {
        periods: [
          { name: 'P1', startTime: '09:00', endTime: '10:00' },
          { name: 'P2', startTime: '09:30', endTime: '10:30' } // overlap
        ],
        breaks: []
      }
    });

    const user = userEvent.setup();
    render(<TimeModelView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Period 1 Name')).toHaveValue('P1');
    });

    const saveButton = screen.getByRole('button', { name: /Save Time Model/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/overlaps with/i)).toBeInTheDocument();
      expect(timeModelApi.saveTimeModel).not.toHaveBeenCalled();
    });
  });

  it('saves correctly and displays success message on successful API response', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    timeModelApi.fetchTimeModel.mockResolvedValueOnce({
      timeModel: {
        periods: [{ name: 'P1', startTime: '09:00', endTime: '09:50' }],
        breaks: [{ name: 'Interval', startTime: '09:50', endTime: '10:10' }]
      }
    });
    timeModelApi.saveTimeModel.mockResolvedValueOnce({
      message: 'Time model saved successfully',
      timeModel: {
        periods: [{ name: 'P1', startTime: '09:00', endTime: '09:50' }],
        breaks: [{ name: 'Interval', startTime: '09:50', endTime: '10:10' }]
      }
    });

    const user = userEvent.setup();
    render(<TimeModelView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Period 1 Name')).toHaveValue('P1');
    });

    const saveButton = screen.getByRole('button', { name: /Save Time Model/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(timeModelApi.saveTimeModel).toHaveBeenCalledWith({
        periods: [{ name: 'P1', startTime: '09:00', endTime: '09:50' }],
        breaks: [{ name: 'Interval', startTime: '09:50', endTime: '10:10' }]
      });
      expect(screen.getByText('Time model saved successfully.')).toBeInTheDocument();
    });
  });

  it('displays API error message if the server rejects save submission', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    timeModelApi.fetchTimeModel.mockResolvedValueOnce({
      timeModel: {
        periods: [{ name: 'P1', startTime: '09:00', endTime: '09:50' }],
        breaks: []
      }
    });
    timeModelApi.saveTimeModel.mockRejectedValueOnce(new Error('Server side check failed: database locked'));

    const user = userEvent.setup();
    render(<TimeModelView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Period 1 Name')).toHaveValue('P1');
    });

    const saveButton = screen.getByRole('button', { name: /Save Time Model/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Server side check failed: database locked')).toBeInTheDocument();
    });
  });
});
