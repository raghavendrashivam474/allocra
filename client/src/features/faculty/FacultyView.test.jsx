import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FacultyView from './FacultyView';
import * as institutionApi from '../../api/institution';
import * as academicStructureApi from '../../api/academicStructure';
import * as facultyApi from '../../api/faculty';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/academicStructure', () => ({
  fetchDepartments: vi.fn()
}));

vi.mock('../../api/faculty', () => ({
  fetchFaculty: vi.fn(),
  createFaculty: vi.fn()
}));

describe('FacultyView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<FacultyView />);

    expect(screen.getByText(/Loading faculty details.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your Institution first before accessing Faculty/i)
      ).toBeInTheDocument();
    });
  });

  it('renders empty faculty list with EmptyState when departments exist', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    academicStructureApi.fetchDepartments.mockResolvedValueOnce({
      departments: [{ _id: 'dept-1', name: 'Physics' }]
    });
    facultyApi.fetchFaculty.mockResolvedValueOnce({ faculty: [] });

    render(<FacultyView />);

    await waitFor(() => {
      expect(screen.getByText(/No faculty members yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Faculty Member/i })).toBeInTheDocument();
    });
  });

  it('allows adding a faculty member', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'MIT', academicYear: '2026' }
    });
    academicStructureApi.fetchDepartments.mockResolvedValueOnce({
      departments: [{ _id: 'dept-1', name: 'Physics' }]
    });
    facultyApi.fetchFaculty.mockResolvedValueOnce({ faculty: [] });
    facultyApi.createFaculty.mockResolvedValueOnce({
      message: 'Faculty member created successfully',
      faculty: {
        _id: 'fac-1',
        name: 'Richard Feynman',
        departmentId: { _id: 'dept-1', name: 'Physics' }
      }
    });

    const user = userEvent.setup();
    render(<FacultyView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Faculty Member/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Faculty Member/i }));
    await user.type(screen.getByLabelText(/Faculty Name/i), 'Richard Feynman');
    await user.click(screen.getByRole('button', { name: /Create Faculty/i }));

    await waitFor(() => {
      expect(facultyApi.createFaculty).toHaveBeenCalledWith({
        departmentId: 'dept-1',
        name: 'Richard Feynman'
      });
      expect(screen.getByText('Richard Feynman')).toBeInTheDocument();
      expect(screen.getByText('Department: Physics')).toBeInTheDocument();
    });
  });

  it('displays API error messages', async () => {
    institutionApi.fetchInstitution.mockRejectedValueOnce(new Error('Network error loading data'));

    render(<FacultyView />);

    await waitFor(() => {
      expect(screen.getByText('Network error loading data')).toBeInTheDocument();
    });
  });
});
