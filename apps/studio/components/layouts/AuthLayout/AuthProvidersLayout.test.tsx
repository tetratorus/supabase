import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvidersLayout } from './AuthProvidersLayout'
import { BASE_PATH } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const { mockIsPlatform } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('./AuthLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('AuthProvidersLayout', () => {
  beforeEach(() => {
    mswServer.use(
      http.get(`${BASE_PATH}/api/enabled-features-overrides`, () =>
        HttpResponse.json({ disabled_features: [] })
      )
    )
  })

  it('renders the providers content on platform', () => {
    mockIsPlatform.value = true

    customRender(
      <AuthProvidersLayout>
        <div>providers content</div>
      </AuthProvidersLayout>,
      { profileContext: createMockProfileContext() }
    )

    expect(screen.getByText('providers content')).toBeInTheDocument()
  })

  it('renders the unknown interface when self-hosted', () => {
    mockIsPlatform.value = false

    customRender(
      <AuthProvidersLayout>
        <div>providers content</div>
      </AuthProvidersLayout>,
      { profileContext: createMockProfileContext() }
    )

    expect(screen.queryByText('providers content')).not.toBeInTheDocument()
    expect(
      screen.getByText("We couldn't find the page that you're looking for")
    ).toBeInTheDocument()
  })
})
