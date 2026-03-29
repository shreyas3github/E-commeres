Initailly as you enter the project structure "activate the env" : "env\Scripts\Activate.ps1",
the cd frontend and run "npm install" and "npm run dev",
cd backend and run "python manage.py runserver"
also in new tab run the -- "celery -A backend worker -l INFO -P eventlet"
and in new tab run the -- "celery -A backend beat -l INFO"
"python manage.py makemigrations " and "python manage.py migrate"
code to add MySQL 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'ecommers',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

for Mongobd 
DATABASES = {
    'default': {
        'ENGINE': 'djongo',
        'NAME': 'ecommers',
        'HOST': 'localhost',
        'PORT': 27017,
    }
}

