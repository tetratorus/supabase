import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

export function WrapperDashboardIntegration({ title, path }: { title: string; path: string }) {
  return (
    <Admonition
      type="note"
      className="mb-4"
      actions={
        <Button asChild>
          <Link
            href={`https://supabase.com/dashboard/project/_/integrations/${path}/overview`}
            className="no-underline"
          >
            Open wrapper in dashboard
          </Link>
        </Button>
      }
    >
      <p>You can enable the {title} wrapper right from the Supabase dashboard.</p>
      <p>
        Foreign tables are not accessible through the Data API directly. Keep them in a private
        schema and query them with SQL, or expose them through a database function. See{' '}
        <Link href="/guides/database/extensions/wrappers/overview#security">Security</Link> for an
        example.
      </p>
    </Admonition>
  )
}
