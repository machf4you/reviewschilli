# Chili Media Review Booster - VPS Deployment Guide

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

---

## Prerequisites
- Node.js 18+ (LTS recommended)
- Python 3.10+
- MongoDB 6+
- Nginx (for reverse proxy)

---

## Frontend Setup (Vite)

### Development
```bash
cd frontend
yarn install
yarn dev  # Runs on port 3000
```

### Production Build
```bash
cd frontend
yarn build  # Output in /build folder
```

### Environment Variables
Create `.env` in frontend directory:
```env
VITE_BACKEND_URL=https://your-api-domain.com
```

---

## Backend Setup (FastAPI)

### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables
Create `.env` in backend directory:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=chili_review_booster
ADMIN_PASSWORD=your_secure_password
CORS_ORIGINS=https://your-frontend-domain.com
```

### Run Backend
```bash
# Development
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Production (with gunicorn)
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
```

---

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/chili-review-booster

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend (static files)
    root /var/www/chili-review-booster/frontend/build;
    index index.html;

    # API routes -> Backend
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Systemd Services

### Backend Service
```ini
# /etc/systemd/system/chili-backend.service

[Unit]
Description=Chili Review Booster API
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/chili-review-booster/backend
Environment="PATH=/var/www/chili-review-booster/backend/venv/bin"
ExecStart=/var/www/chili-review-booster/backend/venv/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Quick Deployment Steps

```bash
# 1. Clone/upload your code
cd /var/www
git clone your-repo chili-review-booster

# 2. Setup MongoDB
mongosh < /var/www/chili-review-booster/mongo_init.js

# 3. Setup Backend
cd /var/www/chili-review-booster/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env file with your settings

# 4. Build Frontend
cd /var/www/chili-review-booster/frontend
yarn install
# Create .env with VITE_BACKEND_URL
yarn build

# 5. Setup Nginx
sudo cp nginx.conf /etc/nginx/sites-available/chili-review-booster
sudo ln -s /etc/nginx/sites-available/chili-review-booster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Start Backend Service
sudo systemctl enable chili-backend
sudo systemctl start chili-backend

# 7. SSL with Certbot
sudo certbot --nginx -d your-domain.com
```

---

## Ports Summary
- **Frontend Dev**: 3000
- **Backend API**: 8001
- **MongoDB**: 27017
- **Nginx HTTP**: 80
- **Nginx HTTPS**: 443
