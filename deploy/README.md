# Deploying to the DigitalOcean Droplet

The site is plain static files. GitHub Actions builds it and copies it to the Droplet over SSH, and nginx serves it. The plan is to move the old October CMS site to `old.alteranlabs.co.uk` first, then point the main domain at the new site.

These steps assume Ubuntu with nginx and Certbot. Adjust paths if your Droplet differs. Nothing below changes the live site until step 4.

## 1. Move the old site to old.alteranlabs.co.uk

1. **DNS:** add an `A` record for `old` (and `AAAA` if you use IPv6) pointing at the Droplet's IP. Wait until `dig +short old.alteranlabs.co.uk` returns it.
2. **nginx:** copy the old site's server block to a new file and change only its `server_name`:

   ```sh
   sudo cp /etc/nginx/sites-available/<old-site-file> /etc/nginx/sites-available/old.alteranlabs.co.uk
   sudo nano /etc/nginx/sites-available/old.alteranlabs.co.uk
   #   server_name old.alteranlabs.co.uk;
   #   remove any listen 443 / ssl_certificate lines Certbot added, and any
   #   www/http -> https redirect blocks for the main domain
   sudo ln -s /etc/nginx/sites-available/old.alteranlabs.co.uk /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d old.alteranlabs.co.uk
   ```

3. **October CMS:** set the app URL to `https://old.alteranlabs.co.uk`. Depending on the version, that's `'url'` in `config/app.php` or `APP_URL` in `.env`. Then clear the cache with `php artisan cache:clear` from the site folder.
4. Check that https://old.alteranlabs.co.uk works. The main domain is still serving the old site at this point, which is fine.

## 2. Create a deploy user and folder

```sh
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/alteranlabs.co.uk/releases
sudo chown -R deploy:deploy /var/www/alteranlabs.co.uk
```

nginx only needs read access. The default `www-data` user can read files owned by `deploy` as long as the folders are world-readable (the default umask does this).

Make an SSH key just for deploys, on your own machine:

```sh
ssh-keygen -t ed25519 -N "" -C "github-deploy" -f alteranlabs-deploy
ssh-keyscan -t ed25519 <droplet-ip-or-host>   # copy this output for DEPLOY_KNOWN_HOSTS
```

Add `alteranlabs-deploy.pub` to `/home/deploy/.ssh/authorized_keys` on the Droplet (folder mode 700, file mode 600, owned by `deploy`). Make sure `rsync` is installed there (`sudo apt install rsync`).

## 3. Configure GitHub and run the first deploy

In the repo, go to **Settings → Secrets and variables → Actions**.

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
| `DEPLOY_PATH` | Optional, defaults to `/var/www/alteranlabs.co.uk` |

Then open **Actions → Deploy → Run workflow**. It uploads the build to `releases/<commit>` and points `/var/www/alteranlabs.co.uk/current` at it. Nothing serves that folder yet, so the live site doesn't change.

After this, every push to `main` deploys automatically.

## 4. Switch the main domain to the new site

```sh
sudo cp deploy/nginx-alteranlabs.co.uk.conf /etc/nginx/sites-available/alteranlabs.co.uk
sudo rm /etc/nginx/sites-enabled/<old-site-file>
sudo ln -s /etc/nginx/sites-available/alteranlabs.co.uk /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d alteranlabs.co.uk -d www.alteranlabs.co.uk
```

Choose "redirect" when Certbot asks about HTTP to HTTPS. Then check:

- https://alteranlabs.co.uk shows the new site.
- https://alteranlabs.co.uk/blog/post/new-dawn redirects to `/posts/new-dawn/`.
- https://old.alteranlabs.co.uk still shows the old site.

## Rolling back

- **Back to the old site entirely:** re-link the old site file in `sites-enabled`, remove the new one, then `sudo nginx -t && sudo systemctl reload nginx`.
- **Back to a previous build:** the last five builds stay in `releases/`. Run `cd /var/www/alteranlabs.co.uk && ln -sfn releases/<older-sha> current`, or re-run an older Deploy workflow run from the Actions tab.
