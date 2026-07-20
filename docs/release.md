# Release Checklist

This repository is a private-by-default fork of `agegr/pi-web`. Its `package.json` uses `"private": true` so a maintainer cannot accidentally publish an enhanced build under the upstream npm identity.

Use this checklist from a clean branch when creating a GitHub release for your fork.

## 1. Configure repository identity

Before the first release, replace the placeholders below with your own GitHub repository details:

```bash
git remote -v
git remote get-url origin
```

The recommended remote layout is:

```text
origin    your enhanced fork
upstream  https://github.com/agegr/pi-web.git
```

If the checkout still uses upstream as `origin`:

```bash
git remote rename origin upstream
git remote add origin git@github.com:zhuguadundan/pi-web-secure.git
```

Do not publish to `agegr/pi-web` or `@agegr/pi-web` unless you are an authorized upstream maintainer following the upstream release process.

## 2. Review sensitive and machine-specific data

```bash
git status --short
git diff --check
git diff --stat
```

Confirm that the commit does not include:

- `.env.local` or any real password.
- API keys, provider credentials, or authentication cookies.
- Pi session files or personal project files.
- Local service definitions containing personal paths or addresses.
- `.next`, `node_modules`, logs, temporary files, or test uploads.

The repository `.gitignore` excludes `.env*` and common build output, but always inspect the staged diff rather than relying only on ignore rules.

## 3. Verify the source

```bash
npm install
npm run lint
node_modules/.bin/tsc --noEmit
node --test $(rg --files | rg '(test|spec)\.mjs$')
npm run build
```

Expected:

- ESLint completes without errors.
- TypeScript completes without errors.
- All Node test files pass.
- The production build completes successfully.

Record any known build warnings in the release notes.

## 4. Commit the release

```bash
git add -A
git diff --cached --check
git diff --cached --stat
git commit -m "Release Pi Web Secure <version>"
```

Use a fork-specific version, for example `0.7.16-secure.1`, so it cannot be confused with an upstream tag.

## 5. Tag and push

```bash
git tag -a v<version> -m "Pi Web Secure v<version>"
git push origin main --tags
```

Verify that `origin` points to your fork before pushing.

## 6. Create the GitHub release

```bash
gh release create v<version> \
  --repo zhuguadundan/pi-web-secure \
  --verify-tag \
  --title "Pi Web Secure v<version>" \
  --generate-notes
```

Release notes should include:

- The upstream Pi Web version used as the base.
- Security and authentication changes.
- PWA and mobile changes.
- Chat file-upload changes.
- Workspace and launcher changes.
- Upgrade steps and known limitations.

## 7. npm publishing is intentionally disabled

This fork is currently marked `"private": true` and has no npm release script. GitHub source releases are the supported distribution method until the maintainer chooses a unique npm package name.

To publish an npm package later, first:

1. Choose a package name that you own and that does not imply upstream ownership.
2. Update `name`, `version`, `repository`, `homepage`, and `bugs` in `package.json`.
3. Update `package-lock.json`.
4. Review the `files` allowlist and packed artifact with `npm pack --dry-run`.
5. Remove `"private": true` only after all metadata is correct.
6. Add a fork-specific release script and test it against a non-production registry or dry run.

Never reuse the upstream `@agegr/pi-web` publishing instructions for this fork.
