import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Card, Alert, PageHeader, EmptyState, LoadingState } from './index';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders with default primary variant and handles click', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: 'Click Me' });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('btn-primary');

      await user.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders secondary and danger variants correctly', () => {
      const { rerender } = render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button', { name: 'Secondary' })).toHaveClass('btn-secondary');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button', { name: 'Danger' })).toHaveClass('btn-danger');
    });

    it('honors disabled prop', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      const btn = screen.getByRole('button', { name: 'Disabled' });
      expect(btn).toBeDisabled();

      await user.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('renders title, description and children', () => {
      render(
        <Card title="Card Title" description="Card description text">
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('renders error alert with accessibility role', () => {
      render(<Alert type="error">Something went wrong</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('alert-error');
      expect(alert).toHaveTextContent('Something went wrong');
    });

    it('renders success and warning alerts', () => {
      const { rerender } = render(<Alert type="success">Operation succeeded</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('alert-success');

      rerender(<Alert type="warning">Warning notice</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('alert-warning');
    });
  });

  describe('PageHeader', () => {
    it('renders header title, description and optional action', () => {
      render(
        <PageHeader
          title="Section Title"
          description="Section details description"
          action={<button>Action Button</button>}
        />
      );
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Section details description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders message and optional action trigger', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      render(
        <EmptyState
          message="No items found."
          actionLabel="Create Item"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No items found.')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: 'Create Item' });
      await user.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoadingState', () => {
    it('renders default and custom message', () => {
      const { rerender } = render(<LoadingState />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(<LoadingState message="Fetching data..." />);
      expect(screen.getByText('Fetching data...')).toBeInTheDocument();
    });
  });
});
