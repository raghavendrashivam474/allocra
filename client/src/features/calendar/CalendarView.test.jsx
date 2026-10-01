import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarView from './CalendarView';
import * as institutionApi from '../../api/institution';
import * as calendarApi from '../../api/calendar';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/calendar', () => ({
  fetchCalendar: vi.fn(),
  saveCalendar: vi.fn()
}));

describe('CalendarView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    institutionApi.fetchInstitution.mockReturnValue(new Promise(() => {})); // Never resolves to keep loading state active
    render(<CalendarView />);
    expect(screen.getByText(/Loading calendar details.../i)).toBeInTheDocument();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<CalendarView />);

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your Institution first before accessing Calendar Configuration/i)
      ).toBeInTheDocument();
    });
  });

  it('renders unconfigured calendar view with default weekday selection', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    calendarApi.fetchCalendar.mockResolvedValueOnce({ calendar: null });

    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByText('MIT')).toBeInTheDocument();
      expect(screen.getByText('2026-27')).toBeInTheDocument();
      // Default checked weekdays: Monday - Friday
      expect(screen.getByLabelText('Monday')).toBeChecked();
      expect(screen.getByLabelText('Friday')).toBeChecked();
      expect(screen.getByLabelText('Saturday')).not.toBeChecked();
      expect(screen.getByLabelText('Sunday')).not.toBeChecked();
    });
  });

  it('loads and renders existing calendar configuration from database', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    calendarApi.fetchCalendar.mockResolvedValueOnce({
      calendar: {
        _id: 'cal-456',
        institutionId: 'inst-123',
        workingDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY']
      }
    });

    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Monday')).toBeChecked();
      expect(screen.getByLabelText('Wednesday')).toBeChecked();
      expect(screen.getByLabelText('Friday')).toBeChecked();
      expect(screen.getByLabelText('Saturday')).toBeChecked();
      
      expect(screen.getByLabelText('Tuesday')).not.toBeChecked();
      expect(screen.getByLabelText('Thursday')).not.toBeChecked();
      expect(screen.getByLabelText('Sunday')).not.toBeChecked();
    });
  });

  it('allows checking and unchecking days and triggers API save on click', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    calendarApi.fetchCalendar.mockResolvedValueOnce({
      calendar: {
        _id: 'cal-456',
        institutionId: 'inst-123',
        workingDays: ['MONDAY']
      }
    });
    calendarApi.saveCalendar.mockResolvedValueOnce({
      message: 'Calendar saved successfully',
      calendar: { workingDays: ['MONDAY', 'TUESDAY'] }
    });

    const user = userEvent.setup();
    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Monday')).toBeChecked();
    });

    // Check Tuesday
    await user.click(screen.getByLabelText('Tuesday'));
    expect(screen.getByLabelText('Tuesday')).toBeChecked();

    // Submit save
    const saveButton = screen.getByRole('button', { name: /Save Calendar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(calendarApi.saveCalendar).toHaveBeenCalledWith({
        workingDays: ['MONDAY', 'TUESDAY']
      });
      expect(screen.getByText('Calendar saved successfully.')).toBeInTheDocument();
    });
  });

  it('shows validation error if user tries to save zero working days', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-123', name: 'MIT', academicYear: '2026-27' }
    });
    calendarApi.fetchCalendar.mockResolvedValueOnce({
      calendar: {
        _id: 'cal-456',
        institutionId: 'inst-123',
        workingDays: ['MONDAY']
      }
    });

    const user = userEvent.setup();
    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByLabelText('Monday')).toBeChecked();
    });

    // Uncheck Monday to make workingDays empty
    await user.click(screen.getByLabelText('Monday'));
    expect(screen.getByLabelText('Monday')).not.toBeChecked();

    // Click save
    await user.click(screen.getByRole('button', { name: /Save Calendar/i }));

    await waitFor(() => {
      expect(screen.getByText('Please select at least one working day')).toBeInTheDocument();
      expect(calendarApi.saveCalendar).not.toHaveBeenCalled();
    });
  });

  it('displays API error message on fetch failure', async () => {
    institutionApi.fetchInstitution.mockRejectedValueOnce(new Error('Connection timed out'));

    render(<CalendarView />);

    await waitFor(() => {
      expect(screen.getByText('Connection timed out')).toBeInTheDocument();
    });
  });
});
