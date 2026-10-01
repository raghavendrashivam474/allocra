import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TermsAndGroupsView from './TermsAndGroupsView';
import * as institutionApi from '../../api/institution';
import * as academicStructureApi from '../../api/academicStructure';
import * as academicContextApi from '../../api/academicContext';

vi.mock('../../api/institution', () => ({
  fetchInstitution: vi.fn()
}));

vi.mock('../../api/academicStructure', () => ({
  fetchPrograms: vi.fn()
}));

vi.mock('../../api/academicContext', () => ({
  fetchTerms: vi.fn(),
  createTerm: vi.fn(),
  fetchGroups: vi.fn(),
  createGroup: vi.fn()
}));

describe('TermsAndGroupsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt if institution is not configured yet', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({ institution: null });

    render(<TermsAndGroupsView />);

    expect(screen.getByText(/Loading terms and groups details.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Please configure your Institution first before accessing Terms & Groups/i)
      ).toBeInTheDocument();
    });
  });

  it('renders empty terms and groups when institution is configured', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'ABES College', academicYear: '2026-27' }
    });
    academicContextApi.fetchTerms.mockResolvedValueOnce({ terms: [] });
    academicContextApi.fetchGroups.mockResolvedValueOnce({ groups: [] });
    academicStructureApi.fetchPrograms.mockResolvedValueOnce({ programs: [] });

    render(<TermsAndGroupsView />);

    await waitFor(() => {
      expect(screen.getByText('ABES College')).toBeInTheDocument();
      expect(screen.getByText('2026-27')).toBeInTheDocument();
      expect(screen.getByText(/No academic terms configured yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No groups configured yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Term/i })).toBeInTheDocument();
    });
  });

  it('allows adding an academic term', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'ABES College', academicYear: '2026-27' }
    });
    academicContextApi.fetchTerms.mockResolvedValueOnce({ terms: [] });
    academicContextApi.fetchGroups.mockResolvedValueOnce({ groups: [] });
    academicStructureApi.fetchPrograms.mockResolvedValueOnce({ programs: [] });
    academicContextApi.createTerm.mockResolvedValueOnce({
      message: 'Term created successfully',
      term: { _id: 'term-1', name: 'Semester 1', academicYear: '2026-27', institutionId: 'inst-1' }
    });

    const user = userEvent.setup();
    render(<TermsAndGroupsView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Term/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Term/i }));
    await user.type(screen.getByLabelText(/Term Name/i), 'Semester 1');
    await user.click(screen.getByRole('button', { name: /Create Term/i }));

    await waitFor(() => {
      expect(academicContextApi.createTerm).toHaveBeenCalledWith({ name: 'Semester 1' });
      expect(screen.getByText('Semester 1')).toBeInTheDocument();
      expect(screen.getByText(/Academic Year: 2026-27/i)).toBeInTheDocument();
    });
  });

  it('allows adding a group when programs and terms exist', async () => {
    institutionApi.fetchInstitution.mockResolvedValueOnce({
      institution: { _id: 'inst-1', name: 'ABES College', academicYear: '2026-27' }
    });
    academicContextApi.fetchTerms.mockResolvedValueOnce({
      terms: [{ _id: 'term-1', name: 'Semester 1', academicYear: '2026-27' }]
    });
    academicContextApi.fetchGroups.mockResolvedValueOnce({
      groups: []
    });
    academicStructureApi.fetchPrograms.mockResolvedValueOnce({
      programs: [{ _id: 'prog-1', name: 'B.Tech CSE' }]
    });
    academicContextApi.createGroup.mockResolvedValueOnce({
      message: 'Group created successfully',
      group: {
        _id: 'grp-1',
        name: 'CSE-A',
        programId: { _id: 'prog-1', name: 'B.Tech CSE' },
        termId: { _id: 'term-1', name: 'Semester 1' }
      }
    });

    const user = userEvent.setup();
    render(<TermsAndGroupsView />);

    await waitFor(() => {
      expect(screen.getByText('Semester 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add Group/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ Add Group/i }));
    await user.type(screen.getByLabelText(/Group Name/i), 'CSE-A');
    await user.click(screen.getByRole('button', { name: /Create Group/i }));

    await waitFor(() => {
      expect(academicContextApi.createGroup).toHaveBeenCalledWith({
        programId: 'prog-1',
        termId: 'term-1',
        name: 'CSE-A'
      });
      expect(screen.getByText('CSE-A')).toBeInTheDocument();
      expect(screen.getByText(/Program: B.Tech CSE \| Term: Semester 1/i)).toBeInTheDocument();
    });
  });

  it('displays error messages when API fails', async () => {
    institutionApi.fetchInstitution.mockRejectedValueOnce(new Error('Network failure loading context'));

    render(<TermsAndGroupsView />);

    await waitFor(() => {
      expect(screen.getByText('Network failure loading context')).toBeInTheDocument();
    });
  });
});
