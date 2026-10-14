import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as healthApi from '../api/health';
import * as setupApi from '../api/setup';

vi.mock('../api/health');
vi.mock('../api/setup');

describe('App Shell & Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthApi.checkHealth.mockResolvedValue({ status: 'ok' });
    setupApi.fetchReadiness.mockResolvedValue({
      isReady: false,
      missingSteps: ['institution'],
      summary: {
        hasInstitution: false,
        hasDepartments: false,
        hasPrograms: false,
        hasTerms: false,
        hasGroups: false,
        hasFaculty: false,
        hasRooms: false,
        hasActivities: false,
        hasCalendar: false,
        hasTimeModel: false
      }
    });
  });

  it('renders skip to main content link targeting #main-content', () => {
    render(<App />);
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('skip-link');
  });

  it('renders application header and main navigation sidebar', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /ALLOCRA/i })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /Main Navigation/i })).toBeInTheDocument();
  });

  it('navigates between views when navigation buttons are clicked', async () => {
    render(<App />);
    const validationNavBtn = screen.getByRole('button', { name: /^Validation$/i });
    fireEvent.click(validationNavBtn);

    await waitFor(() => {
      expect(validationNavBtn).toHaveClass('active');
    });
  });
});
