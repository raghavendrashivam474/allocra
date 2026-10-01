import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AcademicStructureView from './AcademicStructureView';
import * as institutionApi from '../../api/institution';
import * as academicStructureApi from '../../api/academicStructure';

// Mock API calls
vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/academicStructure', () => ({
  fetchDepartments: vi.fn(),
  createDepartment: vi.fn(),
  fetchPrograms: vi.fn(),
  createProgram: vi.fn()
}));

describe('AcademicStructureView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<AcademicStructureView />);

    expect(screen.getByText(/Loading academic structure details.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your Institution first before accessing Academic Structure/i)
      ).toBeInTheDocument();
    });
  });

  it('renders empty academic structure when institution is configured', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'ABES College', academicYear: '2026-27' }
    });
    academicStructureApi.fetchDepartments.mockResolvedValueOnce({ departments: [] });
    academicStructureApi.fetchPrograms.mockResolvedValueOnce({ programs: [] });

    render(<AcademicStructureView />);

    await waitFor(() => {
      expect(screen.getByText('ABES College')).toBeInTheDocument();
      expect(screen.getByText('2026-27')).toBeInTheDocument();
      expect(screen.getByText(/No departments configured yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No programs configured yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Department/i })).toBeInTheDocument();
    });
  });

  it('allows adding a department', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'ABES College', academicYear: '2026-27' }
    });
    academicStructureApi.fetchDepartments.mockResolvedValueOnce({ departments: [] });
    academicStructureApi.fetchPrograms.mockResolvedValueOnce({ programs: [] });
    academicStructureApi.createDepartment.mockResolvedValueOnce({
      message: 'Department created successfully',
      department: { _id: 'dept-1', name: 'Computer Science & Engineering', institutionId: 'inst-1' }
    });

    const user = userEvent.setup();
    render(<AcademicStructureView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Department/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Department/i }));
    await user.type(screen.getByLabelText(/Department Name/i), 'Computer Science & Engineering');
    await user.click(screen.getByRole('button', { name: /Create Department/i }));

    await waitFor(() => {
      expect(academicStructureApi.createDepartment).toHaveBeenCalledWith({
        name: 'Computer Science & Engineering'
      });
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
    });
  });

  it('renders existing departments and programs and allows adding a program', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'ABES College', academicYear: '2026-27' }
    });
    academicStructureApi.fetchDepartments.mockResolvedValueOnce({
      departments: [{ _id: 'dept-1', name: 'Computer Science & Engineering' }]
    });
    academicStructureApi.fetchPrograms.mockResolvedValueOnce({
      programs: []
    });
    academicStructureApi.createProgram.mockResolvedValueOnce({
      message: 'Program created successfully',
      program: {
        _id: 'prog-1',
        name: 'B.Tech CSE',
        departmentId: { _id: 'dept-1', name: 'Computer Science & Engineering' }
      }
    });

    const user = userEvent.setup();
    render(<AcademicStructureView />);

    await waitFor(() => {
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Program/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Program/i }));
    await user.type(screen.getByLabelText(/Program Name/i), 'B.Tech CSE');
    await user.click(screen.getByRole('button', { name: /Create Program/i }));

    await waitFor(() => {
      expect(academicStructureApi.createProgram).toHaveBeenCalledWith({
        departmentId: 'dept-1',
        name: 'B.Tech CSE'
      });
      expect(screen.getByText('B.Tech CSE')).toBeInTheDocument();
    });
  });

  it('displays error messages when API fails', async () => {
    institutionApi.fetchInstitution.mockRejectedValueOnce(new Error('Network error loading data'));

    render(<AcademicStructureView />);

    await waitFor(() => {
      expect(screen.getByText('Network error loading data')).toBeInTheDocument();
    });
  });
});
