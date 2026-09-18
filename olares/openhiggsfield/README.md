# Olares chart — Open Higgsfield studio

This chart installs the **Next.js studio** already in this repository onto Olares 1.12.6+. It is not the older CUDA / Python Higgsfield CLI wrapper.

| | |
| --- | --- |
| Chart path | `olares/openhiggsfield` |
| Chart / Market version | `0.1.1` |
| Image | `ghcr.io/wooj-commits/open-higgsfield:0.1.0` |
| Container port | `3000` |
| Health | `GET /api/health` |
| Entrance | `authLevel: private` (Olares account required) |
| Process uid | `1001` (`USER nextjs` in the existing Dockerfile) |

## Image

The chart pins `ghcr.io/wooj-commits/open-higgsfield:0.1.0`. There is no `imagePullSecret`. Olares nodes pull anonymously, so the GHCR package must be **Public**.

A workflow on `main` (`.github/workflows/publish-image.yml`) builds the repo `Dockerfile` for `linux/amd64` and `linux/arm64` and publishes that tag. Secrets are runtime-only; nothing from `.env` is baked in.

After the first publish, if the workflow cannot flip visibility, set the package to Public in GitHub → Packages. A private package would need a cluster pull secret this node does not have.

## Environment variables

Declared in `OlaresManifest.yaml` `envs[]` as required install-time values. No real credentials are committed.

At install, Olares app-service writes them to Helm `.Values.olaresEnv.*`. `templates/secret.yaml` copies them into Kubernetes Secret `openhiggsfield`. The Deployment mounts that Secret with `envFrom.secretRef`, so the Next.js process sees:

- `AUTH_SECRET`
- `AUTH_USERNAME`
- `AUTH_PASSWORD`
- `HF_API_BASE_URL`
- `HF_API_KEY`

The chart also sets non-secret runtime config: `HOSTNAME=0.0.0.0`, `PORT=3000`, `TRUST_PROXY=1`, `PUBLIC_ORIGIN=https://<entrance host>` from `.Values.domain.openhiggsfield`.

Change an env after install in Settings; `applyOnChange: true` restarts the workload.

## Install on Woojin's Olares (do this on the node; this repo does not deploy)

```bash
olares-cli chart lint ./olares/openhiggsfield
olares-cli chart package ./olares/openhiggsfield
olares-cli market upload openhiggsfield-0.1.1.tgz
olares-cli market install -s upload --watch
```

Fill the five env vars when prompted (or `--env KEY=VALUE`). Open the Desktop entrance while signed in as Olares account `woojinc1205`. Then sign in to the studio with `AUTH_USERNAME` / `AUTH_PASSWORD`.
