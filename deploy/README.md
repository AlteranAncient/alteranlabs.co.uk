# Deploying to the DigitalOcean Droplet

The Droplet runs Traefik in front of nginx containers, one Compose stack per folder in `/opt/stacks/`. The new site slots in as another stack:

```
Internet ──443──▶ traefik ──(proxy)──▶ static-site-1   old site (static clone)
                                  ├──▶ static-mwbf-1
                                  └──▶ astro-site-1    new Astro site
```

- **Build and upload:** the `Deploy` GitHub Actions workflow builds the site and rsyncs it into `/srv/alteranlabs.co.uk/astro/releases/<commit>/`, then points the `current` symlink at it. nginx serves `current` from a read-only bind mount, so deploys need no restart, and the last five releases stay around for rollback.
- **Serve:** [`compose.yml`](compose.yml) runs a stock `nginx:stable-alpine` container with [`nginx.conf`](nginx.conf), which also redirects the old `/blog/post/...` URLs to the new ones. Traefik labels route traffic to it and get its certificate through the existing `le` resolver.

The plan is to preview the new site on `new.alteranlabs.co.uk`, then swap the router rules so the old site moves to `old.alteranlabs.co.uk` and the new site takes the main domain. Nothing below changes the live site until step 5.

## 1. DNS

In Cloudflare, add `new` and `old` records pointing at the Droplet, set up the same way as the existing `alteranlabs.co.uk` record (same IP, same proxy setting).

## 2. Deploy folder and SSH key

On the Droplet, create the folder for the new site. If you already have a user that `deploy.sh` uses, you can use it. Otherwise create one:

```sh
sudo adduser --disabled-password --gecos "" deploy   # skip if you have one
sudo mkdir -p /srv/alteranlabs.co.uk/astro/releases
sudo chown -R deploy:deploy /srv/alteranlabs.co.uk/astro
```

Files must be world-readable so the nginx user in the container can read them. The default umask already does this.

On your own machine, make an SSH key just for GitHub deploys:

```sh
ssh-keygen -t ed25519 -N "" -C "github-deploy" -f alteranlabs-deploy
ssh-keyscan -t ed25519 <droplet-ip-or-host>   # copy the output for DEPLOY_KNOWN_HOSTS
```

Add `alteranlabs-deploy.pub` to the deploy user's `~/.ssh/authorized_keys` (folder mode 700, file mode 600). Make sure `rsync` is installed on the Droplet (`sudo apt install rsync`).

## 3. GitHub settings and first deploy

In the repo, open **Settings → Secrets and variables → Actions**.

**Secrets:**

| Name | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | Contents of the private key file `alteranlabs-deploy` |
| `DEPLOY_KNOWN_HOSTS` | Output of the `ssh-keyscan` command above |

**Variables:**

| Name | Value |
| --- | --- |
| `DEPLOY_HOST` | Droplet IP or hostname. The workflow is skipped while this is empty. |
| `DEPLOY_USER` | Optional, defaults to `deploy` |
| `DEPLOY_PATH` | Optional, defaults to `/srv/alteranlabs.co.uk/astro` |

Then open **Actions → Deploy → Run workflow**. Afterwards, `/srv/alteranlabs.co.uk/astro/current` should exist and point to a release. From now on, every push to `main` deploys automatically.

## 4. Start the stack and preview

Copy `deploy/compose.yml` and `deploy/nginx.conf` from this repo to `/opt/stacks/astro/` on the Droplet, then:

```sh
cd /opt/stacks/astro
docker compose up -d
docker compose logs -f   # Ctrl+C once nginx is up
```

Open https://new.alteranlabs.co.uk. The first visit may take a few seconds while Traefik gets the certificate. Check a post, a redirect such as `/blog/post/new-dawn`, and the 404 page.

## 5. Switch domains

**First, let the old site answer on both names.** In `/opt/stacks/static/compose.yml`, change the old site's router rule:

```yaml
traefik.http.routers.site.rule: Host(`alteranlabs.co.uk`) || Host(`old.alteranlabs.co.uk`)
```

Run `docker compose up -d` in `/opt/stacks/static`, then check that https://old.alteranlabs.co.uk loads.

**Then fix any absolute links in the old clone.** A static clone often keeps full `https://alteranlabs.co.uk/...` links, and after the swap those would send visitors to the new site. From the old site's folder (`/srv/alteranlabs.co.uk/site`):

```sh
grep -rl "//alteranlabs.co.uk" . | head
```

If that finds anything, back up the folder and rewrite the links:

```sh
sudo cp -a /srv/alteranlabs.co.uk/site /srv/alteranlabs.co.uk/site-backup
grep -rlZ "//alteranlabs.co.uk" --include="*.html" --include="*.css" --include="*.js" . \
  | xargs -0 -r sudo sed -i 's#//alteranlabs\.co\.uk#//old.alteranlabs.co.uk#g'
```

Repeat with `//www.alteranlabs.co.uk` if the clone uses `www`. Other subdomains like `mwbf.alteranlabs.co.uk` aren't matched.

**Now swap the rules:**

1. In `/opt/stacks/static/compose.yml`, set the old site's rule to `Host(`old.alteranlabs.co.uk`)`. If the www-to-apex redirect router and middleware are on that stack, move those labels into `/opt/stacks/astro/compose.yml`. Remember that router and middleware names must stay unique across stacks.
2. In `/opt/stacks/astro/compose.yml`, set the rule to `Host(`alteranlabs.co.uk`)`. You can keep `|| Host(`new.alteranlabs.co.uk`)` if you'd like the preview name to keep working.
3. Run `docker compose up -d` in `/opt/stacks/static`, then in `/opt/stacks/astro`.

Check that https://alteranlabs.co.uk shows the new site, https://www.alteranlabs.co.uk redirects to it, and https://old.alteranlabs.co.uk shows the old one.

## Rolling back

- **Back to the old site on the main domain:** put the two router rules (and the www labels) back as they were and run `docker compose up -d` in both stacks.
- **Back to a previous build of the new site:** the last five builds stay in `/srv/alteranlabs.co.uk/astro/releases/`. Run `cd /srv/alteranlabs.co.uk/astro && ln -sfn releases/<older-sha> current`, or re-run an older Deploy workflow from the Actions tab.
