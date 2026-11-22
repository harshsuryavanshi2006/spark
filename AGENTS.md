<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep public Home, Events, and Auth routes top-level; put private Profile and Registration under the managed authenticated layout to preserve URLs and prevent signed-out access.
- Store profiles and event registrations in Lovable Cloud with owner-scoped policies; validate writes with shared Zod schemas and database rules to protect student data.
- Use one root account provider for session changes; use protected server functions and query loaders for private reads so saved activity is refreshed consistently.
- Keep the event registration catalog in the shared student rules module; resolve entry-point titles to stable event identifiers so selections and activity refer to the same event.
- Keep club catalog, memberships, and suggestions in Lovable Cloud with owner-scoped access; update public member totals transactionally only after unique membership inserts.
