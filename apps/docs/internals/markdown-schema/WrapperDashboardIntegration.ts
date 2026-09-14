export const WrapperDashboardIntegration = ({
  props,
}: {
  props: Record<string, unknown>
}): string => {
  const title = props.title ? String(props.title) : 'this'
  const path = String(props.path ?? '')
  return `> You can enable the ${title} wrapper right from the [Supabase dashboard](https://supabase.com/dashboard/project/_/integrations/${path}/overview).
>
> Foreign tables are not accessible through the Data API directly. Keep them in a private schema and query them with SQL, or expose them through a [database function](https://supabase.com/docs/guides/database/extensions/wrappers/overview#security).`
}
