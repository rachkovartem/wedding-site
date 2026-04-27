import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RsvpForm from '../../components/RsvpForm.jsx'

describe('RsvpForm', () => {
  const defaultInvitation = { id: 'inv1', guest_name: 'Anna', plus_one_allowed: 0, rsvp_status: null }

  describe('initial state — no rsvp yet', () => {
    it('shows yes and no buttons', () => {
      render(<RsvpForm invitation={defaultInvitation} onSubmit={vi.fn()} submitted={false} />)
      expect(screen.getByRole('button', { name: /да/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /нет/i })).toBeInTheDocument()
    })

    it('does not show +1 toggle initially', () => {
      render(<RsvpForm invitation={defaultInvitation} onSubmit={vi.fn()} submitted={false} />)
      expect(screen.queryByLabelText(/\+1/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/партнёр/i)).not.toBeInTheDocument()
    })
  })

  describe('+1 toggle visibility', () => {
    it('shows +1 toggle when status=yes AND plus_one_allowed=1', async () => {
      const user = userEvent.setup()
      render(
        <RsvpForm
          invitation={{ ...defaultInvitation, plus_one_allowed: 1 }}
          onSubmit={vi.fn()}
          submitted={false}
        />
      )
      await user.click(screen.getByRole('button', { name: /да/i }))
      expect(screen.getByTestId('plus-one-toggle')).toBeInTheDocument()
    })

    it('hides +1 toggle when status=no even if plus_one_allowed=1', async () => {
      const user = userEvent.setup()
      render(
        <RsvpForm
          invitation={{ ...defaultInvitation, plus_one_allowed: 1 }}
          onSubmit={vi.fn()}
          submitted={false}
        />
      )
      await user.click(screen.getByRole('button', { name: /нет/i }))
      expect(screen.queryByTestId('plus-one-toggle')).not.toBeInTheDocument()
    })

    it('hides +1 toggle when plus_one_allowed=0 even if status=yes', async () => {
      const user = userEvent.setup()
      render(
        <RsvpForm
          invitation={{ ...defaultInvitation, plus_one_allowed: 0 }}
          onSubmit={vi.fn()}
          submitted={false}
        />
      )
      await user.click(screen.getByRole('button', { name: /да/i }))
      expect(screen.queryByTestId('plus-one-toggle')).not.toBeInTheDocument()
    })

    it('hides +1 toggle when invitation is null', async () => {
      const user = userEvent.setup()
      render(<RsvpForm invitation={null} onSubmit={vi.fn()} submitted={false} />)
      await user.click(screen.getByRole('button', { name: /да/i }))
      expect(screen.queryByTestId('plus-one-toggle')).not.toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls onSubmit with status=yes and plus_one=false when no +1', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<RsvpForm invitation={defaultInvitation} onSubmit={onSubmit} submitted={false} />)
      await user.click(screen.getByRole('button', { name: /да/i }))
      await user.click(screen.getByRole('button', { name: /подтвердить/i }))
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('yes', false))
    })

    it('calls onSubmit with status=no', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<RsvpForm invitation={defaultInvitation} onSubmit={onSubmit} submitted={false} />)
      await user.click(screen.getByRole('button', { name: /нет/i }))
      await user.click(screen.getByRole('button', { name: /подтвердить/i }))
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('no', false))
    })

    it('calls onSubmit with plus_one=true when +1 is checked', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(
        <RsvpForm
          invitation={{ ...defaultInvitation, plus_one_allowed: 1 }}
          onSubmit={onSubmit}
          submitted={false}
        />
      )
      await user.click(screen.getByRole('button', { name: /да/i }))
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      await user.click(screen.getByRole('button', { name: /подтвердить/i }))
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('yes', true))
    })

    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit
      const onSubmit = vi.fn().mockReturnValue(new Promise((resolve) => { resolveSubmit = resolve }))
      render(<RsvpForm invitation={defaultInvitation} onSubmit={onSubmit} submitted={false} />)
      await user.click(screen.getByRole('button', { name: /да/i }))
      const submitBtn = screen.getByRole('button', { name: /подтвердить/i })
      await user.click(submitBtn)
      expect(submitBtn).toBeDisabled()
      resolveSubmit()
    })
  })

  describe('existing rsvp', () => {
    it('shows confirmation when invitation.rsvp_status is set', () => {
      render(
        <RsvpForm
          invitation={{ ...defaultInvitation, rsvp_status: 'yes' }}
          onSubmit={vi.fn()}
          submitted={false}
        />
      )
      expect(screen.queryByRole('button', { name: /да/i })).not.toBeInTheDocument()
      expect(screen.getByText(/уже ответили/i)).toBeInTheDocument()
    })

    it('shows submitted state when submitted prop is true', () => {
      render(<RsvpForm invitation={defaultInvitation} onSubmit={vi.fn()} submitted={true} />)
      expect(screen.queryByRole('button', { name: /да/i })).not.toBeInTheDocument()
      expect(screen.getByText(/спасибо/i)).toBeInTheDocument()
    })
  })
})
