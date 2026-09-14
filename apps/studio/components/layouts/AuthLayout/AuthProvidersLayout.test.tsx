import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvidersLayout } from './AuthProvidersLayout'

const { mockIsPlatform } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    authenticationSignInProviders: true,
    authenticationThirdPartyAuth: true,
  }),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
  }
})

vi.mock('./AuthLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('AuthProvidersLayout', () => {
  it('renders the providers content on platform', () => {
    mockIsPlatform.value = true

    render(
      <AuthProvidersLayout>
        <div>providers content</div>
      </AuthProvidersLayout>
    )

    expect(screen.getByText('providers content')).toBeInTheDocument()
  })

  it('renders the unknown interface when self-hosted', () => {
    mockIsPlatform.value = false

    render(
      <AuthProvidersLayout>
        <div>providers content</div>
      </AuthProvidersLayout>
    )

    expect(screen.queryByText('providers content')).not.toBeInTheDocument()
    expect(
      screen.getByText("We couldn't find the page that you're looking for")
    ).toBeInTheDocument()
  })
})
