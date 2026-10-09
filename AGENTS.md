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

- Store newly added gallery media in Lovable Assets and import its generated JSON pointers; this keeps uploaded binaries out of the repository.
- Keep public social destinations in src/lib/social.ts and reserve WhatsApp tabs during the submit gesture, before asynchronous saves, to avoid popup blockers while retaining a clickable fallback.
- Opening hours and holidays live in business_hours/special_days and are read via src/lib/useSchedule.ts; a DB trigger rejects bookings outside them so the site and database never disagree.
