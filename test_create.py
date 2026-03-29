import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommers.models import Category

try:
    c = Category.objects.create(name="Tech", slug="tech")
    print(f"Category created: {c.id}")
except Exception as e:
    print(f"Error: {e}")
