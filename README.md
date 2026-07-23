# Sakani - Real Estate Platform

A modern real estate platform built with Laravel backend and React frontend.

## 🚀 Features

- **Property Management**: Add, edit, and manage property listings
- **User Authentication**: Secure login and registration system
- **Location Management**: Organize properties by locations
- **Category System**: Property categorization and filtering
- **Reservation System**: Book and manage property reservations
- **Admin Dashboard**: Complete admin panel for managing the platform
- **Image & Video Upload**: Support for property media with Cloudinary integration
- **Favorites System**: Users can save favorite properties
- **Contact System**: Handle customer inquiries
- **Statistics Dashboard**: Analytics and reporting

## 🛠️ Technology Stack

### Backend
- **Laravel 11**: PHP framework
- **MySQL**: Database
- **Sanctum**: API authentication
- **Cloudinary**: Image and video storage

### Frontend
- **React 18**: JavaScript framework
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **React Router**: Navigation
- **Axios**: HTTP client

## 📋 Prerequisites

- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer
- Git

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd sakani
```

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
```

## 🌍 Environment Configuration

### Backend (.env)
```env
APP_NAME=Sakani
APP_ENV=production
APP_KEY=<generated-key>
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sakani
DB_USERNAME=<your-db-user>
DB_PASSWORD=<your-db-password>

CLOUDINARY_URL=<your-cloudinary-url>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

## 🚀 Deployment

This project includes automated deployment via GitHub Actions.

### Server Setup Requirements

1. **SSH Access**: Ensure your server has SSH access configured
2. **Git**: Install Git on your server
3. **PHP & Composer**: Install PHP 8.2+ and Composer
4. **Node.js & NPM**: Install Node.js 18+ and NPM
5. **Web Server**: Configure Apache/Nginx to serve the application

### GitHub Secrets Configuration

Add these secrets to your GitHub repository:

- `HOST`: Your server IP address
- `USERNAME`: SSH username
- `SSH_KEY`: Private SSH key for server access
- `PORT`: SSH port (usually 22)
- `PROJECT_PATH`: Full path to your project on the server

### Deployment Process

1. **Push to Main Branch**: 
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Automatic Deployment**: 
   - GitHub Actions will automatically trigger
   - Tests will run
   - If tests pass, deployment to server begins
   - The `deploy.sh` script will execute on your server

### Manual Deployment

If you need to deploy manually:

```bash
./deploy.sh
```

## 📁 Project Structure

```
sakani/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── .github/workflows/      # GitHub Actions
├── deploy.sh              # Deployment script
└── README.md
```

## 🔐 Security

- Environment variables for sensitive data
- CORS configured for frontend-backend communication
- Input sanitization and validation
- File upload validation
- Authentication middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📞 Support

For support and questions, please contact [your-email@domain.com]

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.