# Deploying Saroj Couture (free, self-hosted)

The whole site runs on **one server** with Docker:

| Container | What it does |
|---|---|
| `db` | PostgreSQL 17: categories, garments, photo details, owner login |
| `app` | The Next.js website + admin, and the photo files (originals + web copies) |
| `caddy` | HTTPS (free Let's Encrypt certificate, renewed automatically) |

## Recommended free server: Oracle Cloud "Always Free"

It's free with no time limit, and it's big enough for 10,000 large photos:

- Ampere A1 (ARM) VM: up to **4 CPUs, 24 GB RAM**
- **200 GB** block storage. 10,000 photos at ~5 MB each is ~50 GB of
  originals plus ~15 GB of web copies, so there's plenty of headroom.
- 10 TB/month outbound traffic

Sign-up asks for a card for identity checks, but Always Free resources are
never charged. Notes:
- Oracle can reclaim Always Free VMs that sit **idle** (very low CPU, network
  and memory for 7 days). A live website usually isn't idle. To rule this out
  entirely, upgrade the account to *Pay As You Go*: Always Free resources
  stay free.
- ARM capacity is sometimes "out of capacity" in popular regions. Retry later
  or pick another availability domain.

### Why not Vercel's free tier?
Vercel Hobby forbids commercial use, has no disk for photos, and caps
uploads at 4.5 MB per request. That doesn't fit a boutique with 10,000
full-quality photos.

## 1. Create the server

1. Oracle Cloud console → Compute → Instances → **Create instance**
   - Image: **Ubuntu 24.04** · Shape: **VM.Standard.A1.Flex**, 4 OCPU / 24 GB
   - Boot volume: set to **200 GB**
   - Add your SSH public key
2. Networking → the instance's subnet → Security List → add **Ingress** rules
   for TCP **80** and **443** (and UDP 443) from `0.0.0.0/0`.
3. SSH in, then open the same ports in the VM's own firewall and grow the
   disk into the extra space:
   ```bash
   sudo iptables -I INPUT 6 -p tcp -m multiport --dports 80,443 -j ACCEPT
   sudo iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   sudo growpart /dev/sda 1 && sudo resize2fs /dev/sda1   # if df -h doesn't show ~200G
   ```
4. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER && newgrp docker
   ```

## 2. Point the domain at the server

At your domain registrar, create an **A record** for `sarojcouture.com`
(and `www`) pointing at the VM's public IP. Optionally put Cloudflare
(free) in front to cache photos worldwide. If you do, set its SSL mode to
**Full (strict)**.

## 3. Start the site

```bash
git clone <repo-url> couture && cd couture
cp .env.example .env
nano .env        # POSTGRES_PASSWORD=$(openssl rand -base64 32), SITE_DOMAIN, NEXT_PUBLIC_SITE_URL
docker compose --profile prod up -d --build
docker compose --profile prod exec app node scripts/set-owner-password.ts   # create the owner login
```

The app runs the database migrations automatically every time it starts.

**Forgot the admin password?** Run the same `set-owner-password` command
again. It resets the password and signs out every device.

## 4. Updating the site

```bash
git pull
docker compose --profile prod up -d --build
```

## 5. Backups (important)

Everything that matters lives in two Docker volumes: `pgdata` (database)
and `media` (photos). Back up both regularly, and keep copies **off** the server.

```bash
# Database: small, run daily (e.g. from cron)
docker compose exec -T db pg_dump -U couture -Fc couture > backup-$(date +%F).dump

# Photos: copy the originals (the web copies can always be regenerated)
sudo rsync -a /var/lib/docker/volumes/couture_media/_data/private/ /path/to/backup/originals/
```

Good off-server destinations: an external drive at home (`rsync` over SSH),
or a cloud bucket via `rclone`. Free tiers (Oracle Object Storage 20 GB,
Cloudflare R2 10 GB, Google Drive 15 GB) will cover the database and early
photos, but not 50 GB+ of originals. Plan for a home drive or a small paid
bucket (~₹50/month for 50 GB on R2) once the catalogue grows.

Restore:
```bash
docker compose exec -T db pg_restore -U couture -d couture --clean < backup.dump
sudo rsync -a /path/to/backup/originals/ /var/lib/docker/volumes/couture_media/_data/private/
docker compose --profile prod exec app node scripts/regenerate-images.ts
```

## Useful commands

```bash
docker compose --profile prod logs -f app                       # app logs
docker compose exec db psql -U couture couture                  # database shell
docker compose --profile prod exec app node scripts/regenerate-images.ts   # rebuild web copies
df -h                                                           # disk space
```
