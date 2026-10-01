import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstitutionView from './InstitutionView';
import * as institutionApi from '../../api/institution';

// Mock API calls
vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn(),
  saveInstitution: vi.fn()
}));

describe('InstitutionView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no institution exists', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<InstitutionView />);

    // Initially loading
    expect(screen.getByText(/Loading institution details.../i)).toBeInTheDocument();

    // After resolution: Empty state
    await waitFor(() => {
      expect(screen.getByText(/No institution configured yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Institution/i })).toBeInTheDocument();
    });
  });

  it('opens form state when clicking Create Institution', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });
    const user = userEvent.setup();

    render(<InstitutionView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Institution/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Create Institution/i }));

    // Form inputs and action buttons visible
    expect(screen.getByLabelText(/Institution Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Academic Year/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Institution/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('renders configured state when institution is present', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: {
        name: 'ABC Engineering College',
        academicYear: '2026–27'
      }
    });

    render(<InstitutionView />);

    await waitFor(() => {
      expect(screen.getByText('ABC Engineering College')).toBeInTheDocument();
      expect(screen.getByText('2026–27')).toBeInTheDocument();
      expect(screen.getByText(/Institution configured/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit Configuration/i })).toBeInTheDocument();
    });
  });

  it('allows filling out the form and saving successfully', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });
    institutionApi.saveInstitution.mockResolvedValueOnce({
      message: 'Institution configured successfully',
      institution: {
        name: 'ABC Engineering College',
        academicYear: '2026–27'
      }
    });

    const user = userEvent.setup();
    render(<InstitutionView />);

    // Open form
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Institution/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Create Institution/i }));

    // Fill inputs
    await user.type(screen.getByLabelText(/Institution Name/i), 'ABC Engineering College');
    await user.type(screen.getByLabelText(/Academic Year/i), '2026–27');

    // Submit form
    await user.click(screen.getByRole('button', { name: /Save Institution/i }));

    // Verify configured view appears
    await waitFor(() => {
      expect(institutionApi.saveInstitution).toHaveBeenCalledWith({
        name: 'ABC Engineering College',
        academicYear: '2026–27'
      });
      expect(screen.getByText('ABC Engineering College')).toBeInTheDocument();
      expect(screen.getByText(/Institution configured/i)).toBeInTheDocument();
    });
  });
});
