import os
from pathlib import Path
from dotenv import load_dotenv
import dotenv

try:
    import dj_database_url
except ImportError:  # pragma: no cover - local editor fallback before deps are installed
    dj_database_url = None

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"


def _split_csv_env(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


ALLOWED_HOSTS = _split_csv_env("ALLOWED_HOSTS", "localhost,127.0.0.1")
render_hostname = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip()
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "report_generator",
]

CSRF_TRUSTED_ORIGINS = [
    "https://interndo.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL", "")
backend_url = os.getenv("BACKEND_URL", "")

if render_hostname:
    render_origin = f"https://{render_hostname}"
    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)

if frontend_url:
    normalized_frontend = frontend_url.rstrip("/")
    if normalized_frontend not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(normalized_frontend)

if backend_url:
    normalized_backend = backend_url.rstrip("/")
    if normalized_backend not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(normalized_backend)

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Render terminates TLS at the proxy; this keeps CSRF/session logic aware of HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True


ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "report_generator.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.JSONParser",
    ],
}

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"
os.makedirs(MEDIA_ROOT, exist_ok=True)

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url:
    normalized_frontend = frontend_url.rstrip("/")
    if normalized_frontend not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(normalized_frontend)

if backend_url:
    normalized_backend = backend_url.rstrip("/")
    if normalized_backend not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(normalized_backend)

CORS_ALLOW_CREDENTIALS = True

force_cross_site_cookies = os.getenv("FORCE_CROSS_SITE_COOKIES", "False") == "True"
frontend_is_local = "localhost" in frontend_url or "127.0.0.1" in frontend_url
backend_is_https = backend_url.startswith("https://")

# In production we often serve frontend and backend on different origins.
# If FRONTEND_URL is missing, fall back to BACKEND_URL + non-debug mode.
is_cross_site_frontend = force_cross_site_cookies or (
    (bool(frontend_url) and not frontend_is_local)
    or (not DEBUG and backend_is_https)
)

if is_cross_site_frontend:
    # Required for browser to include session cookies on cross-site XHR/fetch.
    SESSION_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
elif not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.server": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
